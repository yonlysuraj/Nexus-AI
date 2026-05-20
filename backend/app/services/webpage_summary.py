"""Webpage Summarizer — Service Layer.

Handles URL scraping, content cleaning, SSRF protection,
and LLM-based summarization.
"""

import ipaddress
import json
import re
import time
from typing import AsyncGenerator, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup, Comment
from loguru import logger

from app.core.ai_engine import ai_engine
from app.core.config import settings
from app.core.prompts.webpage_summary import SYSTEM_PROMPT, build_user_prompt

# ────────────────────────────────────────────
# SSRF Protection
# ────────────────────────────────────────────

_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def _is_safe_url(url: str) -> bool:
    """Validate that a URL does not point to a private/internal network."""
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    # Block obvious internal hostnames
    if hostname in ("localhost", "0.0.0.0"):
        return False

    try:
        addr = ipaddress.ip_address(hostname)
        for network in _BLOCKED_NETWORKS:
            if addr in network:
                return False
    except ValueError:
        # hostname is a domain, not an IP — that's fine
        pass

    return True


# ────────────────────────────────────────────
# HTML Content Extraction
# ────────────────────────────────────────────

_STRIP_TAGS = [
    "script", "style", "nav", "header", "footer",
    "aside", "iframe", "noscript", "form", "svg",
    "button", "input", "select", "textarea",
]


def _clean_html(html: str) -> tuple[str, str]:
    """Extract main text content and page title from raw HTML.

    Returns (cleaned_text, page_title).
    """
    soup = BeautifulSoup(html, "lxml")

    # Extract title
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)

    # Remove unwanted tags
    for tag_name in _STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # Remove HTML comments
    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()

    # Try to find main content area
    main_content = (
        soup.find("main")
        or soup.find("article")
        or soup.find("div", {"role": "main"})
        or soup.find("div", class_=re.compile(r"(content|article|post|entry)", re.I))
        or soup.body
        or soup
    )

    # Get text with spacing
    text = main_content.get_text(separator="\n", strip=True)

    # Collapse excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip(), title


# ────────────────────────────────────────────
# URL Fetching
# ────────────────────────────────────────────

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


async def _fetch_with_httpx(url: str) -> Optional[str]:
    """Fast fetch using httpx. Returns HTML string or None on failure."""
    try:
        async with httpx.AsyncClient(
            follow_redirects=True, timeout=15.0, headers=_HEADERS
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                logger.warning(f"Non-HTML content type: {content_type}")
                return None

            return response.text
    except Exception as e:
        logger.warning(f"httpx fetch failed for {url}: {e}")
        return None


async def _fetch_with_playwright(url: str) -> Optional[str]:
    """Fallback fetch using Playwright for JS-rendered pages."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            # Wait a bit for JS to render
            await page.wait_for_timeout(2000)
            html = await page.content()
            await browser.close()
            return html
    except Exception as e:
        logger.warning(f"Playwright fetch failed for {url}: {e}")
        return None


async def _fetch_url(url: str) -> tuple[str, str]:
    """Fetch and clean a URL. Returns (cleaned_text, page_title).

    Tries httpx first, falls back to Playwright for JS-heavy pages.
    Raises ValueError on failure.
    """
    # Try httpx first (fast)
    html = await _fetch_with_httpx(url)

    if html:
        text, title = _clean_html(html)
        # If we got very little text, the page might need JS rendering
        if len(text) >= 200:
            return text, title
        logger.info("httpx returned thin content, trying Playwright fallback...")

    # Playwright fallback
    html = await _fetch_with_playwright(url)
    if html:
        text, title = _clean_html(html)
        if len(text) >= 50:
            return text, title

    raise ValueError(
        "Could not extract meaningful content from this URL. "
        "The page may require authentication, be behind a paywall, "
        "or block automated access."
    )


# ────────────────────────────────────────────
# Public API
# ────────────────────────────────────────────

async def summarize_webpage(url: str, level: str) -> dict:
    """Scrape a URL, extract content, and generate a summary."""
    if not _is_safe_url(url):
        raise ValueError(
            "This URL cannot be accessed. "
            "Private/internal network addresses are blocked for security."
        )

    start = time.perf_counter()

    # Fetch and clean
    text, title = await _fetch_url(url)
    logger.info(f"Extracted {len(text)} chars from {url} (title: {title!r})")

    # Summarize with LLM
    prompt = build_user_prompt(text, level)
    summary = await ai_engine.generate(
        prompt=prompt,
        system=SYSTEM_PROMPT,
        temperature=0.4,
    )

    elapsed_ms = (time.perf_counter() - start) * 1000

    return {
        "success": True,
        "url": url,
        "title": title,
        "summary": summary.strip(),
        "level": level,
        "content_length": len(text),
        "model_used": settings.DEFAULT_MODEL,
        "processing_time_ms": round(elapsed_ms, 2),
    }


async def stream_webpage_summary(url: str, level: str) -> AsyncGenerator[str, None]:
    """Scrape a URL, then stream the summary via SSE."""
    if not _is_safe_url(url):
        yield f"data: {json.dumps({'error': 'Private/internal URLs are blocked for security.'})}\n\n"
        return

    try:
        text, title = await _fetch_url(url)
    except ValueError as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return

    # Send metadata first
    yield f"data: {json.dumps({'meta': {'title': title, 'content_length': len(text)}})}\n\n"

    prompt = build_user_prompt(text, level)

    try:
        async for chunk in ai_engine.generate_stream(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            temperature=0.4,
        ):
            yield f"data: {json.dumps({'token': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        logger.error(f"Webpage summary streaming failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

"""LinkedIn Post Writer — Service Layer."""

import re
import time
import json
from typing import AsyncGenerator
from loguru import logger

from app.core.ai_engine import ai_engine
from app.core.config import settings
from app.core.prompts.linkedin import SYSTEM_PROMPT, build_user_prompt


def _extract_hashtags(text: str) -> list[str]:
    """Pull all #hashtags out of the generated post."""
    return re.findall(r"#\w+", text)


async def generate_linkedin_post(
    bullets: str, tone: str
) -> dict:
    """Generate a LinkedIn post synchronously and return structured data."""
    prompt = build_user_prompt(bullets, tone)
    start = time.perf_counter()

    post_text = await ai_engine.generate(
        prompt=prompt,
        system=SYSTEM_PROMPT,
        temperature=0.8,
    )

    elapsed_ms = (time.perf_counter() - start) * 1000
    hashtags = _extract_hashtags(post_text)

    logger.info(
        f"LinkedIn post generated — {len(post_text)} chars, "
        f"{len(hashtags)} hashtags, {elapsed_ms:.0f}ms"
    )

    return {
        "success": True,
        "post": post_text.strip(),
        "hashtags": hashtags,
        "character_count": len(post_text.strip()),
        "model_used": settings.DEFAULT_MODEL,
        "processing_time_ms": round(elapsed_ms, 2),
    }


async def stream_linkedin_post(
    bullets: str, tone: str
) -> AsyncGenerator[str, None]:
    """Stream a LinkedIn post as Server-Sent Events."""
    prompt = build_user_prompt(bullets, tone)

    try:
        async for chunk in ai_engine.generate_stream(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            temperature=0.8,
        ):
            yield f"data: {json.dumps({'token': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        logger.error(f"LinkedIn streaming failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

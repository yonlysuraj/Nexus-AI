"""README Auto-Generator — Service Layer.

Handles GitHub repo analysis, tech stack detection, and LLM-based
README generation.
"""

import json
import re
import time
from typing import AsyncGenerator, Optional
from urllib.parse import urlparse

import httpx
from loguru import logger

from app.core.ai_engine import ai_engine
from app.core.config import settings
from app.core.prompts.readme_gen import SYSTEM_PROMPT, build_user_prompt

# ────────────────────────────────────────────
# GitHub URL Parsing
# ────────────────────────────────────────────

_GITHUB_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/\s#?]+)"
)


def _parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo name from a GitHub URL.

    Returns (owner, repo). Raises ValueError on invalid URL.
    """
    match = _GITHUB_PATTERN.match(url.strip().rstrip("/"))
    if not match:
        raise ValueError(
            "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
        )
    owner, repo = match.group(1), match.group(2)
    # Strip .git suffix if present
    repo = repo.removesuffix(".git")
    return owner, repo


# ────────────────────────────────────────────
# GitHub API — Fetch Repo Tree
# ────────────────────────────────────────────

_GITHUB_API = "https://api.github.com"
_API_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "NexusAI-README-Generator/1.0",
}

# README filenames to ALWAYS exclude from file fetching
_README_FILENAMES = {
    "readme.md", "readme.rst", "readme.txt", "readme",
    "readme.markdown", "readme.adoc",
}

# Config/dependency files we want to fetch for tech stack context
# NOTE: README files are intentionally NOT in this list
_KEY_FILES = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "composer.json",
]


async def _fetch_repo_tree(
    owner: str, repo: str
) -> tuple[list[dict], Optional[str]]:
    """Fetch the full file tree from GitHub API.

    Returns (tree_items, default_branch).
    Raises ValueError if repo not found.
    """
    async with httpx.AsyncClient(headers=_API_HEADERS, timeout=15.0) as client:
        # Get default branch
        repo_resp = await client.get(f"{_GITHUB_API}/repos/{owner}/{repo}")
        if repo_resp.status_code == 404:
            raise ValueError(
                f"Repository '{owner}/{repo}' not found. "
                "Make sure the repo exists and is public."
            )
        repo_resp.raise_for_status()
        default_branch = repo_resp.json().get("default_branch", "main")

        # Get recursive tree
        tree_resp = await client.get(
            f"{_GITHUB_API}/repos/{owner}/{repo}/git/trees/{default_branch}",
            params={"recursive": "1"},
        )
        tree_resp.raise_for_status()
        data = tree_resp.json()

        return data.get("tree", []), default_branch


async def _fetch_file_content(
    owner: str, repo: str, path: str, branch: str
) -> Optional[str]:
    """Fetch raw file content from GitHub."""
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(raw_url)
            if resp.status_code == 200:
                return resp.text
    except Exception:
        pass
    return None


# ────────────────────────────────────────────
# File Tree Formatting
# ────────────────────────────────────────────


def _format_tree(items: list[dict], max_items: int = 80) -> str:
    """Format GitHub tree items into a readable directory tree string."""
    paths = sorted(
        item["path"]
        for item in items
        if item.get("type") in ("blob", "tree")
        # Skip common noisy directories
        and not any(
            part in item["path"].split("/")
            for part in [
                "node_modules", ".git", "__pycache__", ".next",
                ".venv", "venv", "dist", "build", ".cache",
                ".idea", ".vscode",
            ]
        )
    )

    if len(paths) > max_items:
        paths = paths[:max_items]
        paths.append(f"... and {len(items) - max_items} more files")

    return "\n".join(paths)


# ────────────────────────────────────────────
# Tech Stack Detection
# ────────────────────────────────────────────

_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".jsx": "JavaScript (React)",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".kt": "Kotlin",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
    ".cpp": "C++",
    ".c": "C",
    ".swift": "Swift",
    ".dart": "Dart",
    ".lua": "Lua",
    ".r": "R",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir",
}

_FRAMEWORK_INDICATORS = {
    "next.config.js": "Next.js",
    "next.config.ts": "Next.js",
    "next.config.mjs": "Next.js",
    "nuxt.config.js": "Nuxt.js",
    "nuxt.config.ts": "Nuxt.js",
    "angular.json": "Angular",
    "svelte.config.js": "SvelteKit",
    "vite.config.js": "Vite",
    "vite.config.ts": "Vite",
    "webpack.config.js": "Webpack",
    "tailwind.config.js": "Tailwind CSS",
    "tailwind.config.ts": "Tailwind CSS",
    "docker-compose.yml": "Docker Compose",
    "docker-compose.yaml": "Docker Compose",
    "Dockerfile": "Docker",
    "requirements.txt": "pip",
    "pyproject.toml": "Python (pyproject)",
    "Pipfile": "Pipenv",
    "Cargo.toml": "Rust (Cargo)",
    "go.mod": "Go Modules",
    "pom.xml": "Maven",
    "build.gradle": "Gradle",
    "Gemfile": "Ruby (Bundler)",
    "composer.json": "PHP (Composer)",
    "Makefile": "Make",
    ".github/workflows": "GitHub Actions",
    "alembic.ini": "Alembic (DB migrations)",
}


def _detect_tech_stack(items: list[dict]) -> dict:
    """Analyze file tree to detect languages, frameworks, and tools."""
    languages = set()
    frameworks = set()
    tools = set()
    package_manager = None

    filenames = set()
    for item in items:
        if item.get("type") != "blob":
            continue
        path = item["path"]
        filename = path.split("/")[-1].lower()
        filenames.add(filename)

        # Detect languages by extension
        for ext, lang in _LANGUAGE_MAP.items():
            if filename.endswith(ext):
                languages.add(lang)

        # Detect frameworks/tools by filename
        for indicator, name in _FRAMEWORK_INDICATORS.items():
            if filename == indicator or path.endswith(indicator):
                if "pip" in name or "Bundler" in name or "Composer" in name or "Cargo" in name:
                    package_manager = name
                elif "Docker" in name or "Make" in name or "GitHub" in name or "Alembic" in name:
                    tools.add(name)
                else:
                    frameworks.add(name)

    # Infer package manager
    if "package-lock.json" in filenames:
        package_manager = "npm"
    elif "pnpm-lock.yaml" in filenames:
        package_manager = "pnpm"
    elif "yarn.lock" in filenames:
        package_manager = "yarn"
    elif "poetry.lock" in filenames:
        package_manager = "Poetry"

    return {
        "languages": sorted(languages),
        "frameworks": sorted(frameworks),
        "tools": sorted(tools),
        "package_manager": package_manager,
    }


# ────────────────────────────────────────────
# Core Context File Fetching
# ────────────────────────────────────────────


def _is_readme_file(path: str) -> bool:
    """Return True if the path is a README file that should be excluded."""
    filename = path.split("/")[-1].lower()
    return filename in _README_FILENAMES


async def _fetch_all_context_files(
    owner: str, repo: str, items: list[dict], branch: str
) -> dict[str, str]:
    """Identify and fetch key configuration and core source files for codebase context.

    README files are explicitly excluded — we never want to feed the existing
    README to the LLM, as it will reproduce it instead of generating a new one.
    """
    file_contents = {}
    core_files_to_fetch = []

    # 1. Add standard config files (excluding any README)
    for item in items:
        if item.get("type") == "blob" and item["path"] in _KEY_FILES:
            if not _is_readme_file(item["path"]):
                core_files_to_fetch.append(item["path"])

    # 2. Heuristically identify core source files
    source_candidates = []
    core_keywords = [
        "main", "app", "orchestrator", "runner", "server",
        "index", "workflow", "pipeline", "agent",
    ]

    for item in items:
        if item.get("type") != "blob":
            continue
        path = item["path"]
        filename = path.split("/")[-1].lower()

        # Hard-exclude README files
        if _is_readme_file(path):
            continue

        # Skip non-code, config, or test files
        if any(
            part in path.split("/")
            for part in [
                "tests", "test", "node_modules", ".git", "__pycache__",
                ".venv", "venv", "dist", "build",
            ]
        ):
            continue

        # Only target key source extensions
        if not any(
            filename.endswith(ext)
            for ext in [".py", ".ts", ".js", ".go", ".rs", ".tsx"]
        ):
            continue

        # Prioritize files with core keywords in name
        priority = 0
        if any(kw in filename for kw in core_keywords):
            priority += 2
        if filename in [
            "main.py", "app.py", "server.py", "index.ts", "index.js",
            "orchestrator.py", "runner.py",
        ]:
            priority += 5

        source_candidates.append((item["path"], priority))

    # Sort candidates by priority desc, path length asc
    source_candidates.sort(key=lambda x: (-x[1], len(x[0])))

    # Take top 30 source candidates not already in key files (allows all agents to be fetched)
    for path, _ in source_candidates[:30]:
        if path not in core_files_to_fetch:
            core_files_to_fetch.append(path)

    # Fetch all identified files (capped to 40 to leverage massive 128k LLM contexts)
    for path in core_files_to_fetch[:40]:
        # Final safety check — never fetch README files
        if _is_readme_file(path):
            logger.debug(f"Skipping README file: {path}")
            continue
        content = await _fetch_file_content(owner, repo, path, branch)
        if content:
            file_contents[path] = content

    logger.info(f"Fetched {len(file_contents)} context files: {list(file_contents.keys())}")
    return file_contents


# ────────────────────────────────────────────
# Public API
# ────────────────────────────────────────────


async def generate_readme(repo_url: str) -> dict:
    """Analyze a GitHub repo and generate a README."""
    owner, repo = _parse_github_url(repo_url)
    repo_name = f"{owner}/{repo}"
    start = time.perf_counter()

    # Fetch tree
    items, branch = await _fetch_repo_tree(owner, repo)
    file_tree = _format_tree(items)
    tech_stack = _detect_tech_stack(items)

    logger.info(
        f"Repo {repo_name}: {len(items)} items, "
        f"languages={tech_stack['languages']}, "
        f"frameworks={tech_stack['frameworks']}"
    )

    # Fetch key file contents (README files excluded inside this function)
    file_contents = await _fetch_all_context_files(owner, repo, items, branch)

    # Generate README
    prompt = build_user_prompt(repo_name, file_tree, tech_stack, file_contents)
    
    logger.info(f"Context files passed to LLM: {list(file_contents.keys())}")
    logger.info(f"Prompt length (chars): {len(prompt)}")

    readme = await ai_engine.generate(
        prompt=prompt,
        system=SYSTEM_PROMPT,
        temperature=0.6,
        max_tokens=8000,
    )

    elapsed_ms = (time.perf_counter() - start) * 1000

    return {
        "success": True,
        "repo_name": repo_name,
        "readme": readme.strip(),
        "tech_stack": tech_stack,
        "file_count": len([i for i in items if i.get("type") == "blob"]),
        "model_used": settings.DEFAULT_MODEL,
        "processing_time_ms": round(elapsed_ms, 2),
    }


async def stream_readme(repo_url: str) -> AsyncGenerator[str, None]:
    """Analyze a GitHub repo and stream the README via SSE."""
    try:
        owner, repo = _parse_github_url(repo_url)
    except ValueError as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return

    repo_name = f"{owner}/{repo}"

    try:
        items, branch = await _fetch_repo_tree(owner, repo)
    except ValueError as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return
    except Exception as e:
        yield f"data: {json.dumps({'error': f'Failed to fetch repository: {e}'})}\n\n"
        return

    file_tree = _format_tree(items)
    tech_stack = _detect_tech_stack(items)
    file_count = len([i for i in items if i.get("type") == "blob"])

    # Send metadata
    yield f"data: {json.dumps({'meta': {'repo_name': repo_name, 'tech_stack': tech_stack, 'file_count': file_count}})}\n\n"

    # Fetch key files (README files excluded inside this function)
    file_contents = await _fetch_all_context_files(owner, repo, items, branch)

    prompt = build_user_prompt(repo_name, file_tree, tech_stack, file_contents)
    
    logger.info(f"Context files passed to LLM: {list(file_contents.keys())}")
    logger.info(f"Prompt length (chars): {len(prompt)}")

    try:
        async for chunk in ai_engine.generate_stream(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            temperature=0.6,
            max_tokens=8000,
        ):
            yield f"data: {json.dumps({'token': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        logger.error(f"README streaming failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
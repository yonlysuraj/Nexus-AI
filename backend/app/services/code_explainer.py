"""Codebase Explainer — Service Layer."""

import json
import re
import time
from typing import AsyncGenerator

from loguru import logger

from app.core.ai_engine import ai_engine
from app.core.config import settings
from app.core.prompts.code_explainer import SYSTEM_PROMPT, build_user_prompt


_MAX_CODE_CHARS = 12000


def _normalize_language(language: str | None) -> str:
    if not language:
        return ""
    return language.strip().lower()


def _detect_language(code: str, language_hint: str | None) -> str:
    hint = _normalize_language(language_hint)
    if hint and hint not in ("auto", "detect"):
        return hint

    lowered = code.lower()

    # Python heuristics
    if re.search(r"^\s*def\s+\w+\s*\(", code, re.MULTILINE) or "import " in lowered:
        return "python"

    # Java heuristics
    if re.search(r"^\s*(public|private|protected)\s+class\s+\w+", code, re.MULTILINE):
        return "java"
    if "system.out" in lowered or "public static void" in lowered:
        return "java"

    # TypeScript heuristics
    if re.search(r"^\s*interface\s+\w+", code, re.MULTILINE) or ": string" in lowered:
        return "typescript"

    # JavaScript heuristics
    if re.search(r"^\s*function\s+\w+\s*\(", code, re.MULTILINE) or "console.log" in lowered:
        return "javascript"

    return "unknown"


def _parse_code(code: str, language: str) -> tuple[dict, dict]:
    lines = code.splitlines()
    total_lines = len(lines)
    non_empty_lines = 0
    comment_lines = 0
    in_block_comment = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        non_empty_lines += 1

        if in_block_comment:
            comment_lines += 1
            if "*/" in stripped:
                in_block_comment = False
            continue

        if stripped.startswith("#") or stripped.startswith("//"):
            comment_lines += 1
            continue

        if "/*" in stripped:
            comment_lines += 1
            if "*/" not in stripped:
                in_block_comment = True

    functions: list[str] = []
    classes: list[str] = []
    imports: list[str] = []

    if language == "python":
        functions = re.findall(r"^\s*def\s+([A-Za-z_]\w*)\s*\(", code, re.MULTILINE)
        classes = re.findall(r"^\s*class\s+([A-Za-z_]\w*)\s*[:\(]", code, re.MULTILINE)
        imports = [
            match.strip()
            for match in re.findall(r"^\s*(import\s+[^#\n]+|from\s+[^#\n]+)", code, re.MULTILINE)
        ]
    elif language in ("javascript", "typescript"):
        functions = re.findall(r"^\s*function\s+([A-Za-z_]\w*)\s*\(", code, re.MULTILINE)
        functions += re.findall(
            r"^\s*(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\(.*\)\s*=>",
            code,
            re.MULTILINE,
        )
        classes = re.findall(r"^\s*class\s+([A-Za-z_]\w*)\b", code, re.MULTILINE)
        imports = re.findall(r"^\s*import\s+[^;\n]+", code, re.MULTILINE)
    elif language == "java":
        classes = re.findall(
            r"^\s*(?:public|private|protected)?\s*class\s+([A-Za-z_]\w*)",
            code,
            re.MULTILINE,
        )
        functions = re.findall(
            r"^\s*(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_]\w*)\s*\(",
            code,
            re.MULTILINE,
        )
        imports = re.findall(r"^\s*import\s+[^;\n]+", code, re.MULTILINE)
    else:
        classes = re.findall(r"^\s*class\s+([A-Za-z_]\w*)\b", code, re.MULTILINE)

    stats = {
        "total_lines": total_lines,
        "non_empty_lines": non_empty_lines,
        "comment_lines": comment_lines,
        "function_count": len(set(functions)),
        "class_count": len(set(classes)),
        "import_count": len(set(imports)),
    }

    symbols = {
        "functions": sorted(set(functions))[:10],
        "classes": sorted(set(classes))[:10],
        "imports": sorted(set(imports))[:10],
    }

    return stats, symbols


async def generate_code_explanation(
    code: str, level: str, language: str | None
) -> dict:
    """Generate a code explanation synchronously."""
    detected_language = _detect_language(code, language)
    stats, symbols = _parse_code(code, detected_language)

    snippet = code.strip()[:_MAX_CODE_CHARS]
    if len(code) > _MAX_CODE_CHARS:
        snippet += "\n\n... [truncated]"

    prompt = build_user_prompt(
        code=snippet,
        level=level,
        language=detected_language,
        stats=stats,
        symbols=symbols,
    )

    start = time.perf_counter()
    explanation = await ai_engine.generate(
        prompt=prompt,
        system=SYSTEM_PROMPT,
        temperature=0.3,
    )
    elapsed_ms = (time.perf_counter() - start) * 1000

    logger.info(
        "Code explained — %s chars, %s functions, %s classes, %.0fms",
        len(code),
        stats.get("function_count", 0),
        stats.get("class_count", 0),
        elapsed_ms,
    )

    return {
        "success": True,
        "explanation": explanation.strip(),
        "detected_language": detected_language,
        "stats": stats,
        "model_used": settings.DEFAULT_MODEL,
        "processing_time_ms": round(elapsed_ms, 2),
    }


async def stream_code_explanation(
    code: str, level: str, language: str | None
) -> AsyncGenerator[str, None]:
    """Stream a code explanation via SSE."""
    detected_language = _detect_language(code, language)
    stats, symbols = _parse_code(code, detected_language)

    snippet = code.strip()[:_MAX_CODE_CHARS]
    if len(code) > _MAX_CODE_CHARS:
        snippet += "\n\n... [truncated]"

    prompt = build_user_prompt(
        code=snippet,
        level=level,
        language=detected_language,
        stats=stats,
        symbols=symbols,
    )

    # Send metadata first
    yield f"data: {json.dumps({'meta': {'detected_language': detected_language, 'stats': stats}})}\n\n"

    try:
        async for chunk in ai_engine.generate_stream(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            temperature=0.3,
        ):
            yield f"data: {json.dumps({'token': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as e:
        logger.error(f"Code explainer streaming failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

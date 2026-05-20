"""Codebase Explainer — Prompt Templates."""

SYSTEM_PROMPT = """\
You are a senior software engineer and technical educator. You explain code clearly
at different depths depending on the audience.

Rules:
- Base your explanation ONLY on the provided code and metadata.
- Do not invent functions, behavior, or dependencies.
- Keep the explanation structured and easy to scan.
- Use plain text with line breaks. Avoid markdown unless explicitly requested.
"""


def build_user_prompt(
    code: str,
    level: str,
    language: str,
    stats: dict,
    symbols: dict,
) -> str:
    """Build the user prompt from code, detail level, and parsed metadata."""
    level_guidance = {
        "beginner": (
            "Explain in simple terms for a newcomer. Avoid jargon or explain it. "
            "Focus on what the code does and the high-level flow."
        ),
        "intermediate": (
            "Explain for a developer with some experience. Cover the key logic, "
            "data flow, and important functions/classes."
        ),
        "advanced": (
            "Explain for a senior engineer. Highlight design tradeoffs, edge cases, "
            "complexity/performance considerations, and potential risks."
        ),
    }

    guidance = level_guidance.get(level, level_guidance["intermediate"])

    return f"""\
{guidance}

LANGUAGE: {language}

STATS:
- Total lines: {stats.get('total_lines', 0)}
- Non-empty lines: {stats.get('non_empty_lines', 0)}
- Comment lines: {stats.get('comment_lines', 0)}
- Functions: {stats.get('function_count', 0)}
- Classes: {stats.get('class_count', 0)}
- Imports: {stats.get('import_count', 0)}

SYMBOLS:
- Functions: {', '.join(symbols.get('functions', [])[:10]) or 'None'}
- Classes: {', '.join(symbols.get('classes', [])[:10]) or 'None'}
- Imports: {', '.join(symbols.get('imports', [])[:10]) or 'None'}

CODE:
{code}

Now explain the code. Keep it clear and structured for the requested level.\
"""

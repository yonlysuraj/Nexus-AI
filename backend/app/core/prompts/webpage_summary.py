"""Webpage Summarizer — Prompt Templates."""

SYSTEM_PROMPT = """\
You are an expert content analyst and summarizer. You read web articles, blog \
posts, documentation, and news pieces, then produce clean, accurate summaries \
that capture the essential information.

Rules:
- Be factual. Never invent information that isn't in the source text.
- Preserve key data points: names, numbers, dates, statistics.
- Use clear, concise language. Avoid filler phrases.
- Output in plain text with line breaks for readability.
- Do NOT use markdown formatting unless specifically asked.\
"""


def build_user_prompt(content: str, level: str) -> str:
    """Build the user prompt from scraped page content and summary level."""
    level_instructions = {
        "tldr": (
            "Provide a TL;DR summary in 1-2 sentences. "
            "Capture the single most important takeaway from this content."
        ),
        "key_points": (
            "Extract 5-7 key points from this content as a numbered list. "
            "Each point should be 1-2 sentences. Focus on the most important "
            "facts, arguments, and conclusions."
        ),
        "detailed": (
            "Write a detailed summary in 2-3 paragraphs. "
            "Cover the main thesis, supporting arguments, key data points, "
            "and conclusions. Preserve the logical flow of the original content."
        ),
    }

    instruction = level_instructions.get(level, level_instructions["key_points"])

    # Truncate very long content to fit within context window
    max_chars = 12000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += "\n\n[... content truncated for length ...]"

    return f"""\
{instruction}

---
SOURCE CONTENT:
{truncated}
---

Summarize the above content now.\
"""

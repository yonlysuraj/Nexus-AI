"""Prompts for voice memo task extraction."""

VOICE_MEMO_TASK_EXTRACTION_PROMPT = """You are an expert task manager and productivity assistant. Your job is to extract actionable tasks from a voice memo transcript.

Analyze the following transcript and extract ALL distinct tasks or action items mentioned.

For each task, identify:
1. **Task description** (concise, action-oriented, 5-15 words)
2. **Priority** (High / Medium / Low based on urgency or emphasis in the memo)
3. **Category** (optional: Work / Personal / Urgent / Follow-up / Idea / Research)
4. **Time estimate** (optional: e.g., "15 min", "1 hour", "2 hours")

Output ONLY valid JSON with no additional text:

```json
{{
  "tasks": [
    {{"description": "...", "priority": "High", "category": "Work", "time_estimate": "30 min"}},
    {{"description": "...", "priority": "Medium", "category": "Personal", "time_estimate": null}},
    {{...}}
  ],
  "summary": "1-2 sentence summary of the memo's main purpose"
}}
```

**Guidelines:**
- Extract 3-15 tasks per memo (fewer if it's a brief memo)
- If a task lacks explicit priority, infer from context and urgency
- If time estimate is not mentioned, leave as null
- Combine related subtasks into one task
- Skip vague statements ("I should probably...", "maybe later")
- Keep descriptions specific and actionable
- If the memo mentions a deadline, add to description (e.g., "Submit proposal by Friday")

**Transcript:**
{transcript}

Output JSON only:"""

VOICE_MEMO_TASK_EXTRACTION_DETAILED = """You are an expert task manager and productivity assistant. Your job is to extract actionable tasks from a voice memo transcript with detailed metadata.

Analyze the transcript and extract ALL distinct tasks or action items.

For each task, identify:
1. **Description** (concise action, 5-15 words)
2. **Priority** (High / Medium / Low)
3. **Category** (Work / Personal / Urgent / Follow-up / Idea / Research / Meeting / Bug / Feature)
4. **Time estimate** (e.g., "15 min", "1 hour")
5. **Notes** (optional: context or sub-steps)
6. **Depends on** (optional: task dependencies or blockers)

Output ONLY valid JSON:

```json
{{
  "tasks": [
    {{
      "description": "...",
      "priority": "High",
      "category": "Work",
      "time_estimate": "1 hour",
      "notes": "Required for Q2 launch",
      "depends_on": null
    }},
    {{...}}
  ],
  "summary": "Brief summary",
  "metadata": {{
    "total_tasks": 5,
    "high_priority_count": 2,
    "estimated_total_time": "3 hours"
  }}
}}
```

**Transcript:**
{transcript}

Output JSON only:"""

VOICE_MEMO_TASK_EXTRACTION_MINIMAL = """Extract actionable tasks from this voice memo. For each task, provide:
- description (short action phrase)
- priority (High / Medium / Low)

Output ONLY JSON:
```json
{{
  "tasks": [
    {{"description": "...", "priority": "High"}},
    {{...}}
  ]
}}
```

**Transcript:**
{transcript}

JSON only:"""

# Extraction mode options
EXTRACTION_MODES = {
    "structured": {
        "prompt": VOICE_MEMO_TASK_EXTRACTION_PROMPT,
        "description": "Structured extraction with priority, category, and time estimates",
    },
    "detailed": {
        "prompt": VOICE_MEMO_TASK_EXTRACTION_DETAILED,
        "description": "Detailed extraction with notes and dependencies",
    },
    "minimal": {
        "prompt": VOICE_MEMO_TASK_EXTRACTION_MINIMAL,
        "description": "Minimal extraction: description + priority only",
    },
}


def get_task_extraction_prompt(mode: str = "structured", transcript: str = "") -> str:
    """
    Get task extraction prompt for specified mode.
    
    Args:
        mode: Extraction mode ('structured', 'detailed', 'minimal')
        transcript: The voice memo transcript
    
    Returns:
        Formatted prompt ready for LLM
    
    Raises:
        ValueError: If mode is not supported
    """
    if mode not in EXTRACTION_MODES:
        raise ValueError(
            f"Unknown extraction mode: {mode}. "
            f"Supported: {', '.join(EXTRACTION_MODES.keys())}"
        )
    
    prompt_template = EXTRACTION_MODES[mode]["prompt"]
    return prompt_template.format(transcript=transcript)


def get_available_modes() -> dict:
    """Get available extraction modes and descriptions."""
    return {
        mode: data["description"] for mode, data in EXTRACTION_MODES.items()
    }

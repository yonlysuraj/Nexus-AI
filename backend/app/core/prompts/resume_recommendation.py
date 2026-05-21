"""
Resume optimization prompt templates.
"""

# ============================================================================
# RESUME SECTION REWRITE
# ============================================================================

RESUME_REWRITE_PROMPT = """You are an expert resume writer optimizing resumes for ATS systems and recruiter visibility.

Rewrite the following {section_type} section to naturally incorporate these keywords: {keywords}

Original {section_type}:
{original_text}

Job Context: {job_context}

Requirements for rewrite:
1. Keep the same general length (don't expand too much)
2. Maintain authenticity - don't fabricate skills or experience
3. Use professional, action-oriented language
4. Naturally integrate keywords where relevant
5. Start with action verbs (Led, Managed, Developed, Increased, etc.)
6. Use metrics/numbers where possible
7. Keep chronological order if it's experience section
8. Make it ATS-friendly (avoid special characters, use standard formatting)

Rewritten {section_type}:"""

# ============================================================================
# ATS OPTIMIZATION CHECKLIST
# ============================================================================

ATS_OPTIMIZATION_TIPS = [
    "Use clear section headers (Experience, Education, Skills, Summary)",
    "Include keywords from job description throughout your resume",
    "Use standard fonts (Arial, Calibri, Times New Roman, Helvetica)",
    "Avoid graphics, tables, columns, and unusual formatting",
    "Save as PDF (if ATS supports it) or use .docx format",
    "Use bullet points for experience and accomplishments",
    "Include quantifiable metrics (numbers, percentages, dollar amounts)",
    "List technical skills clearly (programming languages, tools, platforms)",
    "Use action verbs to start each bullet (Led, Managed, Developed, Increased)",
    "Include relevant certifications and licenses",
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def get_rewrite_prompt(
    section_type: str,
    original_text: str,
    keywords: list[str],
    job_context: str = ""
) -> str:
    """
    Get formatted resume rewrite prompt.

    Args:
        section_type: Type of section (Summary, Experience, Skills, Projects)
        original_text: Original section text
        keywords: Keywords to incorporate
        job_context: Context about the job

    Returns:
        Formatted prompt for LLM
    """
    keywords_str = ", ".join(keywords[:5])  # Use top 5 keywords

    return RESUME_REWRITE_PROMPT.format(
        section_type=section_type,
        keywords=keywords_str,
        original_text=original_text,
        job_context=job_context or "Not specified",
    )


def get_ats_tips_text() -> str:
    """
    Get formatted ATS optimization tips.

    Returns:
        Formatted tips text
    """
    tips_text = "## ATS Optimization Checklist\n\n"
    for i, tip in enumerate(ATS_OPTIMIZATION_TIPS, 1):
        tips_text += f"{i}. {tip}\n"

    return tips_text

"""
Resume optimizer - Generate optimization suggestions and ATS tips.
"""

from dataclasses import dataclass
from loguru import logger
from app.core.ai_engine import ai_engine


@dataclass
class OptimizationSuggestion:
    """Suggested optimization for a resume section."""
    section_name: str
    original_text: str
    optimized_text: str
    keywords_added: list[str]
    rationale: str


class ResumeOptimizer:
    """Generate optimization suggestions for resumes."""

    @staticmethod
    def generate_suggestions(
        resume_text: str,
        missing_keywords: list[str],
        job_context: str = ""
    ) -> list[OptimizationSuggestion]:
        """
        Generate optimization suggestions for resume sections.

        Args:
            resume_text: Full resume text
            missing_keywords: Keywords missing from resume
            job_context: Context about the job position

        Returns:
            List of OptimizationSuggestion objects
        """
        try:
            # Identify sections to rewrite (2-3 top sections)
            sections_to_rewrite = ResumeOptimizer._select_sections(resume_text, missing_keywords)

            suggestions = []

            for section_name, section_text in sections_to_rewrite:
                try:
                    # Generate rewrite for this section
                    optimized = ResumeOptimizer._generate_rewrite(
                        section_name,
                        section_text,
                        missing_keywords,
                        job_context
                    )

                    if optimized:
                        # Extract keywords added
                        keywords_added = ResumeOptimizer._extract_added_keywords(
                            section_text,
                            optimized,
                            missing_keywords
                        )

                        suggestion = OptimizationSuggestion(
                            section_name=section_name,
                            original_text=section_text,
                            optimized_text=optimized,
                            keywords_added=keywords_added,
                            rationale=f"Incorporates {len(keywords_added)} keywords from job description"
                        )

                        suggestions.append(suggestion)

                except Exception as e:
                    logger.warning(f"Failed to generate suggestion for {section_name}: {str(e)}")
                    continue

            logger.info(f"Generated {len(suggestions)} optimization suggestions")

            return suggestions

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            raise

    @staticmethod
    def _select_sections(resume_text: str, missing_keywords: list[str]) -> list[tuple[str, str]]:
        """
        Select top 2-3 sections to rewrite based on missing keywords.

        Args:
            resume_text: Full resume text
            missing_keywords: Keywords missing from resume

        Returns:
            List of (section_name, section_text) tuples
        """
        sections = []

        # Try to identify sections (common headers)
        section_markers = [
            ("Summary", ["summary", "professional summary", "about", "overview"]),
            ("Experience", ["experience", "work experience", "professional experience"]),
            ("Skills", ["skills", "technical skills", "core competencies"]),
            ("Projects", ["projects", "portfolio", "notable projects"]),
        ]

        text_lower = resume_text.lower()

        for section_name, markers in section_markers:
            for marker in markers:
                if marker in text_lower:
                    # Extract section text (from marker to next section or end)
                    start_idx = text_lower.find(marker)
                    next_marker_idx = len(resume_text)

                    for other_name, other_markers in section_markers:
                        if other_name != section_name:
                            for m in other_markers:
                                if m in text_lower[start_idx + len(marker):]:
                                    idx = start_idx + len(marker) + text_lower[start_idx + len(marker):].find(m)
                                    next_marker_idx = min(next_marker_idx, idx)

                    section_text = resume_text[start_idx:next_marker_idx].strip()

                    # Only include sections with 50+ characters
                    if len(section_text) > 50:
                        sections.append((section_name, section_text[:500]))  # Limit to 500 chars

                    break

        # Return top 2-3 sections (prioritize Experience and Skills)
        priority_order = ["Experience", "Skills", "Summary", "Projects"]
        sorted_sections = sorted(sections, key=lambda x: priority_order.index(x[0]) if x[0] in priority_order else 999)

        return sorted_sections[:3]

    @staticmethod
    def _generate_rewrite(
        section_name: str,
        section_text: str,
        missing_keywords: list[str],
        job_context: str
    ) -> str:
        """
        Generate rewritten section using LLM.

        Args:
            section_name: Name of section (e.g., "Experience")
            section_text: Original section text
            missing_keywords: Keywords to naturally incorporate
            job_context: Context about the job

        Returns:
            Rewritten section text
        """
        # Limit keywords to top 5 most relevant
        keywords_to_use = missing_keywords[:5]

        prompt = f"""Rewrite the following resume {section_name} section to naturally incorporate these keywords: {', '.join(keywords_to_use)}

Original {section_name}:
{section_text}

Requirements:
- Keep it concise (same length or slightly longer)
- Maintain authenticity (don't fabricate skills)
- Use professional language
- Naturally integrate the keywords where relevant
- Start with an action verb if it's experience

Rewritten {section_name}:"""

        try:
            response = ai_engine.generate_sync(
                prompt=prompt,
                temperature=0.7,
                max_tokens=500,
            )

            return response.strip()

        except Exception as e:
            logger.warning(f"Failed to generate rewrite via LLM: {str(e)}")
            return ""

    @staticmethod
    def _extract_added_keywords(
        original_text: str,
        optimized_text: str,
        all_missing_keywords: list[str]
    ) -> list[str]:
        """
        Extract which keywords were added in optimization.

        Args:
            original_text: Original section text
            optimized_text: Optimized section text
            all_missing_keywords: All missing keywords

        Returns:
            List of keywords that were added
        """
        added = []

        for keyword in all_missing_keywords[:5]:
            kw_lower = keyword.lower()

            if kw_lower not in original_text.lower() and kw_lower in optimized_text.lower():
                added.append(keyword)

        return added

    @staticmethod
    def get_ats_tips(resume_text: str, jd_text: str = "") -> list[str]:
        """
        Generate ATS optimization tips for resume.

        Args:
            resume_text: Resume text
            jd_text: Job description text (optional)

        Returns:
            List of actionable tips
        """
        tips = []

        # Formatting tips
        if "\n" not in resume_text:
            tips.append("✗ Add line breaks between sections for better readability")
        if "summary" not in resume_text.lower():
            tips.append("✗ Add a professional summary at the top (2-3 lines)")

        # Keyword tips
        if "achieved" not in resume_text.lower() and "increased" not in resume_text.lower():
            tips.append("✗ Use action verbs (achieved, increased, developed) in experience")

        # Structure tips
        experience_count = resume_text.lower().count("year") + resume_text.lower().count("years")
        if experience_count < 3:
            tips.append("✗ Clearly state years of experience for each position")

        education_keywords = ["bachelor", "master", "b.s.", "m.s.", "university", "college"]
        if not any(kw in resume_text.lower() for kw in education_keywords):
            tips.append("✗ Include education section with degree and institution")

        # Skills section tips
        if "skills" not in resume_text.lower():
            tips.append("✗ Add dedicated skills section with bullet points")

        # Formatting (ATS-friendly)
        if "<" in resume_text or ">" in resume_text or "http" in resume_text:
            tips.append("✗ Use plain text formatting (no HTML, minimize URLs)")

        # Positive tips (what they're doing right)
        if any(verb in resume_text.lower() for verb in ["led", "managed", "developed", "created", "improved"]):
            tips.append("✓ Good use of action verbs in experience section")

        if len(resume_text) > 300:
            tips.append("✓ Resume has good length and detail")

        # Default tips if none found
        if not tips:
            tips = [
                "✓ Use consistent formatting and clear section headers",
                "✓ Include keywords from job description throughout your resume",
                "✓ Use a standard font (Arial, Calibri, Times New Roman)",
                "✓ Avoid graphics, tables, and unusual formatting",
                "✓ Save as PDF or use .docx format",
                "✓ Include quantifiable achievements (numbers, percentages)",
            ]

        return tips[:10]  # Return top 10 tips

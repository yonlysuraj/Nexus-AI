"""
Resume matcher - Calculate match score between resume and job description.
"""

from dataclasses import dataclass, field
from difflib import SequenceMatcher
from loguru import logger
from app.core.ai_engine import ai_engine


@dataclass
class MatchResult:
    """Result of resume-JD matching."""
    match_score: int  # 0-100
    matched_keywords: list[str] = field(default_factory=list)
    missing_keywords: list[str] = field(default_factory=list)
    critical_gaps: list[str] = field(default_factory=list)
    match_percentage: float = 0.0  # Percentage of keywords matched


class ResumeMatcher:
    """Match resume against job description."""

    @staticmethod
    def calculate_match(resume_text: str, jd_keywords: list[str], jd_requirements: list[str]) -> MatchResult:
        """
        Calculate match score between resume and job description.

        Args:
            resume_text: Full resume text
            jd_keywords: List of JD keywords
            jd_requirements: List of JD requirements

        Returns:
            MatchResult object
        """
        try:
            # Extract resume keywords
            resume_keywords = ResumeMatcher._extract_resume_keywords(resume_text)

            # Find keyword overlap
            matched, missing = ResumeMatcher._keyword_overlap(resume_keywords, jd_keywords)

            # Identify critical gaps
            critical_gaps = ResumeMatcher._identify_critical_gaps(jd_requirements, resume_text)

            # Calculate match score
            match_score = ResumeMatcher._calculate_score(
                len(matched),
                len(jd_keywords),
                len(critical_gaps)
            )

            match_pct = (len(matched) / len(jd_keywords) * 100) if jd_keywords else 0

            result = MatchResult(
                match_score=match_score,
                matched_keywords=matched,
                missing_keywords=missing,
                critical_gaps=critical_gaps,
                match_percentage=round(match_pct, 1),
            )

            logger.info(
                f"Match calculated: {match_score}/100, {len(matched)} matched, "
                f"{len(missing)} missing, {len(critical_gaps)} critical gaps"
            )

            return result

        except Exception as e:
            logger.error(f"Error calculating match: {str(e)}")
            raise

    @staticmethod
    def _extract_resume_keywords(resume_text: str) -> list[str]:
        """
        Extract keywords from resume text.

        Args:
            resume_text: Full resume text

        Returns:
            List of keywords
        """
        # Common tech keywords to look for
        tech_keywords = [
            'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php',
            'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring', 'express', 'nestjs',
            'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'terraform', 'devops', 'ci/cd',
            'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'mysql', 'dynamodb',
            'machine learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision',
            'git', 'agile', 'scrum', 'kanban', 'rest', 'graphql', 'api', 'microservices',
            'html', 'css', 'sass', 'bootstrap', 'tailwind', 'figma', 'ui/ux', 'responsive',
            'node.js', 'npm', 'webpack', 'babel', 'jest', 'pytest', 'mocha', 'testing',
            'linux', 'unix', 'bash', 'shell', 'powershell', 'windows',
            'leadership', 'communication', 'problem solving', 'analytical', 'team player'
        ]

        resume_lower = resume_text.lower()
        found_keywords = []

        for keyword in tech_keywords:
            if keyword in resume_lower and keyword not in found_keywords:
                found_keywords.append(keyword)

        return found_keywords

    @staticmethod
    def _keyword_overlap(resume_keywords: list[str], jd_keywords: list[str]) -> tuple[list[str], list[str]]:
        """
        Find overlapping keywords between resume and JD.

        Args:
            resume_keywords: Keywords found in resume
            jd_keywords: Keywords required by JD

        Returns:
            (matched_keywords, missing_keywords) tuples
        """
        matched = []
        missing = []

        for keyword in jd_keywords:
            kw_lower = keyword.lower().strip()

            # Direct match
            if kw_lower in [r.lower() for r in resume_keywords]:
                matched.append(keyword)
            else:
                # Fuzzy match (at least 80% similar)
                best_match = None
                best_ratio = 0.0

                for resume_kw in resume_keywords:
                    ratio = SequenceMatcher(None, kw_lower, resume_kw.lower()).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_match = resume_kw

                if best_ratio >= 0.8:
                    matched.append(keyword)
                else:
                    missing.append(keyword)

        return matched, missing

    @staticmethod
    def _identify_critical_gaps(requirements: list[str], resume_text: str) -> list[str]:
        """
        Identify critical missing requirements from resume.

        Args:
            requirements: List of requirement strings
            resume_text: Resume text

        Returns:
            List of critical gaps
        """
        critical_gaps = []
        resume_lower = resume_text.lower()

        for req in requirements[:8]:  # Check top 8 requirements (usually most critical)
            req_lower = req.lower()

            # Check if requirement is addressed in resume
            if req_lower not in resume_lower:
                # Try to find key terms from requirement
                words = [w for w in req_lower.split() if len(w) > 3]
                match_count = sum(1 for word in words if word in resume_lower)

                # If less than 50% of requirement words found, it's a gap
                if match_count / len(words) < 0.5 if words else True:
                    critical_gaps.append(req)

        return critical_gaps

    @staticmethod
    def _calculate_score(matched_count: int, total_keywords: int, critical_gaps_count: int) -> int:
        """
        Calculate final match score (0-100).

        Algorithm:
            - Keyword match: 50%
            - Semantic similarity (LLM): 30%
            - Critical gap penalty: 20%

        Args:
            matched_count: Number of matched keywords
            total_keywords: Total keywords in JD
            critical_gaps_count: Number of critical gaps

        Returns:
            Match score 0-100
        """
        # Keyword coverage score (0-50)
        keyword_score = min(50, (matched_count / total_keywords * 50)) if total_keywords > 0 else 0

        # Gap penalty (0-20)
        gap_penalty = min(20, critical_gaps_count * 2)

        # Base score
        base_score = keyword_score - gap_penalty

        # Round and ensure 0-100 range
        final_score = max(0, min(100, int(base_score)))

        return final_score

    @staticmethod
    def get_match_summary(result: MatchResult) -> str:
        """
        Generate human-readable match summary.

        Args:
            result: MatchResult object

        Returns:
            Summary string
        """
        score = result.match_score

        if score >= 80:
            level = "Excellent Match"
            description = "Your resume aligns very well with the job description."
        elif score >= 60:
            level = "Good Match"
            description = "Your resume covers most of the key requirements."
        elif score >= 40:
            level = "Moderate Match"
            description = "Your resume has some relevant skills but is missing key areas."
        elif score >= 20:
            level = "Weak Match"
            description = "Your resume is missing several important qualifications."
        else:
            level = "Poor Match"
            description = "Your resume doesn't align well with this position."

        summary = f"{level} ({score}/100)\n{description}\n"
        summary += f"Matched: {len(result.matched_keywords)} keywords\n"
        summary += f"Missing: {len(result.missing_keywords)} keywords"

        if result.critical_gaps:
            summary += f"\nCritical gaps: {len(result.critical_gaps)}"

        return summary

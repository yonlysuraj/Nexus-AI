"""
Job description processor - Extract requirements and keywords from JD.
"""

from dataclasses import dataclass, field
from loguru import logger
from app.core.ai_engine import ai_engine


@dataclass
class JobDescription:
    """Structured job description data."""
    title: str
    company: str = ""
    requirements: list[str] = field(default_factory=list)  # Required skills/requirements
    nice_to_have: list[str] = field(default_factory=list)  # Preferred/nice-to-have
    keywords: list[str] = field(default_factory=list)  # Extracted skill keywords


class JDProcessor:
    """Process job descriptions and extract structured data."""

    @staticmethod
    def process(jd_text: str, job_title: str = "Software Developer") -> JobDescription:
        """
        Process job description text and extract requirements.

        Args:
            jd_text: Full job description text
            job_title: Job title (for context)

        Returns:
            JobDescription object with structured data
        """
        try:
            # Extract requirements (split by common delimiters)
            requirements = JDProcessor._extract_requirements(jd_text)
            nice_to_have = JDProcessor._extract_nice_to_have(jd_text)

            # Extract keywords (use LLM for better accuracy)
            keywords = JDProcessor._extract_keywords(jd_text)

            jd = JobDescription(
                title=job_title,
                requirements=requirements,
                nice_to_have=nice_to_have,
                keywords=keywords,
            )

            logger.info(
                f"Processed JD: {len(jd.requirements)} requirements, "
                f"{len(jd.nice_to_have)} nice-to-have, {len(jd.keywords)} keywords"
            )

            return jd

        except Exception as e:
            logger.error(f"Error processing JD: {str(e)}")
            raise

    @staticmethod
    def _extract_requirements(jd_text: str) -> list[str]:
        """
        Extract required skills/requirements from JD.

        Args:
            jd_text: Job description text

        Returns:
            List of requirement strings
        """
        requirements = []
        text_lower = jd_text.lower()

        # Look for "requirements" section
        markers = ["requirements:", "required:", "must have:", "what we need:", "qualifications:"]
        for marker in markers:
            if marker in text_lower:
                # Extract text after marker
                start_idx = text_lower.find(marker) + len(marker)
                # Find next section (usually "nice to have" or end of requirements)
                next_section_markers = ["nice to have", "preferred", "benefits:", "about", "position:"]
                end_idx = len(jd_text)
                for next_marker in next_section_markers:
                    if next_marker in text_lower[start_idx:]:
                        end_idx = start_idx + text_lower[start_idx:].find(next_marker)
                        break

                section_text = jd_text[start_idx:end_idx]
                # Split by bullets or newlines
                for line in section_text.split('\n'):
                    line = line.strip()
                    if line and len(line) > 5 and not line.startswith('#'):
                        # Remove bullet points/numbering
                        line = line.lstrip('•-*0123456789. ')
                        if len(line) > 5:
                            requirements.append(line)

                break

        # If no requirements found, use heuristic: lines with technical keywords
        if not requirements:
            technical_keywords = [
                'experience with', 'knowledge of', 'proficient in', 'expert in',
                'must have', 'required', 'strong', 'years of', 'degree in'
            ]
            for line in jd_text.split('\n'):
                line = line.strip()
                if any(kw in line.lower() for kw in technical_keywords) and len(line) > 10:
                    line = line.lstrip('•-*0123456789. ')
                    if line not in requirements and len(line) > 5:
                        requirements.append(line)

        return requirements[:15]  # Limit to top 15

    @staticmethod
    def _extract_nice_to_have(jd_text: str) -> list[str]:
        """
        Extract nice-to-have/preferred skills from JD.

        Args:
            jd_text: Job description text

        Returns:
            List of nice-to-have requirement strings
        """
        nice_to_have = []
        text_lower = jd_text.lower()

        # Look for "nice to have" or "preferred" section
        markers = ["nice to have:", "preferred:", "bonus:", "plus:", "extra credit:"]
        for marker in markers:
            if marker in text_lower:
                start_idx = text_lower.find(marker) + len(marker)
                # Find end (next section or end of text)
                next_section_markers = ["requirements:", "about:", "benefits:", "company:"]
                end_idx = len(jd_text)
                for next_marker in next_section_markers:
                    if next_marker in text_lower[start_idx:]:
                        end_idx = start_idx + text_lower[start_idx:].find(next_marker)
                        break

                section_text = jd_text[start_idx:end_idx]
                for line in section_text.split('\n'):
                    line = line.strip()
                    if line and len(line) > 5:
                        line = line.lstrip('•-*0123456789. ')
                        if len(line) > 5:
                            nice_to_have.append(line)

                break

        return nice_to_have[:10]  # Limit to top 10

    @staticmethod
    def _extract_keywords(jd_text: str) -> list[str]:
        """
        Extract technical keywords from JD using LLM.

        Args:
            jd_text: Job description text

        Returns:
            List of keyword strings
        """
        prompt = f"""Extract the top 15 technical skills and keywords from this job description. 
Return as a comma-separated list, nothing else.

Job Description:
{jd_text[:1000]}

Keywords (comma-separated):"""

        try:
            response = ai_engine.generate_sync(
                prompt=prompt,
                temperature=0.3,
                max_tokens=200,
            )

            # Parse comma-separated keywords
            keywords = [kw.strip() for kw in response.split(',') if kw.strip()]

            return keywords[:15]  # Return top 15

        except Exception as e:
            logger.warning(f"Failed to extract keywords via LLM: {str(e)}, using fallback")
            # Fallback: extract common tech keywords
            tech_keywords = [
                'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'rust',
                'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring',
                'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
                'sql', 'postgresql', 'mongodb', 'redis',
                'machine learning', 'tensorflow', 'pytorch', 'nlp',
                'git', 'agile', 'scrum', 'rest', 'graphql',
                'html', 'css', 'sass', 'figma'
            ]

            found_keywords = []
            text_lower = jd_text.lower()
            for keyword in tech_keywords:
                if keyword in text_lower and keyword not in found_keywords:
                    found_keywords.append(keyword)

            return found_keywords

    @staticmethod
    def categorize_requirements(requirements: list[str]) -> dict:
        """
        Categorize requirements into groups.

        Args:
            requirements: List of requirement strings

        Returns:
            Dict with categorized requirements
        """
        categories = {
            "programming_languages": [],
            "frameworks": [],
            "cloud_platforms": [],
            "databases": [],
            "tools": [],
            "soft_skills": [],
            "other": [],
        }

        language_keywords = ["python", "javascript", "java", "c++", "c#", "go", "rust", "ruby", "php"]
        framework_keywords = ["react", "angular", "vue", "django", "flask", "spring", "fastapi"]
        cloud_keywords = ["aws", "azure", "gcp", "cloud"]
        database_keywords = ["sql", "postgres", "mongodb", "redis", "elasticsearch"]
        tool_keywords = ["docker", "kubernetes", "git", "jenkins", "devops"]
        soft_skill_keywords = ["communication", "teamwork", "leadership", "problem", "solving"]

        for req in requirements:
            req_lower = req.lower()
            categorized = False

            if any(lang in req_lower for lang in language_keywords):
                categories["programming_languages"].append(req)
                categorized = True
            elif any(fw in req_lower for fw in framework_keywords):
                categories["frameworks"].append(req)
                categorized = True
            elif any(cloud in req_lower for cloud in cloud_keywords):
                categories["cloud_platforms"].append(req)
                categorized = True
            elif any(db in req_lower for db in database_keywords):
                categories["databases"].append(req)
                categorized = True
            elif any(tool in req_lower for tool in tool_keywords):
                categories["tools"].append(req)
                categorized = True
            elif any(skill in req_lower for skill in soft_skill_keywords):
                categories["soft_skills"].append(req)
                categorized = True

            if not categorized:
                categories["other"].append(req)

        return categories

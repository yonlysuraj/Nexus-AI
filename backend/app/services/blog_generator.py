"""
Blog post generator - Convert transcripts to SEO-optimized blog posts.
"""

import re
import json
from typing import List, Optional
from dataclasses import dataclass
from loguru import logger


@dataclass
class BlogMetadata:
    """Blog post metadata for SEO."""
    title: str
    meta_description: str
    keywords: List[str]
    word_count: int
    reading_time: int  # minutes


@dataclass
class BlogPost:
    """Complete blog post with content and metadata."""
    title: str
    content: str  # Markdown
    metadata: BlogMetadata
    sections: List[str]  # Section headings


class BlogGenerator:
    """Generate SEO-optimized blog posts from transcripts."""

    @staticmethod
    def count_words(text: str) -> int:
        """Count words in text."""
        return len(text.split())

    @staticmethod
    def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
        """
        Calculate estimated reading time.

        Args:
            text: Text content
            words_per_minute: Average reading speed

        Returns:
            Reading time in minutes
        """
        word_count = BlogGenerator.count_words(text)
        reading_time = max(1, word_count // words_per_minute)
        return reading_time

    @staticmethod
    def extract_sections(blog_content: str) -> List[str]:
        """
        Extract section headings from markdown blog post.

        Args:
            blog_content: Markdown content

        Returns:
            List of section headings
        """
        sections = []
        for line in blog_content.split("\n"):
            if line.startswith("## "):
                section = line.replace("## ", "").strip()
                sections.append(section)
        return sections

    @staticmethod
    def extract_keywords(blog_content: str, count: int = 5) -> List[str]:
        """
        Extract keywords from blog content.

        Args:
            blog_content: Blog content
            count: Number of keywords to extract

        Returns:
            List of keywords
        """
        # Simple heuristic: extract common noun phrases
        # In production, use NLP library like spacy or RAKE

        # Remove markdown syntax
        text = re.sub(r"[#*`_\[\]()]", "", blog_content)

        # Split into words and filter
        words = re.findall(r"\b[a-z]{3,}\b", text.lower())

        # Common stop words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "been", "that", "this", "these", "those", "i", "you", "he", "she",
            "it", "we", "they", "what", "which", "who", "when", "where", "why",
            "how", "can", "will", "should", "would", "could", "may", "might"
        }

        # Filter and count
        filtered_words = [w for w in words if w not in stop_words]
        word_freq = {}
        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # Sort by frequency and return top N
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        keywords = [word for word, freq in sorted_words[:count]]

        return keywords if keywords else ["content", "topic", "blog", "article", "post"]

    @staticmethod
    def generate_meta_description(blog_content: str, title: str = "", max_length: int = 160) -> str:
        """
        Generate SEO meta description from blog content.

        Args:
            blog_content: Blog content
            title: Blog title (optional)
            max_length: Max description length

        Returns:
            Meta description (optimized for search engines)
        """
        # Try to use first paragraph
        paragraphs = [p.strip() for p in blog_content.split("\n\n") if p.strip() and not p.startswith("#")]

        if paragraphs:
            description = paragraphs[0]
        else:
            description = blog_content[:max_length]

        # Clean markdown
        description = re.sub(r"[*`_\[\]()]", "", description)
        description = description.strip()

        # Trim to max length
        if len(description) > max_length:
            description = description[:max_length - 3] + "..."

        return description

    @staticmethod
    def create_blog_post(
        blog_content: str,
        title: str = "Untitled Blog Post"
    ) -> BlogPost:
        """
        Create structured blog post from markdown content.

        Args:
            blog_content: Markdown blog content
            title: Blog post title

        Returns:
            BlogPost object with metadata
        """
        word_count = BlogGenerator.count_words(blog_content)
        reading_time = BlogGenerator.calculate_reading_time(blog_content)
        sections = BlogGenerator.extract_sections(blog_content)
        keywords = BlogGenerator.extract_keywords(blog_content, count=5)
        meta_description = BlogGenerator.generate_meta_description(blog_content, title)

        metadata = BlogMetadata(
            title=title,
            meta_description=meta_description,
            keywords=keywords,
            word_count=word_count,
            reading_time=reading_time,
        )

        return BlogPost(
            title=title,
            content=blog_content,
            metadata=metadata,
            sections=sections,
        )

    @staticmethod
    def parse_blog_generation_response(response: str) -> tuple[str, str]:
        """
        Parse LLM response to extract blog content and title.

        Args:
            response: Raw LLM response

        Returns:
            (title, content) tuple
        """
        # Extract title (first H1)
        title_match = re.search(r"^# (.+)$", response, re.MULTILINE)
        title = title_match.group(1) if title_match else "Blog Post"

        # Return full content as is (it's already markdown)
        return title, response

    @staticmethod
    def create_blog_with_frontmatter(blog_post: BlogPost) -> str:
        """
        Create blog post with YAML frontmatter for static site generators.

        Args:
            blog_post: BlogPost object

        Returns:
            Markdown with YAML frontmatter
        """
        frontmatter = f"""---
title: {blog_post.metadata.title}
description: {blog_post.metadata.meta_description}
keywords: {", ".join(blog_post.metadata.keywords)}
reading_time: {blog_post.metadata.reading_time} minutes
word_count: {blog_post.metadata.word_count}
---

"""
        return frontmatter + blog_post.content

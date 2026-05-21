"""
Blog generation prompt templates.
"""

# ============================================================================
# BLOG POST GENERATION
# ============================================================================

BLOG_POST_GENERATION_PROMPT = """
You are an expert SEO content writer and blogger. Your task is to convert the following YouTube video transcript into a compelling, SEO-optimized blog post.

**Transcript:**
{transcript}

**Video Title:** {video_title}

**Optional SEO Keywords to Target:** {seo_keywords}

**Requirements:**
1. Create an engaging blog title (50-60 characters) - will appear in search results
2. Write a compelling hook/introduction (2-3 sentences) that captures attention
3. Structure the content into 4-6 main sections with clear ## headings
4. Use ### subheadings for better readability and SEO
5. Include 1-2 paragraphs per section with actionable insights
6. Use **bold** for emphasis on key terms
7. Include > blockquotes for key takeaways or important quotes
8. Write a conclusion that summarizes the main points
9. Add a clear call-to-action (CTA) at the end
10. Format as markdown with proper heading hierarchy
11. Target word count: 1200-2000 words
12. Naturally incorporate the SEO keywords (if provided)
13. Make it conversational, engaging, and easy to read
14. Include practical examples or tips when relevant

**Output Format (IMPORTANT - Start with # Title):**

# [Compelling Blog Title Here]

[Hook paragraph that draws readers in]

## Section 1: [Main Topic]
Content about this section...

## Section 2: [Another Key Topic]
Content about this section...

## Section 3: [Deeper Insight]
Content about this section...

## Section 4: [Practical Application]
Content about this section...

## Conclusion
[Summarize key points] [Call to action for readers]

---

Generate the blog post now. Output ONLY the markdown blog post, nothing else:
"""

# ============================================================================
# SEO METADATA EXTRACTION
# ============================================================================

SEO_METADATA_PROMPT = """
Analyze the following blog post and generate SEO metadata. Respond ONLY with a valid JSON object, nothing else.

**Blog Post:**
{blog_content}

Generate JSON (no other text):
{{
    "meta_description": "A compelling 150-160 character description for search engines (write as if it will appear in search results)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "seo_score": 75
}}

Important:
- meta_description: Exactly 150-160 characters, compelling and click-worthy
- keywords: 5 most important keywords from the blog (ordered by relevance)
- Return ONLY valid JSON
"""


def get_blog_generation_prompt(
    transcript: str,
    video_title: str = "Video",
    seo_keywords: str = ""
) -> str:
    """
    Get the blog generation prompt.

    Args:
        transcript: Video transcript
        video_title: Title of the YouTube video
        seo_keywords: Optional keywords to target

    Returns:
        Formatted prompt ready for LLM
    """
    seo_keywords_text = seo_keywords if seo_keywords else "(not provided - use natural keywords from transcript)"

    return BLOG_POST_GENERATION_PROMPT.format(
        transcript=transcript,
        video_title=video_title,
        seo_keywords=seo_keywords_text,
    )


def get_seo_metadata_prompt(blog_content: str) -> str:
    """
    Get the SEO metadata extraction prompt.

    Args:
        blog_content: Generated blog post content

    Returns:
        Formatted prompt for LLM
    """
    return SEO_METADATA_PROMPT.format(blog_content=blog_content)

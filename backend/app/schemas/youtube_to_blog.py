"""
Pydantic schemas for YouTube to blog API.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal


class YouTubeBlogRequest(BaseModel):
    """Request to generate blog post from YouTube video."""

    youtube_url: str = Field(
        ...,
        description="YouTube video URL (youtube.com/watch?v=... or youtu.be/...)"
    )
    seo_keywords: str = Field(
        default="",
        description="Optional comma-separated keywords to target in SEO"
    )


class BlogMetadataSchema(BaseModel):
    """Blog post metadata."""

    title: str = Field(..., description="Blog post title")
    meta_description: str = Field(..., description="SEO meta description (150-160 chars)")
    keywords: List[str] = Field(..., description="SEO keywords")
    word_count: int = Field(..., description="Total words in blog post")
    reading_time: int = Field(..., description="Estimated reading time in minutes")


class YouTubeBlogResponse(BaseModel):
    """Response with generated blog post."""

    blog_post: str = Field(..., description="Generated blog post in Markdown")
    metadata: BlogMetadataSchema = Field(..., description="Blog post metadata")
    transcript_source: Literal["captions", "yt-dlp", "whisper"] = Field(
        ...,
        description="Source of transcript extraction (captions = fastest, whisper = slowest)"
    )

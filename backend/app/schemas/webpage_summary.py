"""Webpage Summarizer — Request/Response Schemas."""

from pydantic import BaseModel, Field, HttpUrl
from typing import Literal, Optional


class WebpageSummaryRequest(BaseModel):
    """Request body for webpage summarization."""

    url: str = Field(
        ...,
        min_length=10,
        max_length=2048,
        description="URL of the webpage to summarize.",
        examples=["https://example.com/article"],
    )
    level: Literal["tldr", "key_points", "detailed"] = Field(
        default="key_points",
        description="Summary depth level.",
    )


class WebpageSummaryResponse(BaseModel):
    """Response body for webpage summarization."""

    success: bool = True
    url: str = Field(..., description="The URL that was summarized.")
    title: str = Field(default="", description="Page title extracted from HTML.")
    summary: str = Field(..., description="The generated summary text.")
    level: str = Field(..., description="Summary level used.")
    content_length: int = Field(
        ..., description="Character count of the extracted page content."
    )
    model_used: str = Field(..., description="LLM model used for generation.")
    processing_time_ms: float = Field(
        ..., description="Total processing time in milliseconds."
    )

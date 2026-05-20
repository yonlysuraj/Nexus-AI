"""LinkedIn Post Writer — Request/Response Schemas."""

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class LinkedInRequest(BaseModel):
    """Request body for LinkedIn post generation."""

    bullets: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Bullet points or rough ideas to convert into a LinkedIn post.",
        examples=["Led a team of 5 engineers\nShipped the feature 2 weeks early\nReduced costs by 40%"],
    )
    tone: Literal["professional", "casual", "storytelling"] = Field(
        default="professional",
        description="Desired tone for the generated post.",
    )


class LinkedInResponse(BaseModel):
    """Response body for LinkedIn post generation."""

    success: bool = True
    post: str = Field(..., description="The generated LinkedIn post text.")
    hashtags: list[str] = Field(
        default_factory=list,
        description="Extracted hashtags from the post.",
    )
    character_count: int = Field(..., description="Total character count of the post.")
    model_used: str = Field(..., description="LLM model used for generation.")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds.")

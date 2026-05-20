"""README Auto-Generator — Request/Response Schemas."""

from pydantic import BaseModel, Field
from typing import Optional


class ReadmeRequest(BaseModel):
    """Request body for README generation."""

    repo_url: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="GitHub repository URL (e.g. https://github.com/user/repo).",
        examples=["https://github.com/fastapi/fastapi"],
    )


class ReadmeResponse(BaseModel):
    """Response body for README generation."""

    success: bool = True
    repo_name: str = Field(..., description="Repository name (owner/repo).")
    readme: str = Field(..., description="Generated README content in Markdown.")
    tech_stack: dict = Field(
        default_factory=dict, description="Detected tech stack details."
    )
    file_count: int = Field(..., description="Number of files in the repo tree.")
    model_used: str = Field(..., description="LLM model used for generation.")
    processing_time_ms: float = Field(
        ..., description="Total processing time in milliseconds."
    )

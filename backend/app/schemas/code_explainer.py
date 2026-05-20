"""Codebase Explainer — Request/Response Schemas."""

from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict


class CodeExplainerRequest(BaseModel):
    """Request body for code explanation."""

    code: str = Field(
        ...,
        min_length=20,
        max_length=20000,
        description="Code snippet or file content to explain.",
        examples=[
            "def add(a, b):\n    return a + b",
        ],
    )
    language: Optional[str] = Field(
        default=None,
        description="Optional language hint (e.g., python, javascript, typescript, java).",
    )
    level: Literal["beginner", "intermediate", "advanced"] = Field(
        default="intermediate",
        description="Explanation depth level.",
    )


class CodeExplainerResponse(BaseModel):
    """Response body for code explanation."""

    success: bool = True
    explanation: str = Field(..., description="Generated explanation text.")
    detected_language: str = Field(..., description="Detected or provided language.")
    stats: Dict[str, int] = Field(default_factory=dict)
    model_used: str = Field(..., description="LLM model used for generation.")
    processing_time_ms: float = Field(
        ..., description="Processing time in milliseconds."
    )

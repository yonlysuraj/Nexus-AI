"""
Pydantic schemas for Resume Optimizer API.
"""

from pydantic import BaseModel, Field
from typing import List


class ResumeOptimizeRequest(BaseModel):
    """Request to optimize resume against job description."""

    job_description: str = Field(
        ...,
        description="Full job description text"
    )


class MatchResultSchema(BaseModel):
    """Resume-JD match result."""

    match_score: int = Field(..., ge=0, le=100, description="Match score 0-100")
    matched_keywords: List[str] = Field(..., description="Keywords found in both resume and JD")
    missing_keywords: List[str] = Field(..., description="Keywords in JD but missing from resume")
    critical_gaps: List[str] = Field(..., description="Critical missing requirements")


class SuggestionSchema(BaseModel):
    """Resume section optimization suggestion."""

    section_name: str = Field(..., description="Name of section (e.g., Experience, Summary)")
    original_text: str = Field(..., description="Original section text")
    optimized_text: str = Field(..., description="Optimized section text with keywords")
    keywords_added: List[str] = Field(..., description="Keywords added in optimization")


class ResumeOptimizeResponse(BaseModel):
    """Response with resume optimization analysis."""

    match_result: MatchResultSchema = Field(..., description="Match analysis between resume and JD")
    suggestions: List[SuggestionSchema] = Field(..., description="2-3 optimization suggestions")
    ats_tips: List[str] = Field(..., description="ATS optimization tips")

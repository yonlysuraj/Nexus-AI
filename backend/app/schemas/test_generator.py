"""
Pydantic schemas for test generation API.
"""

from pydantic import BaseModel, Field
from typing import Literal


class TestGenerationRequest(BaseModel):
    """Request for test generation."""

    code: str = Field(..., description="Source code snippet to generate tests for")
    language: Literal["python", "javascript", "typescript", "java"] = Field(
        ..., description="Programming language of the code"
    )
    framework: Literal["pytest", "unittest", "jest", "vitest", "mocha", "junit4", "junit5"] = Field(
        ..., description="Test framework to use"
    )
    detail_level: Literal["basic", "comprehensive"] = Field(
        default="comprehensive",
        description="How detailed the test cases should be (basic: 2-3 tests, comprehensive: 5+ tests)"
    )


class TestGenerationResponse(BaseModel):
    """Response from test generation."""

    test_code: str = Field(..., description="Generated test code")
    functions_found: int = Field(..., description="Number of functions parsed")
    edge_cases_covered: int = Field(..., description="Number of edge cases identified")
    framework_used: str = Field(..., description="Test framework used")
    language_used: str = Field(..., description="Programming language used")

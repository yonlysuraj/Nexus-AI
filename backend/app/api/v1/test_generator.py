"""
FastAPI endpoints for test generation.
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.schemas.test_generator import TestGenerationRequest, TestGenerationResponse
from app.services.code_parser import CodeParser
from app.services.edge_case_identifier import EdgeCaseIdentifier
from app.core.prompts.test_generation import get_test_generation_prompt
from app.core.ai_engine import ai_engine

router = APIRouter(prefix="/test-generator", tags=["Test Generator"])


@router.post("/")
async def generate_tests(request: TestGenerationRequest) -> TestGenerationResponse:
    """
    Generate unit tests for provided code snippet.

    Args:
        request: TestGenerationRequest with code, language, framework

    Returns:
        TestGenerationResponse with generated test code and metadata

    Raises:
        HTTPException: If parsing or generation fails
    """
    try:
        # Step 1: Parse code
        functions, classes = CodeParser.parse(request.code, request.language)

        if not functions and not classes:
            raise HTTPException(
                status_code=400,
                detail="No functions or classes found in the provided code. Please check the code syntax."
            )

        # Step 2: Identify edge cases
        edge_cases_list = []
        for func in functions:
            edge_cases = EdgeCaseIdentifier.identify_edge_cases(func)
            edge_cases_list.extend(edge_cases)

        # Create edge cases summary for prompt
        edge_cases_summary = "; ".join([
            f"{ec.description} ({ec.test_value})"
            for ec in edge_cases_list[:5]  # Limit to 5 for prompt brevity
        ])

        if not edge_cases_summary:
            edge_cases_summary = "null/empty values, boundary values, type mismatches"

        # Step 3: Format prompt
        function_name = functions[0].name if functions else (classes[0].name if classes else "Function")
        prompt = get_test_generation_prompt(
            framework=request.framework,
            code=request.code,
            edge_cases_summary=edge_cases_summary,
            function_name=function_name,
        )

        # Step 4: Generate test code using LLM
        logger.info(f"Generating {request.framework} tests for {request.language} code")
        test_code = await ai_engine.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=2000,
        )

        # Step 5: Clean up response (remove markdown code blocks if present)
        test_code = test_code.strip()
        if test_code.startswith("```"):
            # Remove markdown code block wrapper
            test_code = test_code.replace("```python", "").replace("```javascript", "").replace("```java", "").replace("```typescript", "").replace("```", "")
            test_code = test_code.strip()

        logger.info(f"Generated {len(test_code)} characters of test code")

        return TestGenerationResponse(
            test_code=test_code,
            functions_found=len(functions),
            edge_cases_covered=len(edge_cases_list),
            framework_used=request.framework,
            language_used=request.language,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating tests: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating tests: {str(e)}"
        )

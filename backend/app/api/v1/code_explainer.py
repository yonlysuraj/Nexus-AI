"""Codebase Explainer — API Endpoints."""

import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.schemas.code_explainer import CodeExplainerRequest, CodeExplainerResponse
from app.services.code_explainer import generate_code_explanation, stream_code_explanation
from app.db.session import get_db
from app.models.tool_runs import ToolRun
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/tools/code-explainer", tags=["Codebase Explainer"])


@router.post("/", response_model=CodeExplainerResponse)
@limiter.limit("30/minute")
async def create_code_explanation(
    request: Request,
    body: CodeExplainerRequest,
    db: AsyncSession = Depends(get_db),
):
    """Explain a code snippet based on the requested level."""
    result = await generate_code_explanation(
        code=body.code,
        level=body.level,
        language=body.language,
    )

    # Save to history
    try:
        run = ToolRun(
            tool_name="code-explainer",
            input_data=json.dumps(
                {
                    "language": body.language,
                    "level": body.level,
                    "code_length": len(body.code),
                }
            ),
            output_data=json.dumps(
                {
                    "detected_language": result["detected_language"],
                    "summary_length": len(result["explanation"]),
                }
            ),
            processing_time_ms=result["processing_time_ms"],
            model_used=result["model_used"],
        )
        db.add(run)
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to save tool run to history: {e}")

    return result


@router.post("/stream")
@limiter.limit("30/minute")
async def stream_code_explanation_endpoint(
    request: Request,
    body: CodeExplainerRequest,
):
    """Stream a code explanation in real-time via Server-Sent Events."""
    return StreamingResponse(
        stream_code_explanation(
            code=body.code,
            level=body.level,
            language=body.language,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

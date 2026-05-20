"""LinkedIn Post Writer — API Endpoints."""

import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.schemas.linkedin import LinkedInRequest, LinkedInResponse
from app.services.linkedin import generate_linkedin_post, stream_linkedin_post
from app.db.session import get_db
from app.models.tool_runs import ToolRun
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/tools/linkedin-post", tags=["LinkedIn Post Writer"])


@router.post("/", response_model=LinkedInResponse)
@limiter.limit("30/minute")
async def create_linkedin_post(
    request: Request,
    body: LinkedInRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a polished LinkedIn post from bullet points."""
    result = await generate_linkedin_post(
        bullets=body.bullets,
        tone=body.tone,
    )

    # Save to history
    try:
        run = ToolRun(
            tool_name="linkedin-writer",
            input_data=json.dumps({"bullets": body.bullets, "tone": body.tone}),
            output_data=json.dumps({"post": result["post"], "hashtags": result["hashtags"]}),
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
async def stream_linkedin_post_endpoint(
    request: Request,
    body: LinkedInRequest,
):
    """Stream a LinkedIn post in real-time via Server-Sent Events."""
    return StreamingResponse(
        stream_linkedin_post(bullets=body.bullets, tone=body.tone),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

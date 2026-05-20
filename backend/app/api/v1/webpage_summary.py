"""Webpage Summarizer — API Endpoints."""

import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.schemas.webpage_summary import WebpageSummaryRequest, WebpageSummaryResponse
from app.services.webpage_summary import summarize_webpage, stream_webpage_summary
from app.db.session import get_db
from app.models.tool_runs import ToolRun
from app.core.rate_limit import limiter

router = APIRouter(
    prefix="/api/v1/tools/webpage-summary", tags=["Webpage Summarizer"]
)


@router.post("/", response_model=WebpageSummaryResponse)
@limiter.limit("30/minute")
async def create_webpage_summary(
    request: Request,
    body: WebpageSummaryRequest,
    db: AsyncSession = Depends(get_db),
):
    """Scrape a webpage and generate a summary."""
    result = await summarize_webpage(url=body.url, level=body.level)

    # Save to history
    try:
        run = ToolRun(
            tool_name="webpage-summarizer",
            input_data=json.dumps({"url": body.url, "level": body.level}),
            output_data=json.dumps(
                {"summary": result["summary"], "title": result["title"]}
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
async def stream_webpage_summary_endpoint(
    request: Request,
    body: WebpageSummaryRequest,
):
    """Stream a webpage summary in real-time via Server-Sent Events."""
    return StreamingResponse(
        stream_webpage_summary(url=body.url, level=body.level),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

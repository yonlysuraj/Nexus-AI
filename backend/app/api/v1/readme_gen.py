"""README Auto-Generator — API Endpoints."""

import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.schemas.readme_gen import ReadmeRequest, ReadmeResponse
from app.services.readme_gen import generate_readme, stream_readme
from app.db.session import get_db
from app.models.tool_runs import ToolRun
from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/v1/tools/readme", tags=["README Generator"])


@router.post("/", response_model=ReadmeResponse)
@limiter.limit("10/minute")
async def create_readme(
    request: Request,
    body: ReadmeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a README from a GitHub repository URL."""
    result = await generate_readme(repo_url=body.repo_url)

    # Save to history
    try:
        run = ToolRun(
            tool_name="readme-generator",
            input_data=json.dumps({"repo_url": body.repo_url}),
            output_data=json.dumps(
                {"readme_length": len(result["readme"]), "repo_name": result["repo_name"]}
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
@limiter.limit("10/minute")
async def stream_readme_endpoint(
    request: Request,
    body: ReadmeRequest,
):
    """Stream a generated README in real-time via Server-Sent Events."""
    return StreamingResponse(
        stream_readme(repo_url=body.repo_url),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

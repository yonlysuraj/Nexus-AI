import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.logging import setup_logging
from .core.rate_limit import limiter

# Configure logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="NexusAI - AI-Powered Productivity Toolkit Backend",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = f"{process_time:.2f}ms"
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} completed in {formatted_process_time}"
    )
    return response

# Rate Limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend is running."""
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Tool routers
from .api.v1.linkedin import router as linkedin_router
from .api.v1.webpage_summary import router as webpage_summary_router
from .api.v1.readme_gen import router as readme_gen_router
from .api.v1.code_explainer import router as code_explainer_router

app.include_router(linkedin_router)
app.include_router(webpage_summary_router)
app.include_router(readme_gen_router)
app.include_router(code_explainer_router)

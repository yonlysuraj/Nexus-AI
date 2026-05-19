from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from fastapi import Request

from .config import settings

# Key function uses IP address
limiter = Limiter(key_func=get_remote_address)

def get_rate_limit(request: Request, category: str = "text") -> str:
    """Dynamically get rate limits based on category"""
    if category == "text":
        return settings.RATE_LIMIT_TEXT
    elif category == "file":
         return settings.RATE_LIMIT_FILE
    elif category == "heavy":
         return settings.RATE_LIMIT_HEAVY
    return settings.RATE_LIMIT_TEXT

# Example usage on endpoints:
# @router.get("/text-tool")
# @limiter.limit(lambda req: get_rate_limit(req, "text"))
# async def my_text_tool(request: Request):
#    ...

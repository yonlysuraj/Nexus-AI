import sys
from loguru import logger
from .config import settings

def setup_logging():
    """Configure Loguru logging for the application."""
    # Remove default handler
    logger.remove()
    
    # Add stdout handler
    logger.add(
        sys.stdout,
        format="{time:YYYY-MM-DD HH:mm:ss} | <level>{level: <8}</level> | {name}:{function}:{line} | {message}",
        level=settings.LOG_LEVEL,
        colorize=True,
    )
    
    # Add file handler for persistence
    logger.add(
        "logs/nexusai.log",
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
    )
    
    logger.info("Logging configured successfully.")

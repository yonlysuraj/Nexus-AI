import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.core.config import settings
from loguru import logger

async def init_db():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite://"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://")
        
        # Ensure data dir exists
        os.makedirs("./data", exist_ok=True)

    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        # Create tables if they don't exist
        # In production, you would use Alembic migrations instead of this
        await conn.run_sync(Base.metadata.create_all)
        
    logger.info("Database tables created/verified.")

if __name__ == "__main__":
    asyncio.run(init_db())

import asyncio
from app.db.session import engine, Base
from app.models.visitors import Visitor
from app.models.tool_runs import ToolRun
from app.models.expenses import Expense

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(create_tables())

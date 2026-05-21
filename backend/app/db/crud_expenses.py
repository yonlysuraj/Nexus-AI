from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Dict, Any
from app.models.expenses import Expense
from app.schemas.receipt_tracker import ExpenseCreate, ExpenseUpdate

async def create_expense(db: AsyncSession, expense_in: ExpenseCreate) -> Expense:
    db_expense = Expense(
        vendor=expense_in.vendor,
        amount=expense_in.amount,
        currency=expense_in.currency,
        date=expense_in.date,
        category=expense_in.category,
        receipt_image_path=expense_in.receipt_image_path
    )
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def get_expenses(db: AsyncSession, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> List[Expense]:
    query = select(Expense)
    if category:
        query = query.where(Expense.category == category)
    query = query.order_by(Expense.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_expense(db: AsyncSession, expense_id: str) -> Optional[Expense]:
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    return result.scalar_one_or_none()

async def update_expense(db: AsyncSession, expense_id: str, expense_in: ExpenseUpdate) -> Optional[Expense]:
    db_expense = await get_expense(db, expense_id)
    if not db_expense:
        return None
    
    update_data = expense_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def delete_expense(db: AsyncSession, expense_id: str) -> bool:
    db_expense = await get_expense(db, expense_id)
    if not db_expense:
        return False
    await db.delete(db_expense)
    await db.commit()
    return True

async def get_expense_analytics(db: AsyncSession) -> Dict[str, Any]:
    # Monthly totals (last 12 months roughly, but we'll group by month)
    # Since SQLite date functions differ from Postgres, we'll do simple extraction if possible
    # Or fetch all and group in python for simplicity since this is a local app
    
    result = await db.execute(select(Expense))
    all_expenses = result.scalars().all()
    
    monthly_totals = {}
    category_totals = {}
    
    for expense in all_expenses:
        # Month string YYYY-MM
        month_key = expense.date.strftime("%Y-%m")
        monthly_totals[month_key] = monthly_totals.get(month_key, 0) + expense.amount
        
        # Category totals
        cat = expense.category
        category_totals[cat] = category_totals.get(cat, 0) + expense.amount
        
    # Format for recharts
    monthly_data = [{"month": k, "total": round(v, 2)} for k, v in sorted(monthly_totals.items())]
    category_data = [{"category": k, "total": round(v, 2)} for k, v in category_totals.items()]
    
    return {
        "monthly": monthly_data,
        "categories": category_data,
        "total_expenses": sum(e.amount for e in all_expenses)
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.visitors import Visitor
from pydantic import BaseModel

router = APIRouter()

class VisitorCreate(BaseModel):
    email: str

@router.post("/", status_code=status.HTTP_200_OK)
async def capture_email(visitor_in: VisitorCreate, db: AsyncSession = Depends(get_db)):
    # Check if visitor already exists
    result = await db.execute(select(Visitor).where(Visitor.email == visitor_in.email))
    visitor = result.scalars().first()

    if visitor:
        # Increment visit count
        visitor.visit_count += 1
        await db.commit()
        return {"status": "success", "message": "Welcome back", "visits": visitor.visit_count}
    
    # Create new visitor
    new_visitor = Visitor(email=visitor_in.email)
    db.add(new_visitor)
    await db.commit()
    await db.refresh(new_visitor)
    return {"status": "success", "message": "Email captured", "visits": 1}

@router.get("/", response_model=List[Dict[str, Any]])
async def list_visitors(db: AsyncSession = Depends(get_db)):
    # Simple endpoint to view captured emails (In production, protect this with auth)
    result = await db.execute(select(Visitor).order_by(Visitor.last_seen_at.desc()))
    visitors = result.scalars().all()
    
    return [
        {
            "id": v.id,
            "email": v.email,
            "first_seen_at": v.first_seen_at,
            "last_seen_at": v.last_seen_at,
            "visit_count": v.visit_count
        }
        for v in visitors
    ]

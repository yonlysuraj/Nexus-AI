import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db import crud_expenses
from app.schemas.receipt_tracker import (
    ExpenseResponse, ExpenseCreate, ExpenseUpdate, ReceiptExtractResponse
)
from app.services.receipt_scanner import receipt_scanner
from app.core.config import settings
from loguru import logger

router = APIRouter(prefix="/api/v1/receipt_tracker", tags=["Receipt Tracker"])

UPLOAD_DIR = os.path.join(settings.DATA_DIR, "receipts")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/extract", response_model=ReceiptExtractResponse)
async def extract_receipt(file: UploadFile = File(...)):
    """Upload a receipt image and extract structured data without saving to DB yet."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        # Preprocess image
        image_bytes = await receipt_scanner.process_image(file)
        
        # Save image to disk temporarily or permanently
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, 'wb') as out_file:
            out_file.write(image_bytes)
            
        # Extract data
        extracted_data = await receipt_scanner.extract_receipt_data(image_bytes)
        
        # Return path relative to the app so frontend can fetch it if served
        relative_path = f"/receipts/{unique_filename}"
        
        return ReceiptExtractResponse(
            extracted_data=extracted_data,
            image_path=relative_path
        )
    except Exception as e:
        logger.error(f"Error extracting receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to process receipt image")

@router.get("/expenses", response_model=List[ExpenseResponse])
async def read_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: str = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of expenses."""
    return await crud_expenses.get_expenses(db, skip=skip, limit=limit, category=category)

@router.get("/expenses/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    """Get aggregated data for charts."""
    return await crud_expenses.get_expense_analytics(db)

@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new expense (manual entry or verified from receipt)."""
    return await crud_expenses.create_expense(db, expense)

@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense: ExpenseUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing expense."""
    db_expense = await crud_expenses.update_expense(db, expense_id, expense)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an expense."""
    success = await crud_expenses.delete_expense(db, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"status": "success"}

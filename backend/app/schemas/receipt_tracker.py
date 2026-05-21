from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class ExpenseBase(BaseModel):
    vendor: str
    amount: float
    currency: str = "USD"
    date: date
    category: str

class ExpenseCreate(ExpenseBase):
    receipt_image_path: Optional[str] = None

class ExpenseUpdate(BaseModel):
    vendor: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[date] = None
    category: Optional[str] = None
    receipt_image_path: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: str
    receipt_image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExtractedReceiptData(BaseModel):
    vendor: str = Field(description="Name of the store or vendor")
    amount: float = Field(description="Total amount of the receipt")
    currency: str = Field(description="Currency code like USD, EUR")
    date: str = Field(description="Date in YYYY-MM-DD format")
    category: str = Field(description="Category of the expense (e.g., Food, Transport, Shopping, Bills, Software, Entertainment)")
    items: List[Dict[str, Any]] = Field(description="List of extracted items with name and price", default=[])

class ReceiptExtractResponse(BaseModel):
    extracted_data: ExtractedReceiptData
    image_path: Optional[str] = None

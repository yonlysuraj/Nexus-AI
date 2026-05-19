from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ToolRun(Base):
    __tablename__ = "tool_runs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    tool_name = Column(String, index=True, nullable=False)
    input_data = Column(Text, nullable=False)      # Store JSON or raw text depending on tool
    output_data = Column(Text, nullable=False)     # Store JSON or raw text
    processing_time_ms = Column(Float, nullable=False)
    model_used = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

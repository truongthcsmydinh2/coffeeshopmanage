from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class ReceiptTemplate(Base):
    __tablename__ = "receipt_templates"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    header = Column(Text)
    footer = Column(Text)
    is_active = Column(Boolean, default=True)
    template_type = Column(String(20))  # order, invoice, report
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 
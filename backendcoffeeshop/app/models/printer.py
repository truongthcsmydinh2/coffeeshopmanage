from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class PrinterSettings(Base):
    __tablename__ = "printer_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    ip_address = Column(String(50))
    port = Column(Integer)
    paper_width = Column(Integer)  # in mm
    is_active = Column(Boolean, default=True)
    printer_type = Column(String(20))  # thermal, normal
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 
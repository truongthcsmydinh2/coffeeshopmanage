from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    shift_type = Column(String(50))  # morning, afternoon, evening
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime, nullable=True)
    initial_cash = Column(Float, nullable=True)
    end_cash = Column(Float, nullable=True)
    order_paper_count = Column(Integer, default=0)  # Số cuống order bắt đầu
    end_order_paper_count = Column(Integer, nullable=True)  # Số cuống order kết thúc
    status = Column(String(50), default="active")  # active, closed
    note = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship
    staff = relationship("Staff", back_populates="shifts") 
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base

class Shift(Base):
    __tablename__ = "shifts"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    staff_id_2 = Column(Integer, ForeignKey("staff.id"), nullable=True)
    shift_type = Column(String(50))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    initial_cash = Column(Float, default=0)
    end_cash = Column(Float)
    staff1_start_order_number = Column(Integer)
    staff1_end_order_number = Column(Integer)
    staff1_calculated_total_orders = Column(Integer)
    staff2_start_order_number = Column(Integer)
    staff2_end_order_number = Column(Integer)
    staff2_calculated_total_orders = Column(Integer)
    total_shift_orders = Column(Integer)
    status = Column(String(20))
    note = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    staff = relationship("Staff", back_populates="shifts_as_staff1", foreign_keys=[staff_id])
    staff2 = relationship("Staff", back_populates="shifts_as_staff2", foreign_keys=[staff_id_2])
    orders = relationship("Order", back_populates="shift")
    schedules = relationship("StaffSchedule", back_populates="shift") 
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, func
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class StaffRole(Base):
    __tablename__ = "staff_roles"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    description = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff = relationship("Staff", back_populates="role")

class Staff(Base):
    __tablename__ = "staff"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, nullable=True)
    phone = Column(String(20))
    address = Column(String(255), nullable=True)
    role_id = Column(Integer, ForeignKey("staff_roles.id"))
    salary = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    role = relationship("StaffRole", back_populates="staff")
    performances = relationship("StaffPerformance", back_populates="staff")
    attendances = relationship("StaffAttendance", back_populates="staff")
    schedules = relationship("StaffSchedule", back_populates="staff")
    shifts_as_staff1 = relationship("Shift", back_populates="staff", foreign_keys="Shift.staff_id")
    shifts_as_staff2 = relationship("Shift", back_populates="staff2", foreign_keys="Shift.staff_id_2")
    orders = relationship("Order", back_populates="staff")

class StaffAttendance(Base):
    __tablename__ = "staff_attendance"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    date = Column(DateTime)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    status = Column(String(20))  # present, absent, late
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff = relationship("Staff", back_populates="attendances")

class StaffPerformance(Base):
    __tablename__ = "staff_performance"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    date = Column(DateTime)
    sales_amount = Column(Float)
    orders_handled = Column(Integer)
    customer_satisfaction = Column(Float)
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff = relationship("Staff", back_populates="performances")

class StaffSchedule(Base):
    __tablename__ = "staff_schedule"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)
    date = Column(DateTime)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String(20))  # scheduled, completed, cancelled
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff = relationship("Staff", back_populates="schedules")
    shift = relationship("Shift", back_populates="schedules") 
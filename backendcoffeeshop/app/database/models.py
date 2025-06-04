from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON, Enum, Date, Time, Text, CheckConstraint
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import enum
import re
from sqlalchemy.sql import func
from .database import Base

# Import các model từ app/models
from ..models import (
    MenuGroup, MenuItem, Order, OrderItem, Payment, Promotion,
    Table, Staff, StaffRole, StaffAttendance, StaffPerformance, StaffSchedule,
    Shift, Product, ProductPerformance
)

class ShiftType(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"

class TableStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"

class StaffStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

# Export các model và enum
__all__ = [
    'MenuGroup', 'MenuItem', 'Order', 'OrderItem', 'Payment', 'Promotion',
    'Table', 'Staff', 'StaffRole', 'StaffAttendance', 'StaffPerformance', 'StaffSchedule',
    'Shift', 'Product', 'ProductPerformance',
    'ShiftType', 'OrderStatus', 'TableStatus', 'StaffStatus'
] 
from sqlalchemy.orm import Session
from ..database.database import Base

# Import các model để đảm bảo chúng được đăng ký với Base
from .menu import MenuGroup, MenuItem
from .order import Order, OrderItem, Payment
from .promotion import Promotion
from .table import Table
from .staff import Staff, StaffRole, StaffAttendance, StaffPerformance, StaffSchedule
from .shift import Shift
from .product import Product, ProductPerformance

__all__ = [
    'Base',
    'MenuGroup',
    'MenuItem',
    'Order',
    'OrderItem',
    'Payment',
    'Promotion',
    'Table',
    'Staff',
    'StaffRole',
    'StaffAttendance',
    'StaffPerformance',
    'StaffSchedule',
    'Shift',
    'Product',
    'ProductPerformance'
]

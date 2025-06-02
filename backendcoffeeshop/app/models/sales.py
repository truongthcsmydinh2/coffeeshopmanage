from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class SalesReport(Base):
    __tablename__ = "sales_reports"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    total_sales = Column(Float)
    total_orders = Column(Integer)
    total_customers = Column(Integer)
    average_order_value = Column(Float)
    payment_methods = Column(JSON)  # {"cash": 1000, "card": 2000}
    top_products = Column(JSON)  # [{"id": 1, "name": "Coffee", "quantity": 10}]
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 
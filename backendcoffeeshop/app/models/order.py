from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    staff_id = Column(Integer, ForeignKey("staff.id"))
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=True)
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    total_amount = Column(Float)
    discount_amount = Column(Float, default=0)
    final_amount = Column(Float)
    status = Column(String(20))  # pending, completed, cancelled
    payment_status = Column(String(20))  # unpaid, paid, refunded
    note = Column(String(200))
    order_code = Column(String(50), unique=True, index=True)
    time_in = Column(DateTime, default=datetime.utcnow)
    time_out = Column(DateTime, nullable=True)

    table = relationship("Table", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    shift = relationship("Shift", back_populates="orders")
    promotion = relationship("Promotion", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)
    note = Column(String(200))

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    payment_method = Column(String(20))  # cash, card, transfer
    payment_status = Column(String(20))  # pending, completed, failed
    transaction_id = Column(String(100))
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="payments") 
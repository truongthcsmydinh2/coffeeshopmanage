from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    code = Column(String(50), unique=True, index=True)
    description = Column(String(200))
    price = Column(Float)
    cost = Column(Float)
    stock = Column(Integer)
    unit = Column(String(20))
    category_id = Column(Integer, ForeignKey("menu_groups.id"))
    is_active = Column(Boolean, default=True)
    image_url = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("MenuGroup", back_populates="products")
    performance = relationship("ProductPerformance", back_populates="product")

class ProductPerformance(Base):
    __tablename__ = "product_performance"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    date = Column(DateTime)
    quantity_sold = Column(Integer)
    revenue = Column(Float)
    profit = Column(Float)
    note = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="performance") 
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from . import Base

class MenuGroup(Base):
    __tablename__ = "menu_groups"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    description = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("MenuItem", back_populates="group")
    products = relationship("Product", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    group_id = Column(Integer, ForeignKey("menu_groups.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("MenuGroup", back_populates="items") 
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    price: float
    cost: float
    stock: int
    unit: str
    category_id: int
    is_active: bool = True
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    code: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock: Optional[int] = None
    unit: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductPerformanceBase(BaseModel):
    product_id: int
    date: datetime
    quantity_sold: int
    revenue: float
    profit: float
    note: Optional[str] = None

class ProductPerformanceCreate(ProductPerformanceBase):
    pass

class ProductPerformanceUpdate(ProductPerformanceBase):
    product_id: Optional[int] = None
    date: Optional[datetime] = None
    quantity_sold: Optional[int] = None
    revenue: Optional[float] = None
    profit: Optional[float] = None

class ProductPerformance(ProductPerformanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
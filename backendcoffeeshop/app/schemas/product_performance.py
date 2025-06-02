from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProductPerformanceBase(BaseModel):
    product_id: int
    date: datetime
    quantity_sold: int
    revenue: float
    profit: float
    rating: Optional[float] = None
    feedback_count: int = 0

class ProductPerformanceCreate(ProductPerformanceBase):
    pass

class ProductPerformance(ProductPerformanceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
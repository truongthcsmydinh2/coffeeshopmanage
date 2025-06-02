from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PromotionBase(BaseModel):
    name: str
    description: Optional[str] = None
    discount_type: str  # percentage or fixed_amount
    discount_value: float
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    min_order_amount: Optional[float] = None
    max_discount: Optional[float] = None
    code: Optional[str] = None

class PromotionCreate(PromotionBase):
    pass

class PromotionUpdate(PromotionBase):
    pass

class Promotion(PromotionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
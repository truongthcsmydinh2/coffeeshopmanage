from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductIngredientBase(BaseModel):
    product_id: int
    ingredient_id: int
    quantity: float

class ProductIngredientCreate(ProductIngredientBase):
    pass

class ProductIngredientUpdate(ProductIngredientBase):
    product_id: Optional[int] = None
    ingredient_id: Optional[int] = None
    quantity: Optional[float] = None

class ProductIngredient(ProductIngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IngredientBase(BaseModel):
    name: str
    code: str
    unit: str
    stock: float
    min_stock: float
    category_id: Optional[int] = None
    is_active: bool = True
    description: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(IngredientBase):
    name: Optional[str] = None
    code: Optional[str] = None
    unit: Optional[str] = None
    stock: Optional[float] = None
    min_stock: Optional[float] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class Ingredient(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
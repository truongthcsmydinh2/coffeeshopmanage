from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    code: str
    unit: str
    price: float
    group_id: int

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(MenuItemBase):
    name: Optional[str] = None
    code: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    group_id: Optional[int] = None

class MenuItemResponse(MenuItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
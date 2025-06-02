from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class MenuGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class MenuGroupCreate(MenuGroupBase):
    pass

class MenuGroupUpdate(MenuGroupBase):
    pass

class MenuGroup(MenuGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str
    code: str
    unit: str
    price: float
    group_id: int

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TableBase(BaseModel):
    name: str
    capacity: int
    status: str
    location: Optional[str] = None
    is_active: Optional[bool] = True
    note: Optional[str] = None

class TableCreate(TableBase):
    pass

class TableUpdate(TableBase):
    pass

class Table(TableBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
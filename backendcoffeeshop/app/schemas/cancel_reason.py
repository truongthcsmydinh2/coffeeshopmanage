from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CancelReasonBase(BaseModel):
    reason: str
    is_active: bool = True
    note: Optional[str] = None

class CancelReasonCreate(CancelReasonBase):
    pass

class CancelReasonUpdate(CancelReasonBase):
    reason: Optional[str] = None
    is_active: Optional[bool] = None
    note: Optional[str] = None

class CancelReason(CancelReasonBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
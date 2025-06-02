from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShiftBase(BaseModel):
    staff_id: int
    shift_type: str
    initial_cash: Optional[float] = None
    order_paper_count: int  # Số cuống order bắt đầu

class ShiftCreate(ShiftBase):
    pass

class ShiftUpdate(BaseModel):
    staff_id: Optional[int] = None
    shift_type: Optional[str] = None
    initial_cash: Optional[float] = None
    end_cash: Optional[float] = None
    order_paper_count: Optional[int] = None
    end_order_paper_count: Optional[int] = None  # Số cuống order kết thúc
    status: Optional[str] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None
    note: Optional[str] = None

class Shift(ShiftBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    end_cash: Optional[float] = None
    end_order_paper_count: Optional[int] = None  # Số cuống order kết thúc
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    staff_name: Optional[str] = None  # Để hiển thị tên nhân viên trong response

    class Config:
        from_attributes = True 
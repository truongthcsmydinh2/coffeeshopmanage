from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShiftBase(BaseModel):
    staff_id: int
    staff_id_2: Optional[int] = None
    shift_type: str
    initial_cash: Optional[float] = None
    staff1_start_order_number: Optional[int] = None
    staff2_start_order_number: Optional[int] = None
    note: Optional[str] = None

class ShiftCreate(ShiftBase):
    pass

class ShiftUpdate(BaseModel):
    staff_id: Optional[int] = None
    staff_id_2: Optional[int] = None
    shift_type: Optional[str] = None
    initial_cash: Optional[float] = None
    end_cash: Optional[float] = None
    staff1_start_order_number: Optional[int] = None
    staff1_end_order_number: Optional[int] = None
    staff2_start_order_number: Optional[int] = None
    staff2_end_order_number: Optional[int] = None
    status: Optional[str] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None
    note: Optional[str] = None

class Shift(ShiftBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    end_cash: Optional[float] = None
    staff1_end_order_number: Optional[int] = None
    staff1_calculated_total_orders: Optional[int] = None
    staff2_end_order_number: Optional[int] = None
    staff2_calculated_total_orders: Optional[int] = None
    total_shift_orders: Optional[int] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    staff_name: Optional[str] = None  # Để hiển thị tên nhân viên trong response
    staff2_name: Optional[str] = None  # Để hiển thị tên nhân viên thứ 2 trong response

    class Config:
        from_attributes = True 
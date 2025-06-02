from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StaffBase(BaseModel):
    name: str
    code: str
    role_id: int
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    salary: Optional[float] = 0.0

class StaffCreate(StaffBase):
    pass

class StaffUpdate(StaffBase):
    is_active: Optional[bool] = None
    code: Optional[str] = None
    name: Optional[str] = None
    role_id: Optional[int] = None
    salary: Optional[float] = None

class Staff(StaffBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StaffRoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class StaffRoleCreate(StaffRoleBase):
    pass

class StaffRoleUpdate(StaffRoleBase):
    pass

class StaffRole(StaffRoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StaffAttendanceBase(BaseModel):
    staff_id: int
    check_in: datetime
    check_out: Optional[datetime] = None
    note: Optional[str] = None

class StaffAttendanceCreate(StaffAttendanceBase):
    pass

class StaffAttendanceUpdate(StaffAttendanceBase):
    pass

class StaffAttendance(StaffAttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StaffPerformanceBase(BaseModel):
    staff_id: int
    date: datetime
    sales_amount: float
    orders_count: int
    rating: float
    note: Optional[str] = None

class StaffPerformanceCreate(StaffPerformanceBase):
    pass

class StaffPerformanceUpdate(StaffPerformanceBase):
    pass

class StaffPerformance(StaffPerformanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StaffScheduleBase(BaseModel):
    staff_id: int
    date: datetime
    start_time: datetime
    end_time: datetime
    note: Optional[str] = None

class StaffScheduleCreate(StaffScheduleBase):
    pass

class StaffScheduleUpdate(StaffScheduleBase):
    pass

class StaffSchedule(StaffScheduleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
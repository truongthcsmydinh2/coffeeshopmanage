from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True

class StaffBase(BaseModel):
    username: str
    full_name: str
    email: str
    phone: str
    role_id: int

class StaffCreate(StaffBase):
    password: str

class StaffResponse(StaffBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: Role

    class Config:
        from_attributes = True 
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from .menu_item import MenuItemResponse

class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int
    unit_price: float
    total_price: float
    note: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    total_price: float
    note: Optional[str] = None
    name: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @validator('name', pre=True, always=True)
    def validate_name(cls, v):
        if v is None or v == "":
            return "Không có tên món"
        return v

class OrderBase(BaseModel):
    table_id: int
    staff_id: int
    shift_id: int
    total_amount: float
    status: str
    note: Optional[str] = None
    order_code: Optional[str] = None
    payment_status: Optional[str] = None
    time_in: Optional[datetime] = None
    time_out: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    table_id: int
    staff_id: int
    shift_id: int
    status: str
    total_amount: float
    note: Optional[str] = None
    order_code: str
    payment_status: str
    time_in: datetime
    time_out: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @validator('time_in', pre=True)
    def validate_time_in(cls, v):
        if v is None:
            return datetime.now()
        return v

    @validator('items')
    def validate_items(cls, v):
        if not v:
            return [OrderItemResponse(
                id=0,
                order_id=0,
                menu_item_id=0,
                quantity=0,
                unit_price=0,
                total_price=0,
                note="",
                name="Không có món ăn"
            )]
        return v

class OrderUpdate(BaseModel):
    table_id: Optional[int] = None
    staff_id: Optional[int] = None
    shift_id: Optional[int] = None
    status: Optional[str] = None
    total_amount: Optional[float] = None
    note: Optional[str] = None
    order_code: Optional[str] = None
    payment_status: Optional[str] = None
    time_in: Optional[datetime] = None
    time_out: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OrderItemUpdate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OrderWithItems(BaseModel):
    id: int
    table_id: int
    staff_id: int
    status: str
    total_amount: float
    note: Optional[str] = None
    items: List[OrderItem]

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaymentBase(BaseModel):
    order_id: int
    amount: float
    payment_method: str
    status: str
    note: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Order(OrderBase):
    id: int
    items: List[OrderItem] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 
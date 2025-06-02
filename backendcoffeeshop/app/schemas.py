from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, ForwardRef
from datetime import datetime, date, time
from enum import Enum

# Menu Group Schemas
class MenuGroupBase(BaseModel):
    name: str

class MenuGroupCreate(MenuGroupBase):
    pass

class MenuGroup(MenuGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Menu Item Schemas
class MenuItemBase(BaseModel):
    code: str
    name: str
    group_id: int
    unit: str
    price: float

class MenuItemCreate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Staff Schemas
class StaffRoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[Dict] = None

class StaffRoleCreate(StaffRoleBase):
    pass

class StaffRole(StaffRoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StaffBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role_id: int
    status: Optional[str] = "active"

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    created_at: datetime
    updated_at: datetime
    role: StaffRole

    class Config:
        from_attributes = True

class StaffAttendanceBase(BaseModel):
    staff_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class StaffAttendanceCreate(StaffAttendanceBase):
    pass

class StaffAttendance(StaffAttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    staff: Staff

    class Config:
        from_attributes = True

class StaffPerformanceBase(BaseModel):
    staff_id: int
    date: date
    orders_handled: Optional[int] = 0
    total_sales: Optional[float] = 0
    customer_rating: Optional[float] = None
    notes: Optional[str] = None

class StaffPerformanceCreate(StaffPerformanceBase):
    pass

class StaffPerformance(StaffPerformanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    staff: Staff

    class Config:
        from_attributes = True

class StaffScheduleBase(BaseModel):
    staff_id: int
    date: date
    start_time: time
    end_time: time
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None

class StaffScheduleCreate(StaffScheduleBase):
    pass

class StaffSchedule(StaffScheduleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    staff: Staff

    class Config:
        from_attributes = True

# Shift Schemas
class ShiftBase(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime

class ShiftCreate(ShiftBase):
    pass

class Shift(ShiftBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Cancel Reason Schemas
class CancelReasonBase(BaseModel):
    type: str
    reason_text: str

class CancelReasonCreate(CancelReasonBase):
    pass

class CancelReason(CancelReasonBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Print Setting Schemas
class PrintSettingBase(BaseModel):
    type: str
    settings_json: dict

class PrintSettingCreate(PrintSettingBase):
    pass

class PrintSetting(PrintSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Promotion Schemas
class PromotionBase(BaseModel):
    code: str
    type: str
    value: float
    start_date: datetime
    end_date: datetime

class PromotionCreate(PromotionBase):
    pass

class Promotion(PromotionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Table Schemas
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

# Order Item Schemas
class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int
    unit_price: float
    total_price: float
    note: Optional[str] = None
    status: str = "pending"
    cancel_reason_id: Optional[int] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime
    name: str

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    table_id: int
    staff_id: int
    shift_id: int
    status: str
    order_code: str
    total_amount: float

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    time_in: datetime
    time_out: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem]

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    order_id: int
    member_card: Optional[str]
    coupon_code: Optional[str]
    subtotal: float
    discount_amount: float
    total_amount: float

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    payment_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class PrinterSettingsBase(BaseModel):
    name: str
    ip_address: Optional[str] = None
    port: Optional[int] = 9100
    paper_width: Optional[int] = 80
    is_default: Optional[bool] = False

class PrinterSettingsCreate(PrinterSettingsBase):
    pass

class PrinterSettings(PrinterSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReceiptTemplateBase(BaseModel):
    name: str
    type: str
    header: Optional[str] = None
    footer: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = True

class ReceiptTemplateCreate(ReceiptTemplateBase):
    pass

class ReceiptTemplate(ReceiptTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SalesReportBase(BaseModel):
    report_date: date
    report_type: str
    total_revenue: Optional[float] = 0
    total_orders: Optional[int] = 0
    cancelled_orders: Optional[int] = 0
    payment_methods: Optional[Dict] = {}
    product_groups: Optional[Dict] = {}
    hourly_revenue: Optional[Dict] = {}

class SalesReportCreate(SalesReportBase):
    pass

class SalesReport(SalesReportBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_active: Optional[bool] = True
    category_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Category

    class Config:
        from_attributes = True

# Product Performance Schemas
class ProductPerformanceBase(BaseModel):
    product_id: int
    report_date: date
    quantity_sold: Optional[int] = 0
    revenue: Optional[float] = 0
    profit: Optional[float] = 0
    cancelled_quantity: Optional[int] = 0
    average_rating: Optional[float] = None

class ProductPerformanceCreate(ProductPerformanceBase):
    pass

class ProductPerformance(ProductPerformanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    product: Product

    class Config:
        from_attributes = True

# Ingredient Schemas
class IngredientBase(BaseModel):
    name: str
    unit: str
    quantity: float
    min_quantity: float

class IngredientCreate(IngredientBase):
    pass

class Ingredient(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ProductIngredient Schemas
class ProductIngredientBase(BaseModel):
    product_id: int
    ingredient_id: int
    quantity: float

class ProductIngredientCreate(ProductIngredientBase):
    pass

class ProductIngredient(ProductIngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    product: Product
    ingredient: Ingredient

    class Config:
        from_attributes = True 
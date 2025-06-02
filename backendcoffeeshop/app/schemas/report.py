from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SalesReportBase(BaseModel):
    start_date: datetime
    end_date: datetime
    total_sales: float
    total_orders: int
    average_order_value: float
    payment_methods: dict
    top_products: List[dict]
    top_categories: List[dict]

class SalesReportCreate(SalesReportBase):
    pass

class SalesReport(SalesReportBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
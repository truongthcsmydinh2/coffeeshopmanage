from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class TopProduct(BaseModel):
    product_id: int
    quantity: int
    revenue: float

class SalesReportBase(BaseModel):
    date: datetime
    total_sales: float
    total_orders: int
    total_customers: int
    average_order_value: float
    payment_methods: Dict[str, float]  # {method: amount}
    top_products: List[TopProduct]  # [{product_id: id, quantity: qty, revenue: rev}]
    note: Optional[str] = None

    model_config = {
        "arbitrary_types_allowed": True
    }

class SalesReportCreate(SalesReportBase):
    pass

class SalesReportUpdate(SalesReportBase):
    pass

class SalesReport(SalesReportBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
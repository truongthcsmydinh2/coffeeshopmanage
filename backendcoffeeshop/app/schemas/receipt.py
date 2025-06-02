from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReceiptTemplateBase(BaseModel):
    name: str
    header: str
    footer: Optional[str] = None
    is_active: bool = True
    template_type: str  # receipt or kitchen
    note: Optional[str] = None

class ReceiptTemplateCreate(ReceiptTemplateBase):
    pass

class ReceiptTemplateUpdate(ReceiptTemplateBase):
    pass

class ReceiptTemplate(ReceiptTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
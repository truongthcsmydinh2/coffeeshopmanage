from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PrinterSettingsBase(BaseModel):
    name: str
    ip_address: str
    port: int
    paper_width: int
    is_active: bool = True
    printer_type: str  # receipt or kitchen
    note: Optional[str] = None

class PrinterSettingsCreate(PrinterSettingsBase):
    pass

class PrinterSettingsUpdate(PrinterSettingsBase):
    pass

class PrinterSettings(PrinterSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
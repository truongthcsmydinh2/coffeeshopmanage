from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from ...database import get_db
from ...models.shift import Shift as ShiftModel
from ...models.staff import Staff
from ...schemas.shift import Shift
from sqlalchemy import or_

router = APIRouter()

@router.get("/current", response_model=Optional[Shift])
def get_current_shift(db: Session = Depends(get_db)):
    """
    Lấy thông tin ca làm việc hiện tại
    """
    current_time = datetime.now()
    
    # Tìm ca làm việc đang diễn ra
    current_shift = db.query(ShiftModel).filter(
        ShiftModel.start_time <= current_time,
        or_(
            # Trường hợp 1: Ca làm việc đang diễn ra (end_time > current_time)
            ShiftModel.end_time >= current_time,
            # Trường hợp 2: Ca làm việc chưa kết thúc (end_time là NULL)
            ShiftModel.end_time == None
        ),
        ShiftModel.is_active == True
    ).first()
    
    # Nếu không tìm thấy ca làm việc hiện tại
    if not current_shift:
        return None
    
    # Lấy thông tin nhân viên
    staff = db.query(Staff).filter(Staff.id == current_shift.staff_id).first()
    if staff:
        current_shift_dict = current_shift.__dict__.copy()
        current_shift_dict["staff_name"] = staff.name
        return current_shift_dict
        
    return current_shift 
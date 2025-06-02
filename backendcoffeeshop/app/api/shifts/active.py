from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...models.shift import Shift as ShiftModel
from ...models.staff import Staff
from ...schemas.shift import Shift

router = APIRouter()

@router.get("/active", response_model=List[Shift])
def get_active_shifts(db: Session = Depends(get_db)):
    """
    Lấy danh sách ca làm việc đang mở
    """
    # Tìm ca làm việc đang mở (chưa kết thúc)
    active_shifts = db.query(ShiftModel).filter(
        ShiftModel.end_time == None,
        ShiftModel.is_active == True
    ).all()
    
    # Nếu không có ca làm việc nào đang mở, trả về danh sách rỗng
    if not active_shifts:
        return []
    
    # Lấy thông tin nhân viên cho mỗi ca
    result = []
    for shift in active_shifts:
        staff = db.query(Staff).filter(Staff.id == shift.staff_id).first()
        shift_dict = shift.__dict__.copy()
        shift_dict["staff_name"] = staff.name if staff else "Unknown"
        result.append(shift_dict)
    
    return result 
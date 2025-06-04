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
        # Lấy thông tin nhân viên 1
        staff1 = db.query(Staff).filter(Staff.id == shift.staff_id).first()
        # Lấy thông tin nhân viên 2 (nếu có)
        staff2 = db.query(Staff).filter(Staff.id == shift.staff_id_2).first() if shift.staff_id_2 else None
        
        shift_dict = shift.__dict__.copy()
        shift_dict["staff_name"] = staff1.name if staff1 else "Unknown"
        shift_dict["staff2_name"] = staff2.name if staff2 else None
        result.append(shift_dict)
    
    return result 
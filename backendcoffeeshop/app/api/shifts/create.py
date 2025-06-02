from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ...database import get_db
from ...models.shift import Shift as ShiftModel
from ...models.staff import Staff
from ...schemas.shift import ShiftCreate, Shift

router = APIRouter()

@router.post("/", response_model=Shift)
def create_shift(shift: ShiftCreate, db: Session = Depends(get_db)):
    """
    Tạo ca làm việc mới
    """
    # Kiểm tra nhân viên tồn tại
    staff = db.query(Staff).filter(Staff.id == shift.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    
    # Kiểm tra xem có ca làm việc nào đang mở không
    active_shift = db.query(ShiftModel).filter(
        ShiftModel.end_time == None,
        ShiftModel.is_active == True
    ).first()
    
    if active_shift:
        raise HTTPException(status_code=400, detail="Đã có ca làm việc đang được mở")
    
    # Tạo ca làm việc mới
    db_shift = ShiftModel(
        staff_id=shift.staff_id,
        shift_type=shift.shift_type,
        start_time=datetime.now(),
        initial_cash=shift.initial_cash,
        order_paper_count=shift.order_paper_count,
        status="active",
        is_active=True
    )
    
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    
    # Lấy thông tin nhân viên để trả về
    staff_name = staff.name
    
    # Tạo response với thông tin ca làm việc và tên nhân viên
    response = db_shift.__dict__.copy()
    response["staff_name"] = staff_name
    
    return response 
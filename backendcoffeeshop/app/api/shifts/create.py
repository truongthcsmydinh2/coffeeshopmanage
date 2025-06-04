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
    # Kiểm tra nhân viên 1 tồn tại
    staff1 = db.query(Staff).filter(Staff.id == shift.staff_id).first()
    if not staff1:
        raise HTTPException(status_code=404, detail="Nhân viên 1 không tồn tại")
    
    # Kiểm tra nhân viên 2 tồn tại (nếu có)
    staff2 = None
    if shift.staff_id_2:
        staff2 = db.query(Staff).filter(Staff.id == shift.staff_id_2).first()
        if not staff2:
            raise HTTPException(status_code=404, detail="Nhân viên 2 không tồn tại")
    
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
        staff_id_2=shift.staff_id_2,
        shift_type=shift.shift_type,
        start_time=datetime.now(),
        initial_cash=shift.initial_cash,
        staff1_start_order_number=shift.staff1_start_order_number,
        staff2_start_order_number=shift.staff2_start_order_number,
        note=shift.note,
        status="open",
        is_active=True
    )
    
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    
    # Lấy thông tin nhân viên để trả về
    staff1_name = staff1.name if staff1 else None
    staff2_name = staff2.name if staff2 else None
    
    # Tạo response với thông tin ca làm việc và tên nhân viên
    response = db_shift.__dict__.copy()
    response["staff_name"] = staff1_name
    response["staff2_name"] = staff2_name
    
    return response
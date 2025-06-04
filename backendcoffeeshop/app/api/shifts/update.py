from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ...database import get_db
from ...models.shift import Shift as ShiftModel
from ...models.staff import Staff
from ...schemas.shift import ShiftUpdate, Shift
from datetime import datetime
from .utils import calculate_total_orders

router = APIRouter()

@router.put("/{shift_id}", response_model=Shift)
def update_shift(
    shift_id: int, 
    shift_update: ShiftUpdate, 
    db: Session = Depends(get_db)
):
    """
    Cập nhật thông tin ca làm việc trong quá trình ca đang chạy
    """
    # Kiểm tra shift có tồn tại không
    shift = db.query(ShiftModel).filter(ShiftModel.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca làm việc")
    
    # Kiểm tra ca có đang mở không
    if shift.status != "open" or not shift.is_active:
        raise HTTPException(status_code=400, detail="Chỉ có thể cập nhật ca làm việc đang mở")
    
    # Cập nhật các thông tin cơ bản
    if shift_update.end_cash is not None:
        shift.end_cash = shift_update.end_cash
    
    if shift_update.note is not None:
        shift.note = shift_update.note
    
    # Xử lý số lượng order của nhân viên 1
    if shift_update.staff1_end_order_number is not None:
        shift.staff1_end_order_number = shift_update.staff1_end_order_number
        
        # Tính toán số lượng order của nhân viên 1 nếu có start_order_number
        if shift.staff1_start_order_number is not None:
            shift.staff1_calculated_total_orders = calculate_total_orders(
                shift.staff1_start_order_number, 
                shift.staff1_end_order_number
            )
    
    # Xử lý số lượng order của nhân viên 2
    if shift_update.staff2_end_order_number is not None:
        shift.staff2_end_order_number = shift_update.staff2_end_order_number
        
        # Tính toán số lượng order của nhân viên 2 nếu có start_order_number
        if shift.staff2_start_order_number is not None:
            shift.staff2_calculated_total_orders = calculate_total_orders(
                shift.staff2_start_order_number, 
                shift.staff2_end_order_number
            )
    
    # Tính tổng số order của cả ca làm việc
    staff1_orders = shift.staff1_calculated_total_orders or 0
    staff2_orders = shift.staff2_calculated_total_orders or 0
    shift.total_shift_orders = staff1_orders + staff2_orders
    
    # Cập nhật thời gian
    shift.updated_at = datetime.now()
    
    db.commit()
    db.refresh(shift)
    
    # Lấy thông tin nhân viên để trả về
    staff1 = db.query(Staff).filter(Staff.id == shift.staff_id).first() if shift.staff_id else None
    staff2 = db.query(Staff).filter(Staff.id == shift.staff_id_2).first() if shift.staff_id_2 else None
    
    # Tạo response với thông tin ca làm việc và tên nhân viên
    response = shift.__dict__.copy()
    response["staff_name"] = staff1.name if staff1 else None
    response["staff2_name"] = staff2.name if staff2 else None
    
    return response
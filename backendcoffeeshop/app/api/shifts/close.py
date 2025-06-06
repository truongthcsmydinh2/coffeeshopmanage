from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ...models.shift import Shift as ShiftModel
from ...models.staff import Staff
from ...database import get_db
from ...schemas.shift import ShiftUpdate, Shift
from datetime import datetime
from .utils import calculate_total_orders

router = APIRouter()

@router.put("/{shift_id}/close", response_model=Shift)
def close_shift(
    shift_id: int, 
    shift_update: ShiftUpdate, 
    db: Session = Depends(get_db)
):
    """
    Kết thúc ca làm việc
    """
    # Kiểm tra shift có tồn tại không
    shift = db.query(ShiftModel).filter(ShiftModel.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca làm việc")
    
    # Kiểm tra ca có đang mở không
    if shift.end_time is not None or shift.status != "open":
        raise HTTPException(status_code=400, detail="Ca làm việc này đã được đóng")
    
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
    
    # Tự động set end_time là thời điểm hiện tại
    shift.end_time = datetime.now()
    shift.status = "closed"
    shift.is_active = False
    
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
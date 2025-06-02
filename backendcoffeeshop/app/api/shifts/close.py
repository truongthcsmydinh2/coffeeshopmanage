from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ...models.shift import Shift as ShiftModel
from ...database import get_db
from ...schemas.shift import ShiftUpdate, Shift
from datetime import datetime

router = APIRouter()

@router.put("/{shift_id}/close", response_model=Shift)
def close_shift(
    shift_id: int, 
    shift_update: ShiftUpdate, 
    db: Session = Depends(get_db)
):
    # Kiểm tra shift có tồn tại không
    shift = db.query(ShiftModel).filter(ShiftModel.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca làm việc")
    
    # Kiểm tra ca có đang mở không
    if shift.end_time is not None or shift.status == "closed":
        raise HTTPException(status_code=400, detail="Ca làm việc này đã được đóng")
    
    # Kiểm tra số cuống order kết thúc
    if shift_update.end_order_paper_count is None:
        raise HTTPException(status_code=400, detail="Vui lòng nhập số cuống order kết thúc")
    
    if shift_update.end_order_paper_count <= shift.order_paper_count:
        raise HTTPException(
            status_code=400, 
            detail=f"Số cuống order kết thúc phải lớn hơn số cuống order bắt đầu ({shift.order_paper_count})"
        )
    
    # Tự động set end_time là thời điểm hiện tại
    shift.end_time = datetime.now()
    
    # Cập nhật các thông tin khác
    if shift_update.end_cash is not None:
        shift.end_cash = shift_update.end_cash
    
    shift.end_order_paper_count = shift_update.end_order_paper_count
    shift.status = "closed"
    shift.is_active = False
    
    if shift_update.note is not None:
        shift.note = shift_update.note
    
    db.commit()
    db.refresh(shift)
    
    # Cập nhật tên nhân viên cho response
    response = Shift.model_validate(shift)
    if shift.staff:
        response.staff_name = shift.staff.name
    
    return response 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging
import json
from ...database import get_db
from ...models.staff import Staff as StaffModel
from ...schemas.staff import StaffCreate, Staff

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("staff_api")

router = APIRouter()

@router.post("/", response_model=Staff)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    # Ghi log dữ liệu nhận được
    logger.info(f"Đang tạo nhân viên mới với dữ liệu: {json.dumps(staff.dict(), default=str, ensure_ascii=False)}")
    
    try:
        db_staff = StaffModel(
            name=staff.name,
            code=staff.code,
            role_id=staff.role_id,
            phone=staff.phone,
            email=staff.email,
            address=staff.address,
            salary=staff.salary,
            is_active=True
        )
        db.add(db_staff)
        db.commit()
        db.refresh(db_staff)
        logger.info(f"Đã tạo nhân viên thành công với ID: {db_staff.id}")
        return db_staff
    except Exception as e:
        logger.error(f"Lỗi khi tạo nhân viên: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo nhân viên: {str(e)}")

@router.get("/", response_model=List[Staff])
def get_all_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Lấy danh sách nhân viên (skip={skip}, limit={limit})")
    try:
        staff_list = db.query(StaffModel).offset(skip).limit(limit).all()
        return staff_list
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách nhân viên: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy danh sách nhân viên: {str(e)}") 
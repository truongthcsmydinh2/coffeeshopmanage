from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Staff as StaffModel, StaffRole
from ..schemas.staff import Staff

router = APIRouter()

@router.get("/by-role/{role_id}", response_model=List[Staff])
def get_staff_by_role(role_id: int, db: Session = Depends(get_db)):
    """
    Lấy danh sách nhân viên theo vai trò
    """
    staff = db.query(StaffModel).filter(StaffModel.role_id == role_id).all()
    return staff 
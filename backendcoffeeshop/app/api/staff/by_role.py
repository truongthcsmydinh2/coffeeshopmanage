from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...models.staff import Staff as StaffModel
from ...schemas.staff import Staff

router = APIRouter()

@router.get("/{role_id}", response_model=List[Staff])
def get_staff_by_role(role_id: int, db: Session = Depends(get_db)):
    staff = db.query(StaffModel).filter(StaffModel.role_id == role_id, StaffModel.is_active == True).all()
    if not staff:
        return []
    return staff 
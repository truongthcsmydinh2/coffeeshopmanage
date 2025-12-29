from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models import Shift
from typing import List

router = APIRouter()

@router.get("/get-all")
def get_all_shifts(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """Get all shifts regardless of status"""
    shifts = db.query(Shift).order_by(Shift.id.desc()).offset(skip).limit(limit).all()
    return shifts

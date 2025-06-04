from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Table
from app.database.database import get_db
from typing import List
from pydantic import BaseModel

router = APIRouter()

class TableResponse(BaseModel):
    id: int
    name: str
    status: str
    capacity: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TableResponse])
async def get_tables(db: Session = Depends(get_db)):
    try:
        tables = db.query(Table).all()
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models import MenuItem

router = APIRouter()

@router.get("/check-code")
def check_menu_item_code(code: str = Query(...), db: Session = Depends(get_db)):
    exists = db.query(MenuItem).filter(MenuItem.code == code).first() is not None
    return {"exists": exists} 
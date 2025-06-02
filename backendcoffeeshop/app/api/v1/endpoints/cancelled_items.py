from fastapi import APIRouter, Request
from datetime import datetime
from app.database.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

router = APIRouter()

@router.post("/api/v1/cancelled-items/")
async def create_cancelled_item(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    # Chuyển đổi cancelled_at sang định dạng MySQL nếu có
    if 'cancelled_at' in data:
        try:
            # Hỗ trợ cả ISO 8601 có 'Z' hoặc không
            dt = datetime.fromisoformat(data['cancelled_at'].replace('Z', '+00:00'))
            data['cancelled_at'] = dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            data['cancelled_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    else:
        data['cancelled_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    db.execute(
        text("""
        INSERT INTO cancelled_order_items (order_id, table_id, item_id, item_name, quantity, reason, cancelled_by, cancelled_at)
        VALUES (:order_id, :table_id, :item_id, :item_name, :quantity, :reason, :cancelled_by, :cancelled_at)
        """),
        data
    )
    db.commit()
    return {"success": True} 
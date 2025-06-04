from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Order, OrderItem, MenuItem
from app.database.database import get_db
from app.schemas.order import OrderResponse
from datetime import datetime, timezone, timedelta, time
from typing import List, Optional
import logging
from sqlalchemy import func

# Cấu hình logging
logger = logging.getLogger(__name__)

# Cấu hình timezone cho Việt Nam
VIETNAM_TIMEZONE = timezone(timedelta(hours=7))

def get_vietnam_time():
    """Lấy thời gian hiện tại theo múi giờ Việt Nam"""
    return datetime.now(VIETNAM_TIMEZONE)

def ensure_timezone(dt: datetime) -> datetime:
    """Đảm bảo datetime có timezone"""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=VIETNAM_TIMEZONE)
    return dt

router = APIRouter()

@router.get("/", response_model=List[OrderResponse])
async def get_complete_orders(
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        # Tạo base query - lấy tất cả orders không phân biệt trạng thái
        query = db.query(Order)

        # Thêm điều kiện filter theo ngày nếu có
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
                start_dt = datetime.combine(target_date, time(0, 0, 0))
                end_dt = datetime.combine(target_date, time(23, 59, 59))
                
                # Lấy tất cả orders trong ngày, không phân biệt ca
                query = query.filter(
                    Order.time_in >= start_dt,
                    Order.time_in <= end_dt
                )
                
            except Exception as e:
                logger.error(f"Invalid date format: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Lấy tất cả orders - sắp xếp theo thời gian mới nhất
        orders = query.order_by(Order.time_in.desc()).all()
        
        result = []
        current_time = get_vietnam_time()
        
        for order in orders:
            try:
                # Lấy thông tin items và join với menu_items để lấy tên món
                items = db.query(
                    OrderItem,
                    MenuItem.name.label('name')
                ).join(
                    MenuItem,
                    OrderItem.menu_item_id == MenuItem.id
                ).filter(
                    OrderItem.order_id == order.id
                ).all()
                
                # Chuyển đổi kết quả thành dict và thêm trường name
                order_items = []
                for item, name in items:
                    item_dict = {
                        "id": item.id,
                        "order_id": item.order_id,
                        "menu_item_id": item.menu_item_id,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "note": item.note,
                        "name": name
                    }
                    order_items.append(item_dict)
                
                # Xử lý trạng thái order
                status = order.status
                if status is None:
                    status = "pending"
                elif isinstance(status, str):
                    status = status.lower()
                else:
                    # Chuyển đổi từ enum sang string
                    status = str(status).split('.')[-1].lower()
                
                # Xử lý payment_status
                payment_status = order.payment_status
                if payment_status is None:
                    payment_status = "unpaid"
                elif isinstance(payment_status, str):
                    payment_status = payment_status.lower()
                else:
                    payment_status = str(payment_status).lower()
                
                order_dict = {
                    "id": order.id,
                    "table_id": order.table_id,
                    "staff_id": order.staff_id,
                    "shift_id": order.shift_id,
                    "status": status,
                    "total_amount": order.total_amount,
                    "note": order.note,
                    "order_code": order.order_code,
                    "payment_status": payment_status,
                    "time_in": ensure_timezone(order.time_in) if order.time_in else current_time,
                    "time_out": ensure_timezone(order.time_out) if order.time_out else None,
                    "items": order_items if order_items else [{
                        "id": 0,
                        "order_id": order.id,
                        "menu_item_id": 0,
                        "quantity": 0,
                        "unit_price": 0,
                        "total_price": 0,
                        "note": "",
                        "name": "Không có món ăn"
                    }]
                }
                
                result.append(order_dict)
                
            except Exception as e:
                logger.error(f"Error processing order {order.id}: {str(e)}")
                continue
        
        return result

    except Exception as e:
        logger.error(f"Error in get_complete_orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
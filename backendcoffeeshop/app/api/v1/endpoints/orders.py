from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.models import Order, OrderItem, MenuItem, Table, Shift
from app.database.database import get_db
from app.schemas.order import OrderResponse, OrderCreate, OrderItemResponse, OrderUpdate, OrderItemCreate
from datetime import datetime, timezone, timedelta, time
import uuid
from typing import List, Dict, Optional
import logging
import json
import asyncio
import sys
from pydantic import BaseModel
from sqlalchemy import func, cast, Date
import requests
import websockets
import textwrap
from .printer_manager import printer_manager

# Cấu hình logging
logger = logging.getLogger(__name__)

# Thêm handler cho console
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Thêm handler cho file
file_handler = logging.FileHandler('orders.log')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

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

# Constants for bill formatting
TOTAL_BILL_WIDTH = 33
QTY_COL_WIDTH = 4 # e.g., " x3 "
PRICE_COL_WIDTH = 9 # e.g., "120.000" (max 7 digits + 2 for thousands separator/padding)
NAME_COL_WIDTH = TOTAL_BILL_WIDTH - QTY_COL_WIDTH - PRICE_COL_WIDTH # This will be 20

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.logger = logging.getLogger(__name__)

    def connect(self, client_id: str, websocket: WebSocket):
        self.active_connections[client_id] = websocket
        self.logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.logger.info(f"Client {client_id} disconnected")

    async def broadcast(self, message: dict):
        start_time = datetime.now()
        self.logger.info(f"Starting broadcast at {start_time}")
        
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            retry_count = 0
            max_retries = 3
            
            while retry_count < max_retries:
                try:
                    # Thêm timeout 1 giây khi gửi thông báo
                    await asyncio.wait_for(
                        connection.send_json(message),
                        timeout=1.0
                    )
                    self.logger.info(f"Message sent to client {client_id}")
                    break
                except asyncio.TimeoutError:
                    retry_count += 1
                    if retry_count == max_retries:
                        self.logger.error(f"Timeout sending to client {client_id} after {max_retries} retries")
                        disconnected_clients.append(client_id)
                    else:
                        self.logger.warning(f"Timeout sending to client {client_id}, retry {retry_count}/{max_retries}")
                        await asyncio.sleep(0.1)  # Đợi 100ms trước khi retry
                except Exception as e:
                    retry_count += 1
                    if retry_count == max_retries:
                        self.logger.error(f"Error sending to client {client_id} after {max_retries} retries: {str(e)}")
                        disconnected_clients.append(client_id)
                    else:
                        self.logger.warning(f"Error sending to client {client_id}, retry {retry_count}/{max_retries}: {str(e)}")
                        await asyncio.sleep(0.1)  # Đợi 100ms trước khi retry
        
        # Xóa các client đã ngắt kết nối
        for client_id in disconnected_clients:
            self.disconnect(client_id)
            
        end_time = datetime.now()
        self.logger.info(f"Broadcast completed in {(end_time - start_time).total_seconds()} seconds")

manager = ConnectionManager()

@router.websocket("/ws/order")
async def websocket_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())
    try:
        await websocket.accept()
        await printer_manager.connect(client_id, websocket)
        
        await websocket.send_json({
            "type": "connection",
            "data": {
                "status": "connected",
                "client_id": client_id,
                "timestamp": datetime.now().isoformat()
            }
        })
        
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    logger.info(f"Received message from client {client_id}: {message}")
                    
                    if message.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "data": {
                                "timestamp": datetime.now().isoformat()
                            }
                        })
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from client {client_id}: {data}")
                    
            except WebSocketDisconnect:
                logger.info(f"Client {client_id} disconnected")
                break
            except Exception as e:
                logger.error(f"Error receiving message from client {client_id}: {str(e)}")
                break
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
    finally:
        printer_manager.disconnect(client_id)

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"=== BẮT ĐẦU GET ORDERS ===")
        logger.info(f"Params: skip={skip}, limit={limit}, date={date}")

        # Tạo base query - lấy tất cả orders không phân biệt trạng thái
        query = db.query(Order)
        logger.info("Base query created without any status filter")

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
                
                logger.info(f"Added date filter: {start_dt} to {end_dt}")
                
                # Log số lượng orders theo từng trạng thái
                status_counts = db.query(Order.status, func.count(Order.id)).filter(
                    Order.time_in >= start_dt,
                    Order.time_in <= end_dt
                ).group_by(Order.status).all()
                
                logger.info("Orders count by status:")
                for status, count in status_counts:
                    logger.info(f"- Status {status}: {count} orders")
                
            except Exception as e:
                logger.error(f"Invalid date format: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Log SQL query
        logger.info(f"SQL Query: {query.statement.compile(compile_kwargs={'literal_binds': True})}")

        # Lấy tổng số orders trước khi phân trang
        total_orders = query.count()
        logger.info(f"Total orders found before pagination: {total_orders}")

        # Lấy danh sách orders với phân trang - sắp xếp theo thời gian mới nhất
        orders = query.order_by(Order.time_in.desc()).offset(skip).limit(limit).all()
        logger.info(f"Orders after pagination: {len(orders)}")
        
        # Log chi tiết từng order
        for order in orders:
            logger.info(f"Order {order.id}: status={order.status}, payment_status={order.payment_status}, time_in={order.time_in}, shift_id={order.shift_id}")
        
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
                    status = str(status).lower()
                
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
                logger.info(f"Successfully processed order {order.id} with status={status}, payment_status={payment_status}")
                
            except Exception as e:
                logger.error(f"Error processing order {order.id}: {str(e)}")
                continue
        
        logger.info(f"=== KẾT THÚC GET ORDERS - Trả về {len(result)} orders ===")
        return result

    except Exception as e:
        logger.error(f"Error in get_orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db)
):
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Lấy thông tin items và join với menu_items để lấy tên món
        items = db.query(
            OrderItem,
            MenuItem.name.label('name')
        ).join(
            MenuItem,
            OrderItem.menu_item_id == MenuItem.id
        ).filter(
            OrderItem.order_id == order_id
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
        
        # Tạo response
        response = {
            "id": order.id,
            "table_id": order.table_id,
            "staff_id": order.staff_id,
            "shift_id": order.shift_id,
            "status": order.status,
            "total_amount": order.total_amount,
            "note": order.note,
            "order_code": order.order_code,
            "payment_status": order.payment_status,
            "time_in": ensure_timezone(order.time_in) if order.time_in else None,
            "time_out": ensure_timezone(order.time_out) if order.time_out else None,
            "items": order_items
        }
        
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    try:
        start_time = get_vietnam_time()
        logger.info(f"Starting order creation at {start_time}")

        # Tạo order mới với time_in theo múi giờ Việt Nam
        new_order = Order(
            table_id=order.table_id,
            staff_id=order.staff_id,
            shift_id=order.shift_id,
            status="completed",
            total_amount=order.total_amount,
            note=order.note,
            payment_status="paid",
            order_code=str(uuid.uuid4())[:8].upper(),
            time_in=get_vietnam_time(),
            time_out=get_vietnam_time()
        )
        db.add(new_order)
        db.flush()
        logger.info(f"Order created with ID: {new_order.id}")

        # Tạo các order items
        for item in order.items:
            new_item = OrderItem(
                order_id=new_order.id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
                note=item.note
            )
            db.add(new_item)

        # Cập nhật trạng thái bàn thành available
        table = db.query(Table).filter(Table.id == new_order.table_id).first()
        if table:
            table.status = "available"
            db.add(table) # Mark as dirty to ensure update
            logger.info(f"Đã cập nhật trạng thái bàn {table.id} thành available")
        else:
            logger.warning(f"Không tìm thấy bàn với ID {new_order.table_id} để cập nhật trạng thái.")

        db.commit()
        db.refresh(new_order)
        logger.info("Order items created and committed")

        # Lấy thông tin items và join với menu_items để lấy tên món
        items = db.query(
            OrderItem,
            MenuItem.name.label('name')
        ).join(
            MenuItem,
            OrderItem.menu_item_id == MenuItem.id
        ).filter(
            OrderItem.order_id == new_order.id
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

        # Tạo response
        response = {
            "id": new_order.id,
            "table_id": new_order.table_id,
            "staff_id": new_order.staff_id,
            "shift_id": new_order.shift_id,
            "status": new_order.status,
            "total_amount": new_order.total_amount,
            "note": new_order.note,
            "order_code": new_order.order_code,
            "payment_status": new_order.payment_status,
            "time_in": ensure_timezone(new_order.time_in),
            "time_out": ensure_timezone(new_order.time_out) if new_order.time_out else None,
            "items": order_items
        }

        # Gửi thông báo cập nhật order chung (không phải lệnh in tới máy in vật lý)
        logger.info("Broadcasting order update to general connections")
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "created",
                "order": {
                    **response,
                    "time_in": response["time_in"].isoformat() if response["time_in"] else None,
                    "time_out": response["time_out"].isoformat() if response["time_out"] else None
                }
            }
        })
        
        # Lấy thông tin bàn
        table = db.query(Table).filter(Table.id == response['table_id']).first()

        # Gửi bill tới tất cả các máy in đang kết nối qua WebSocket
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table.name if table else f'Bàn {response['table_id']}'}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": f"Thời gian: {response['time_in'].strftime('%H:%M')}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]

        # Header của bảng (33 ký tự tổng cộng)
        # Tên hàng (20) | SL (4) | TIỀN (9) = 33
        header_name_part = "TÊN HÀNG".ljust(NAME_COL_WIDTH)
        header_qty_part = "SL".center(QTY_COL_WIDTH)
        header_total_price_part = "TIỀN".rjust(PRICE_COL_WIDTH)
        bill_lines.append({"text": f"{header_name_part}{header_qty_part}{header_total_price_part}", "fontSize": 12, "bold": True, "align": "left"})
        bill_lines.append({"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        total_amount = 0
        for item in response["items"]:
            item_total = item['total_price']
            total_amount += item_total
            
            # Format quantity and total price
            qty_str = f"x{item['quantity']}" # "x3"
            total_price_str = f"{int(item_total):,}" # e.g., "120,000"

            # Pad quantity and total price to fixed widths
            item_qty_part = qty_str.center(QTY_COL_WIDTH)
            item_total_price_part = total_price_str.rjust(PRICE_COL_WIDTH)

            # Wrap the item name, first line will take full width
            wrapped_name_lines = textwrap.wrap(item['name'], width=NAME_COL_WIDTH)

            # Add the first line with name, quantity, total price
            if wrapped_name_lines:
                first_name_part = wrapped_name_lines[0].ljust(NAME_COL_WIDTH)
                item_line_text = f"{first_name_part}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })

                # Add subsequent lines for wrapped name parts (indented)
                for i in range(1, len(wrapped_name_lines)):
                    bill_lines.append({
                        "text": "  " + wrapped_name_lines[i].ljust(NAME_COL_WIDTH - 2), # Indent wrapped lines by 2 spaces
                        "fontSize": 12, "bold": False, "align": "left"
                    })
            else:
                # Handle empty name (should not happen with menu items)
                item_line_text = f"{''.ljust(NAME_COL_WIDTH)}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })
            
            if item.get("note"):
                # Ghi chú thụt lề
                bill_lines.append({"text": f"  Ghi chú: {item['note']}", "fontSize": 12, "bold": False, "align": "left"})

        # Thêm tổng tiền (33 ký tự tổng cộng)
        total_amount_str = f"{int(total_amount):,}" # e.g., "120,000"
        
        # Định dạng dòng tổng tiền
        total_label_width = NAME_COL_WIDTH + QTY_COL_WIDTH
        total_label_part = "TỔNG TIỀN:".ljust(total_label_width)
        total_amount_part = total_amount_str.rjust(PRICE_COL_WIDTH)
        
        bill_lines.extend([
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
            {"text": f"{total_label_part}{total_amount_part}", "fontSize": 14, "bold": True, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ])

        # Gửi tới tất cả các máy in đang kết nối qua WebSocket
        logger.info("Gửi dữ liệu in qua WebSocket")
        logger.info(f"Số lượng kết nối đang hoạt động: {len(printer_manager.active_printers)}")
        logger.info(f"Dữ liệu in: {bill_lines}")
        
        success = False
        for printer_id in printer_manager.active_printers.keys():
            try:
                result = await printer_manager.send_to_printer(printer_id, {
                    "type": "print",
                    "data": bill_lines,
                    "timestamp": datetime.now().isoformat()  # Chuyển datetime thành string
                })
                if result:
                    success = True
                    logger.info(f"Đã gửi dữ liệu tới printer {printer_id}")
            except Exception as e:
                logger.error(f"Lỗi khi gửi dữ liệu tới printer {printer_id}: {str(e)}")
        
        if not success:
            logger.error("Không thể gửi dữ liệu tới bất kỳ máy in nào")

        end_time = get_vietnam_time()
        logger.info(f"Order creation completed in {(end_time - start_time).total_seconds()} seconds")

        return response

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{order_id}/pay", response_model=OrderResponse)
async def pay_order(order_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"=== BẮT ĐẦU THANH TOÁN ORDER {order_id} ===")
        
        # Lấy order từ database
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            logger.error(f"Order {order_id} không tồn tại")
            raise HTTPException(status_code=404, detail="Order not found")
            
        # Cập nhật trạng thái order
        order.status = "completed"
        order.payment_status = "paid"
        order.time_out = get_vietnam_time()
        
        try:
            db.commit()
            logger.info(f"Đã cập nhật trạng thái order {order_id} thành công")
            
            # Broadcast thông báo cập nhật order
            await manager.broadcast({
                "type": "order_status_update",
                "data": {
                    "order_id": order_id,
                    "status": "completed",
                    "payment_status": "paid",
                    "timestamp": datetime.now().isoformat()
                }
            })
            
            return order
            
        except Exception as e:
            db.rollback()
            logger.error(f"Lỗi khi cập nhật order {order_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
            
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        logger.info(f"=== KẾT THÚC THANH TOÁN ORDER {order_id} ===")

class OrderUpdate(BaseModel):
    table_id: Optional[int] = None
    staff_id: Optional[int] = None
    shift_id: Optional[int] = None
    status: Optional[str] = None
    total_amount: Optional[float] = None
    note: Optional[str] = None
    order_code: Optional[str] = None
    payment_status: Optional[str] = None
    time_in: Optional[datetime] = None
    time_out: Optional[datetime] = None
    items: Optional[List[OrderItemCreate]] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    logger.info(f"\n{'='*50}")
    logger.info(f"BẮT ĐẦU CẬP NHẬT ORDER {order_id}")
    logger.info(f"{'='*50}")
    
    try:
        # Log thông tin order được gửi lên
        logger.info(f"Payload nhận được: {order.dict()}")
        
        # Lấy order hiện tại
        current_order = db.query(Order).filter(Order.id == order_id).first()
        if not current_order:
            logger.error(f"Order {order_id} not found")
            raise HTTPException(status_code=404, detail="Order not found")

        # Log thông tin order hiện tại
        logger.info(f"\nThông tin order hiện tại:")
        logger.info(f"- ID: {current_order.id}")
        logger.info(f"- Table ID: {current_order.table_id}")
        logger.info(f"- Staff ID: {current_order.staff_id}")
        logger.info(f"- Shift ID: {current_order.shift_id}")
        logger.info(f"- Status: {current_order.status}")
        logger.info(f"- Time In: {current_order.time_in}")
        logger.info(f"- Payment Status: {current_order.payment_status}")

        # Lưu lại time_in cũ và shift_id cũ
        old_time_in = ensure_timezone(current_order.time_in)
        old_shift_id = current_order.shift_id
        logger.info(f"\nLưu lại time_in cũ: {old_time_in}")
        logger.info(f"Lưu lại shift_id cũ: {old_shift_id}")

        # Cập nhật các trường cơ bản
        update_data = order.dict(exclude_unset=True)
        if 'time_in' in update_data:
            del update_data['time_in']
        if 'shift_id' in update_data:
            del update_data['shift_id']
        if 'items' in update_data:
            del update_data['items']

        for key, value in update_data.items():
            setattr(current_order, key, value)

        # Giữ nguyên time_in và shift_id cũ
        current_order.time_in = old_time_in
        current_order.shift_id = old_shift_id

        # Lấy danh sách món cũ từ database trước khi xóa
        old_items_db = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        # Gom nhóm theo (menu_item_id, note) và cộng dồn quantity
        old_items_map = {}
        for item in old_items_db:
            key = (item.menu_item_id, item.note or "")
            old_items_map[key] = old_items_map.get(key, 0) + item.quantity

        # Xử lý items nếu có
        if order.items:
            # Xóa tất cả items cũ
            db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
            # Tạo items mới
            for item in order.items:
                new_item = OrderItem(
                    order_id=order_id,
                    menu_item_id=item.menu_item_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price,
                    note=item.note
                )
                db.add(new_item)
                logger.info(f"Thêm item mới: menu_item_id={item.menu_item_id}, quantity={item.quantity}")

        # Commit thay đổi
        db.commit()
        db.refresh(current_order)
        logger.info("\nĐã commit thay đổi")

        # Lấy thông tin items mới với tên
        items = db.query(
            OrderItem,
            MenuItem.name.label('name')
        ).join(
            MenuItem,
            OrderItem.menu_item_id == MenuItem.id
        ).filter(
            OrderItem.order_id == current_order.id
        ).all()

        # Gom nhóm món mới theo (menu_item_id, note)
        new_items_map = {}
        name_map = {}
        for item, name in items:
            key = (item.menu_item_id, item.note or "")
            new_items_map[key] = new_items_map.get(key, 0) + item.quantity
            name_map[key] = name

        # Tạo danh sách items cho response
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

        # Tạo response
        response_dict = {
            "id": current_order.id,
            "table_id": current_order.table_id,
            "staff_id": current_order.staff_id,
            "shift_id": current_order.shift_id,
            "status": current_order.status,
            "total_amount": current_order.total_amount,
            "note": current_order.note,
            "order_code": current_order.order_code,
            "payment_status": current_order.payment_status,
            "time_in": ensure_timezone(current_order.time_in),
            "time_out": ensure_timezone(current_order.time_out) if current_order.time_out else None,
            "items": order_items
        }

        # Gửi thông báo cập nhật order chung (không phải lệnh in tới máy in vật lý)
        logger.info("Broadcasting order update to general connections")
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "updated",
                "order": response_dict
            }
        })
        
        # Lấy thông tin bàn
        table = db.query(Table).filter(Table.id == response_dict['table_id']).first()

        # Gửi bill tới tất cả các máy in đang kết nối qua WebSocket
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table.name if table else f'Bàn {response_dict['table_id']}'}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": f"Thời gian: {response_dict['time_in'].strftime('%H:%M')}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]

        # Header của bảng (33 ký tự tổng cộng)
        # Tên hàng (20) | SL (4) | TIỀN (9) = 33
        header_name_part = "TÊN HÀNG".ljust(NAME_COL_WIDTH)
        header_qty_part = "SL".center(QTY_COL_WIDTH)
        header_total_price_part = "TIỀN".rjust(PRICE_COL_WIDTH)
        bill_lines.append({"text": f"{header_name_part}{header_qty_part}{header_total_price_part}", "fontSize": 12, "bold": True, "align": "left"})
        bill_lines.append({"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        total_amount = 0
        for item in response_dict["items"]:
            item_total = item['total_price']
            total_amount += item_total
            
            # Format quantity and total price
            qty_str = f"x{item['quantity']}" # "x3"
            total_price_str = f"{int(item_total):,}" # e.g., "120,000"

            # Pad quantity and total price to fixed widths
            item_qty_part = qty_str.center(QTY_COL_WIDTH)
            item_total_price_part = total_price_str.rjust(PRICE_COL_WIDTH)

            # Wrap the item name, first line will take full width
            wrapped_name_lines = textwrap.wrap(item['name'], width=NAME_COL_WIDTH)

            # Add the first line with name, quantity, total price
            if wrapped_name_lines:
                first_name_part = wrapped_name_lines[0].ljust(NAME_COL_WIDTH)
                item_line_text = f"{first_name_part}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })

                # Add subsequent lines for wrapped name parts (indented)
                for i in range(1, len(wrapped_name_lines)):
                    bill_lines.append({
                        "text": "  " + wrapped_name_lines[i].ljust(NAME_COL_WIDTH - 2), # Indent wrapped lines by 2 spaces
                        "fontSize": 12, "bold": False, "align": "left"
                    })
            else:
                # Handle empty name (should not happen with menu items)
                item_line_text = f"{''.ljust(NAME_COL_WIDTH)}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })
            
            if item.get("note"):
                # Ghi chú thụt lề
                bill_lines.append({"text": f"  Ghi chú: {item['note']}", "fontSize": 12, "bold": False, "align": "left"})

        # Thêm tổng tiền (33 ký tự tổng cộng)
        total_amount_str = f"{int(total_amount):,}" # e.g., "120,000"
        
        # Định dạng dòng tổng tiền
        total_label_width = NAME_COL_WIDTH + QTY_COL_WIDTH
        total_label_part = "TỔNG TIỀN:".ljust(total_label_width)
        total_amount_part = total_amount_str.rjust(PRICE_COL_WIDTH)
        
        bill_lines.extend([
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
            {"text": f"{total_label_part}{total_amount_part}", "fontSize": 14, "bold": True, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ])

        # Gửi tới tất cả các máy in đang kết nối qua WebSocket
        logger.info("Gửi dữ liệu in qua WebSocket")
        logger.info(f"Số lượng kết nối đang hoạt động: {len(printer_manager.active_printers)}")
        logger.info(f"Dữ liệu in: {bill_lines}")
        
        success = False
        for printer_id in printer_manager.active_printers.keys():
            try:
                result = await printer_manager.send_to_printer(printer_id, {
                    "type": "print",
                    "data": bill_lines,
                    "timestamp": datetime.now().isoformat()  # Chuyển datetime thành string
                })
                if result:
                    success = True
                    logger.info(f"Đã gửi dữ liệu tới printer {printer_id}")
            except Exception as e:
                logger.error(f"Lỗi khi gửi dữ liệu tới printer {printer_id}: {str(e)}")
        
        if not success:
            logger.error("Không thể gửi dữ liệu tới bất kỳ máy in nào")

        return response_dict

    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi cập nhật order {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        logger.info(f"=== KẾT THÚC CẬP NHẬT ORDER {order_id} ===")

class TableTransferRequest(BaseModel):
    new_table_id: int
    note: Optional[str] = None

@router.post("/{order_id}/transfer-table", response_model=OrderResponse)
async def transfer_table(
    order_id: int,
    transfer_data: TableTransferRequest,
    db: Session = Depends(get_db)
):
    logger.info(f"\n{'='*50}")
    logger.info(f"BẮT ĐẦU CHUYỂN BÀN CHO ORDER {order_id}")
    logger.info(f"{'='*50}")
    
    try:
        # Lấy order hiện tại
        current_order = db.query(Order).filter(Order.id == order_id).first()
        if not current_order:
            logger.error(f"Order {order_id} not found")
            raise HTTPException(status_code=404, detail="Order not found")

        # Kiểm tra bàn mới
        new_table = db.query(Table).filter(Table.id == transfer_data.new_table_id).first()
        if not new_table:
            logger.error(f"Bàn mới {transfer_data.new_table_id} không tồn tại")
            raise HTTPException(status_code=404, detail="Bàn mới không tồn tại")
        # BỎ kiểm tra trạng thái bàn, luôn cho phép chuyển
        # if new_table.status != "available":
        #     logger.error(f"Bàn mới {transfer_data.new_table_id} đang được sử dụng")
        #     raise HTTPException(status_code=400, detail="Bàn mới đang được sử dụng")

        # Lấy bàn cũ
        old_table = db.query(Table).filter(Table.id == current_order.table_id).first()
        
        # Cập nhật trạng thái bàn cũ
        if old_table:
            old_table.status = "available"
            logger.info(f"Đã cập nhật trạng thái bàn cũ {old_table.id} thành available")

        # Cập nhật trạng thái bàn mới
        new_table.status = "occupied"
        logger.info(f"Đã cập nhật trạng thái bàn mới {new_table.id} thành occupied")

        # Cập nhật order
        current_order.table_id = transfer_data.new_table_id
        if transfer_data.note:
            current_order.note = f"{current_order.note}\nChuyển bàn: {transfer_data.note}" if current_order.note else f"Chuyển bàn: {transfer_data.note}"
        
        logger.info(f"Đã cập nhật order {order_id} với bàn mới {transfer_data.new_table_id}")

        # Commit thay đổi
        db.commit()
        db.refresh(current_order)
        logger.info("Đã commit thay đổi")

        # Lấy thông tin items mới với tên
        items = db.query(
            OrderItem,
            MenuItem.name.label('name')
        ).join(
            MenuItem,
            OrderItem.menu_item_id == MenuItem.id
        ).filter(
            OrderItem.order_id == current_order.id
        ).all()

        # Tạo danh sách items cho response
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

        # Tạo response
        response_dict = {
            "id": current_order.id,
            "table_id": current_order.table_id,
            "staff_id": current_order.staff_id,
            "shift_id": current_order.shift_id,
            "status": current_order.status,
            "total_amount": current_order.total_amount,
            "note": current_order.note,
            "order_code": current_order.order_code,
            "payment_status": current_order.payment_status,
            "time_in": ensure_timezone(current_order.time_in),
            "time_out": ensure_timezone(current_order.time_out) if current_order.time_out else None,
            "items": order_items
        }

        # Gửi thông báo cập nhật order chung (không phải lệnh in tới máy in vật lý)
        logger.info("Broadcasting order update to general connections")
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "transferred",
                "order": response_dict
            }
        })
        
        # Lấy thông tin bàn
        table = db.query(Table).filter(Table.id == response_dict['table_id']).first()

        # Gửi bill tới tất cả các máy in đang kết nối qua WebSocket
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table.name if table else f'Bàn {response_dict['table_id']}'}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": f"Thời gian: {response_dict['time_in'].strftime('%H:%M')}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]

        # Header của bảng (33 ký tự tổng cộng)
        # Tên hàng (20) | SL (4) | TIỀN (9) = 33
        header_name_part = "TÊN HÀNG".ljust(NAME_COL_WIDTH)
        header_qty_part = "SL".center(QTY_COL_WIDTH)
        header_total_price_part = "TIỀN".rjust(PRICE_COL_WIDTH)
        bill_lines.append({"text": f"{header_name_part}{header_qty_part}{header_total_price_part}", "fontSize": 12, "bold": True, "align": "left"})
        bill_lines.append({"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        total_amount = 0
        for item in response_dict["items"]:
            item_total = item['total_price']
            total_amount += item_total
            
            # Format quantity and total price
            qty_str = f"x{item['quantity']}" # "x3"
            total_price_str = f"{int(item_total):,}" # e.g., "120,000"

            # Pad quantity and total price to fixed widths
            item_qty_part = qty_str.center(QTY_COL_WIDTH)
            item_total_price_part = total_price_str.rjust(PRICE_COL_WIDTH)

            # Wrap the item name, first line will take full width
            wrapped_name_lines = textwrap.wrap(item['name'], width=NAME_COL_WIDTH)

            # Add the first line with name, quantity, total price
            if wrapped_name_lines:
                first_name_part = wrapped_name_lines[0].ljust(NAME_COL_WIDTH)
                item_line_text = f"{first_name_part}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })

                # Add subsequent lines for wrapped name parts (indented)
                for i in range(1, len(wrapped_name_lines)):
                    bill_lines.append({
                        "text": "  " + wrapped_name_lines[i].ljust(NAME_COL_WIDTH - 2), # Indent wrapped lines by 2 spaces
                        "fontSize": 12, "bold": False, "align": "left"
                    })
            else:
                # Handle empty name (should not happen with menu items)
                item_line_text = f"{''.ljust(NAME_COL_WIDTH)}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })
            
            if item.get("note"):
                # Ghi chú thụt lề
                bill_lines.append({"text": f"  Ghi chú: {item['note']}", "fontSize": 12, "bold": False, "align": "left"})

        # Thêm tổng tiền (33 ký tự tổng cộng)
        total_amount_str = f"{int(total_amount):,}" # e.g., "120,000"
        
        # Định dạng dòng tổng tiền
        total_label_width = NAME_COL_WIDTH + QTY_COL_WIDTH
        total_label_part = "TỔNG TIỀN:".ljust(total_label_width)
        total_amount_part = total_amount_str.rjust(PRICE_COL_WIDTH)
        
        bill_lines.extend([
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
            {"text": f"{total_label_part}{total_amount_part}", "fontSize": 14, "bold": True, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ])

        # Gửi tới tất cả các máy in đang kết nối qua WebSocket
        logger.info("Gửi dữ liệu in qua WebSocket")
        logger.info(f"Số lượng kết nối đang hoạt động: {len(printer_manager.active_printers)}")
        logger.info(f"Dữ liệu in: {bill_lines}")
        
        success = False
        for printer_id in printer_manager.active_printers.keys():
            try:
                result = await printer_manager.send_to_printer(printer_id, {
                    "type": "print",
                    "data": bill_lines,
                    "timestamp": datetime.now().isoformat()  # Chuyển datetime thành string
                })
                if result:
                    success = True
                    logger.info(f"Đã gửi dữ liệu tới printer {printer_id}")
            except Exception as e:
                logger.error(f"Lỗi khi gửi dữ liệu tới printer {printer_id}: {str(e)}")
        
        if not success:
            logger.error("Không thể gửi dữ liệu tới bất kỳ máy in nào")

        logger.info(f"{'='*50}")
        logger.info("KẾT THÚC CHUYỂN BÀN")
        logger.info(f"{'='*50}\n")
        
        return OrderResponse(**response_dict)

    except Exception as e:
        db.rollback()
        logger.error(f"\nLỗi chuyển bàn: {str(e)}")
        logger.info(f"{'='*50}")
        logger.info("KẾT THÚC CHUYỂN BÀN VỚI LỖI")
        logger.info(f"{'='*50}\n")
        raise HTTPException(status_code=500, detail=str(e))

class MergeOrdersRequest(BaseModel):
    order_ids: List[int]

@router.post("/merge")
async def merge_orders(request: MergeOrdersRequest, db: Session = Depends(get_db)):
    order_ids = request.order_ids
    if not order_ids or len(order_ids) < 2:
        raise HTTPException(status_code=400, detail="Cần chọn ít nhất 2 order để gộp")
    # Lấy tất cả order
    orders = db.query(Order).filter(Order.id.in_(order_ids)).all()
    if len(orders) < 2:
        raise HTTPException(status_code=400, detail="Không đủ order để gộp")
    table_id = orders[0].table_id
    # Gộp các món giống nhau
    merged_items = {}
    for order in orders:
        for item in db.query(OrderItem).filter(OrderItem.order_id == order.id):
            key = (item.menu_item_id, item.unit_price)
            if key not in merged_items:
                merged_items[key] = {
                    "menu_item_id": item.menu_item_id,
                    "quantity": 0,
                    "unit_price": item.unit_price,
                    "total_price": 0,
                    "note": item.note or ""
                }
            merged_items[key]["quantity"] += item.quantity
            merged_items[key]["total_price"] += item.total_price
    # Tạo order mới
    new_order = Order(
        table_id=table_id,
        staff_id=orders[0].staff_id,
        shift_id=orders[0].shift_id,
        status="completed",
        total_amount=sum(i["total_price"] for i in merged_items.values()),
        note="Gộp từ các order: " + ", ".join(str(o.id) for o in orders),
        payment_status="paid",
        order_code=str(uuid.uuid4())[:8].upper(),
        time_in=get_vietnam_time(),
        time_out=get_vietnam_time()
    )
    db.add(new_order)
    db.flush()
    # Thêm các item
    for item in merged_items.values():
        db.add(OrderItem(
            order_id=new_order.id,
            menu_item_id=item["menu_item_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            total_price=item["total_price"],
            note=item["note"]
        ))
    # Xóa các order cũ và item cũ
    for order in orders:
        db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
        db.delete(order)

    # Cập nhật trạng thái của bàn liên quan đến order mới thành 'available'
    table = db.query(Table).filter(Table.id == new_order.table_id).first()
    if table:
        table.status = "available"
        db.add(table) # Mark as dirty to ensure update
        logger.info(f"Đã cập nhật trạng thái bàn {table.id} thành available sau khi gộp order.")
    else:
        logger.warning(f"Không tìm thấy bàn với ID {new_order.table_id} để cập nhật trạng thái sau khi gộp order.")

    db.commit()
    return {"success": True, "order_id": new_order.id}

class OrderRecentResponse(BaseModel):
    id: int
    order_code: str
    time_in: str
    table_name: str
    total_amount: Optional[float]
    status: str

@router.get("/recent", response_model=List[OrderRecentResponse])
def get_recent_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.time_in.desc()).limit(10).all()
    result = []
    for order in orders:
        table = db.query(Table).filter(Table.id == order.table_id).first()
        result.append({
            "id": order.id,
            "order_code": order.order_code or "",
            "time_in": order.time_in.isoformat() if order.time_in else "",
            "table_name": table.name if table else f"Bàn {order.table_id}",
            "total_amount": float(order.total_amount) if order.total_amount is not None else 0.0,
            "status": str(order.status) if order.status is not None else ""
        })
    return result

@router.post("/print-order")
async def print_order(order_id: int, db: Session = Depends(get_db)):
    try:
        # Lấy thông tin order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"error": "Không tìm thấy order"}

        # Lấy thông tin bàn
        table = db.query(Table).filter(Table.id == order.table_id).first()
        if not table:
            return {"error": "Không tìm thấy thông tin bàn"}

        # Lấy thông tin ca
        shift = db.query(Shift).filter(Shift.id == order.shift_id).first()
        if not shift:
            return {"error": "Không tìm thấy thông tin ca"}

        # Lấy danh sách items
        items = db.query(OrderItem, MenuItem).join(
            MenuItem, OrderItem.menu_item_id == MenuItem.id
        ).filter(OrderItem.order_id == order_id).all()

        # Format bill
        bill_lines = [
            {"text": "HÓA ĐƠN", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table.name}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": f"Ca: {shift.shift_type}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": f"Thời gian: {order.time_in.strftime('%d/%m/%Y %H:%M')}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "---------------------------------", "fontSize": 12, "bold": False, "align": "left"},
        ]

        # Header của bảng (33 ký tự tổng cộng)
        # Tên món (20) | SL (4) | TIỀN (9) = 33
        header_name_part = "TÊN MÓN".ljust(NAME_COL_WIDTH)
        header_qty_part = "SL".center(QTY_COL_WIDTH)
        header_total_price_part = "TIỀN".rjust(PRICE_COL_WIDTH)
        bill_lines.append({"text": f"{header_name_part}{header_qty_part}{header_total_price_part}", "fontSize": 12, "bold": True, "align": "left"})
        bill_lines.append({"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        for item, menu_item in items:
            item_total = item.total_price
            
            # Format quantity and total price
            qty_str = f"x{item.quantity}" # "x3"
            total_price_str = f"{int(item_total):,}" # e.g., "120,000"

            # Pad quantity and total price to fixed widths
            item_qty_part = qty_str.center(QTY_COL_WIDTH)
            item_total_price_part = total_price_str.rjust(PRICE_COL_WIDTH)

            # Wrap the item name, first line will take full width
            wrapped_name_lines = textwrap.wrap(menu_item.name, width=NAME_COL_WIDTH)

            # Add the first line with name, quantity, total price
            if wrapped_name_lines:
                first_name_part = wrapped_name_lines[0].ljust(NAME_COL_WIDTH)
                item_line_text = f"{first_name_part}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })

                # Add subsequent lines for wrapped name parts (indented)
                for i in range(1, len(wrapped_name_lines)):
                    bill_lines.append({
                        "text": "  " + wrapped_name_lines[i].ljust(NAME_COL_WIDTH - 2), # Indent wrapped lines by 2 spaces
                        "fontSize": 12, "bold": False, "align": "left"
                    })
            else:
                # Handle empty name (should not happen with menu items)
                item_line_text = f"{''.ljust(NAME_COL_WIDTH)}{item_qty_part}{item_total_price_part}"
                bill_lines.append({
                    "text": item_line_text,
                    "fontSize": 12, "bold": False, "align": "left"
                })
            
            if item.note:
                # Ghi chú thụt lề
                bill_lines.append({"text": f"  Ghi chú: {item.note}", "fontSize": 12, "bold": False, "align": "left"})
        
        # Thêm tổng tiền (33 ký tự tổng cộng)
        total_amount_str = f"{int(order.total_amount):,}" # e.g., "120,000"
        
        # Định dạng dòng tổng tiền
        total_label_width = NAME_COL_WIDTH + QTY_COL_WIDTH
        total_label_part = "Tổng tiền:".ljust(total_label_width)
        total_amount_part = total_amount_str.rjust(PRICE_COL_WIDTH)
        
        bill_lines.extend([
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
            {"text": f"{total_label_part}{total_amount_part}", "fontSize": 14, "bold": True, "align": "left"},
            {"text": "---------------------------------", "fontSize": 16, "bold": False, "align": "left"},
            {"text": "Cảm ơn quý khách!", "fontSize": 12, "bold": False, "align": "center"},
        ])

        # Gửi tới tất cả các máy in đang kết nối qua WebSocket
        await printer_manager.broadcast({
            "type": "print",
            "data": bill_lines
        })

        return {"success": True, "message": "Đã gửi hóa đơn tới máy in"}

    except Exception as e:
        logger.error(f"Lỗi khi in hóa đơn: {str(e)}")
        return {"error": f"Lỗi khi in hóa đơn: {str(e)}"} 
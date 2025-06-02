from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.models import Order, OrderItem, MenuItem, Table, Shift
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
        await manager.connect(client_id, websocket)
        
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
        manager.disconnect(client_id)

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Fetching orders with skip={skip}, limit={limit}, date={date}")
        
        query = db.query(
            Order.id,
            Order.table_id,
            Order.staff_id,
            Order.shift_id,
            Order.status,
            Order.total_amount,
            Order.note,
            Order.order_code,
            Order.payment_status,
            Order.time_in,
            Order.time_out
        )

        # Thêm điều kiện filter theo ngày nếu có
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
                logger.info(f"Filtering orders for date: {date}")
                
                # Debug: Kiểm tra dữ liệu trong bảng shifts
                shifts = db.query(Shift).all()
                logger.info("All shifts in database:")
                for shift in shifts:
                    logger.info(f"Shift ID: {shift.id}, Open Time: {shift.open_time}")
                
                # Debug: Kiểm tra dữ liệu trong bảng orders
                orders = db.query(Order).all()
                logger.info("All orders in database:")
                for order in orders:
                    logger.info(f"Order ID: {order.id}, Shift ID: {order.shift_id}, Time In: {order.time_in}")
                
                # Thử filter theo ngày mở của shift
                query = db.query(
                    Order.id,
                    Order.table_id,
                    Order.staff_id,
                    Order.shift_id,
                    Order.status,
                    Order.total_amount,
                    Order.note,
                    Order.order_code,
                    Order.payment_status,
                    Order.time_in,
                    Order.time_out
                ).join(
                    Shift,
                    Order.shift_id == Shift.id
                ).filter(
                    func.date(Shift.open_time) == target_date
                )
                
                # Log SQL query
                logger.info(f"SQL Query: {query.statement.compile(compile_kwargs={'literal_binds': True})}")
                
                # Log kết quả
                results = query.all()
                logger.info(f"Found {len(results)} orders for date {date}")
                for result in results:
                    logger.info(f"Order ID: {result.id}, Shift ID: {result.shift_id}, Time In: {result.time_in}")
                
            except Exception as e:
                logger.error(f"Error parsing date {date}: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        orders = query.offset(skip).limit(limit).all()
        logger.info(f"Found {len(orders)} orders")
        
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
                
                order_dict = {
                    "id": order.id,
                    "table_id": order.table_id,
                    "staff_id": order.staff_id,
                    "shift_id": order.shift_id,
                    "status": order.status,
                    "total_amount": order.total_amount,
                    "note": order.note,
                    "order_code": order.order_code,
                    "payment_status": order.payment_status,
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
                
                logger.info(f"Processed order {order.id}")
                result.append(order_dict)
                
            except Exception as e:
                logger.error(f"Error processing order {order.id}: {str(e)}")
                continue
        
        logger.info(f"Successfully processed {len(result)} orders")
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
            status=order.status,
            total_amount=order.total_amount,
            note=order.note,
            payment_status=order.payment_status,
            order_code=str(uuid.uuid4())[:8].upper(),
            time_in=get_vietnam_time()
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

        # Gửi thông báo ngay lập tức với đầy đủ thông tin order mới
        logger.info("Broadcasting order update")
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "created",
                "order": response
            }
        })

        # Gửi bill tới POSPrinter
        printer_ips = ["192.168.99.12",]
        table = db.query(Table).filter(Table.id == response['table_id']).first()
        table_name = table.name if table else f"Bàn {response['table_id']}"
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table_name}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]
        for item in response["items"]:
            line = {"text": f"{item['name']} x{item['quantity']}", "fontSize": 14, "bold": True, "align": "left"}
            bill_lines.append(line)
            if item.get("note"):
                bill_lines.append({"text": f"Ghi chú: {item['note']}", "fontSize": 14, "bold": False, "align": "left"})
        bill_lines.append({"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        async def send_to_printer():
            for ip in printer_ips:
                retry_count = 0
                max_retries = 3
                while retry_count < max_retries:
                    try:
                        response = await asyncio.get_event_loop().run_in_executor(
                            None,
                            lambda: requests.post(
                                f"http://{ip}:8080/print/",
                                data=json.dumps(bill_lines).encode("utf-8"),
                                headers={"Content-Type": "application/json; charset=utf-8"},
                                timeout=5
                            )
                        )
                        if response.status_code == 200:
                            logger.info(f"Đã gửi bill tới POSPrinter {ip}")
                            break
                        else:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip}: HTTP {response.status_code}")
                            retry_count += 1
                    except Exception as e:
                        retry_count += 1
                        if retry_count == max_retries:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip} sau {max_retries} lần thử: {str(e)}")
                        else:
                            logger.warning(f"Lỗi gửi bill tới POSPrinter {ip}, thử lại lần {retry_count}/{max_retries}: {str(e)}")
                            await asyncio.sleep(1)
        asyncio.create_task(send_to_printer())

        end_time = get_vietnam_time()
        logger.info(f"Order creation completed in {(end_time - start_time).total_seconds()} seconds")

        return response

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{order_id}/pay")
def pay_order(order_id: int, db: Session = Depends(get_db)):
    logger.info(f"[PAYMENT] Nhận yêu cầu thanh toán cho order_id={order_id}")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        logger.error(f"[PAYMENT] Không tìm thấy order_id={order_id}")
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Cập nhật trạng thái order, time_out và payment_status
    order.status = "completed"
    order.time_out = get_vietnam_time()
    order.payment_status = "paid"
    db.commit()
    logger.info(f"[PAYMENT] Đã cập nhật trạng thái order_id={order_id} thành completed, payment_status=paid và time_out={order.time_out}")
    
    # Cập nhật trạng thái bàn
    table = db.query(Table).filter(Table.id == order.table_id).first()
    if table:
        table.status = "available"
        db.commit()
        logger.info(f"[PAYMENT] Đã cập nhật trạng thái bàn id={table.id} thành available")
    else:
        logger.error(f"[PAYMENT] Không tìm thấy bàn cho order_id={order_id}")
    
    return {
        "message": "Thanh toán thành công!", 
        "order_id": order_id, 
        "order_status": order.status,
        "payment_status": order.payment_status,
        "time_out": ensure_timezone(order.time_out),
        "table_status": table.status if table else None
    }

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

        # Gửi thông báo cập nhật
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "updated",
                "order": response_dict
            }
        })

        # Gửi bill tới POSPrinter
        printer_ips = ["192.168.99.12",]
        table = db.query(Table).filter(Table.id == current_order.table_id).first()
        table_name = table.name if table else f"Bàn {current_order.table_id}"
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table_name}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]
        # So sánh món mới với món cũ, chỉ in phần tăng thêm
        for key, new_qty in new_items_map.items():
            old_qty = old_items_map.get(key, 0)
            if new_qty > old_qty:
                name = name_map[key]
                note = key[1]
                qty_text = f"x{new_qty - old_qty}"
                # Cắt tên món theo từ, không cắt giữa các từ
                max_len = 28
                name_lines = textwrap.wrap(name, width=max_len)
                if name_lines:
                    bill_lines.append({"text": f"{name_lines[0]} {qty_text}", "fontSize": 14, "bold": True, "align": "left"})
                    for subline in name_lines[1:]:
                        bill_lines.append({"text": subline, "fontSize": 14, "bold": True, "align": "left"})
                else:
                    bill_lines.append({"text": f"{name} {qty_text}", "fontSize": 14, "bold": True, "align": "left"})
                if note:
                    bill_lines.append({"text": f"Ghi chú: {note}", "fontSize": 14, "bold": False, "align": "left"})
        bill_lines.append({"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        async def send_to_printer():
            for ip in printer_ips:
                retry_count = 0
                max_retries = 3
                while retry_count < max_retries:
                    try:
                        response = await asyncio.get_event_loop().run_in_executor(
                            None,
                            lambda: requests.post(
                                f"http://{ip}:8080/print/",
                                data=json.dumps(bill_lines).encode("utf-8"),
                                headers={"Content-Type": "application/json; charset=utf-8"},
                                timeout=5
                            )
                        )
                        if response.status_code == 200:
                            logger.info(f"Đã gửi bill tới POSPrinter {ip}")
                            break
                        else:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip}: HTTP {response.status_code}")
                            retry_count += 1
                    except Exception as e:
                        retry_count += 1
                        if retry_count == max_retries:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip} sau {max_retries} lần thử: {str(e)}")
                        else:
                            logger.warning(f"Lỗi gửi bill tới POSPrinter {ip}, thử lại lần {retry_count}/{max_retries}: {str(e)}")
                            await asyncio.sleep(1)
        asyncio.create_task(send_to_printer())

        logger.info(f"{'='*50}")
        logger.info("KẾT THÚC CẬP NHẬT ORDER")
        logger.info(f"{'='*50}\n")
        
        return OrderResponse(**response_dict)

    except Exception as e:
        db.rollback()
        logger.error(f"\nLỗi cập nhật order: {str(e)}")
        logger.info(f"{'='*50}")
        logger.info("KẾT THÚC CẬP NHẬT ORDER VỚI LỖI")
        logger.info(f"{'='*50}\n")
        raise HTTPException(status_code=500, detail=str(e))

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

        # Gửi thông báo cập nhật
        await manager.broadcast({
            "type": "order_update",
            "data": {
                "type": "transferred",
                "order": response_dict
            }
        })

        # Gửi bill tới POSPrinter
        printer_ips = ["192.168.99.12",]
        table = db.query(Table).filter(Table.id == current_order.table_id).first()
        table_name = table.name if table else f"Bàn {current_order.table_id}"
        bill_lines = [
            {"text": "PHIẾU LÀM ĐỒ", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
            {"text": f"Bàn: {table_name}", "fontSize": 10, "bold": False, "align": "left"},
            {"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        ]
        for item in order_items:
            line = {"text": f"{item['name']} x{item['quantity']}", "fontSize": 14, "bold": True, "align": "left"}
            bill_lines.append(line)
            if item.get("note"):
                bill_lines.append({"text": f"Ghi chú: {item['note']}", "fontSize": 14, "bold": False, "align": "left"})
        bill_lines.append({"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"})

        async def send_to_printer():
            for ip in printer_ips:
                retry_count = 0
                max_retries = 3
                while retry_count < max_retries:
                    try:
                        response = await asyncio.get_event_loop().run_in_executor(
                            None,
                            lambda: requests.post(
                                f"http://{ip}:8080/print/",
                                data=json.dumps(bill_lines).encode("utf-8"),
                                headers={"Content-Type": "application/json; charset=utf-8"},
                                timeout=5
                            )
                        )
                        if response.status_code == 200:
                            logger.info(f"Đã gửi bill tới POSPrinter {ip}")
                            break
                        else:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip}: HTTP {response.status_code}")
                            retry_count += 1
                    except Exception as e:
                        retry_count += 1
                        if retry_count == max_retries:
                            logger.error(f"Lỗi gửi bill tới POSPrinter {ip} sau {max_retries} lần thử: {str(e)}")
                        else:
                            logger.warning(f"Lỗi gửi bill tới POSPrinter {ip}, thử lại lần {retry_count}/{max_retries}: {str(e)}")
                            await asyncio.sleep(1)
        asyncio.create_task(send_to_printer())

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
        status=orders[0].status,
        total_amount=sum(i["total_price"] for i in merged_items.values()),
        note="Gộp từ các order: " + ", ".join(str(o.id) for o in orders),
        payment_status=orders[0].payment_status,
        order_code=str(uuid.uuid4())[:8].upper(),
        time_in=get_vietnam_time()
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
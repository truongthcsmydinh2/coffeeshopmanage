from fastapi import FastAPI, Depends, HTTPException, status, Body, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
from . import crud, models, schemas
from .database.database import engine, get_db, Base, init_all
from .database.models import OrderStatus, Order, Table, Staff, Shift, Payment, StaffStatus
from datetime import datetime, timedelta, date
from sqlalchemy import func, extract
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.staff.create import router as staff_router
from .api.staff.by_role import router as staff_by_role_router
from .api.shifts.current import router as shifts_current_router
from .api.shifts.create import router as shifts_create_router
from .api.shifts.active import router as shifts_active_router
from .api.shifts.close import router as shifts_close_router
from .api.v1.endpoints.orders import router as orders_router
from .api.v1.endpoints import cancelled_items
from sqlalchemy.exc import IntegrityError
import os
from dotenv import load_dotenv
import uvicorn
from app.core.config import settings
from app.api.v1.api import api_router
import json
import uuid
import logging
import sys
import requests
from app.api.v1.endpoints.dashboard import router as dashboard_router
from starlette.websockets import WebSocketState
from app.api.v1.endpoints.printer_manager import printer_manager

load_dotenv()

# Khởi tạo database
init_all()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount static files
app.mount("/image", StaticFiles(directory="/coffeeshopmanage/image"), name="image")

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

# Cấu hình uvicorn logging
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.setLevel(logging.INFO)
uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.setLevel(logging.INFO)

# Cấu hình app logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Thêm handler cho console
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Thêm handler cho file
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Thêm ConnectionManager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.logger = logging.getLogger(__name__)

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.logger.info(f"Client {client_id} disconnected")

    async def broadcast(self, message: str):
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                self.logger.error(f"Error broadcasting to client {client_id}: {str(e)}")
                self.disconnect(client_id)

manager = ConnectionManager()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.99.166:3000", "http://192.168.99.166:3001", "http://amnhactechcf.ddns.net:3000", "http://amnhactechcf.ddns.net:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Thêm middleware cho WebSocket
@app.middleware("http")
async def websocket_cors_middleware(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/ws/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Đăng ký tất cả các router
app.include_router(api_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/orders", tags=["orders"])
app.include_router(staff_router, prefix="/api/staff", tags=["staff"])
app.include_router(staff_by_role_router, prefix="/api/staff/by-role", tags=["staff"])
app.include_router(shifts_current_router, prefix="/api/shifts", tags=["shifts"])
app.include_router(shifts_create_router, prefix="/api/shifts", tags=["shifts"])
app.include_router(shifts_active_router, prefix="/api/shifts", tags=["shifts"])
app.include_router(shifts_close_router, prefix="/api/shifts", tags=["shifts"])
app.include_router(dashboard_router, prefix="/api/v1/endpoints/dashboard", tags=["dashboard"])
app.include_router(cancelled_items.router, prefix="/api/v1/endpoints/cancelled-items", tags=["cancelled-items"])

# Thêm WebSocket endpoint
@app.websocket("/ws/printer")
async def printer_websocket_endpoint(websocket: WebSocket):
    printer_id = str(uuid.uuid4())
    try:
        # Accept connection trước
        await websocket.accept()
        
        # Gửi thông tin kết nối thành công
        await websocket.send_json({
            "type": "connection",
            "data": {
                "status": "connected",
                "printer_id": printer_id,
                "timestamp": datetime.now().isoformat()
            }
        })
        
        # Thêm vào manager sau khi đã accept
        success = await printer_manager.connect(printer_id, websocket)
        if not success:
            logger.error(f"Failed to add printer {printer_id} to manager")
            await websocket.close()
            return
        
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    logger.info(f"Received message from printer {printer_id}: {message}")
                    
                    if message.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "data": {
                                "timestamp": datetime.now().isoformat()
                            }
                        })
                    elif message.get("type") == "printer_info":
                        printer_info = message.get("data", {})
                        logger.info(f"Printer {printer_id} info: {printer_info}")
                        
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from printer {printer_id}: {data}")
                    
            except WebSocketDisconnect:
                logger.info(f"Printer {printer_id} disconnected")
                break
            except Exception as e:
                logger.error(f"Error receiving message from printer {printer_id}: {str(e)}")
                break
    except Exception as e:
        logger.error(f"WebSocket error for printer {printer_id}: {str(e)}")
    finally:
        try:
            printer_manager.disconnect(printer_id)
        except Exception as e:
            logger.error(f"Error disconnecting printer {printer_id}: {str(e)}")

# Menu Group Endpoints
@app.post("/api/menu-groups/", response_model=schemas.MenuGroup)
def create_menu_group(
    menu_group: schemas.MenuGroupCreate,
    db: Session = Depends(get_db)
):
    return crud.create_menu_group(db=db, menu_group=menu_group)

@app.get("/api/menu-groups/", response_model=List[schemas.MenuGroup])
def read_menu_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    menu_groups = crud.get_menu_groups(db, skip=skip, limit=limit)
    return menu_groups

@app.get("/api/menu-groups/{menu_group_id}", response_model=schemas.MenuGroup)
def read_menu_group(menu_group_id: int, db: Session = Depends(get_db)):
    db_menu_group = crud.get_menu_group(db, menu_group_id=menu_group_id)
    if db_menu_group is None:
        raise HTTPException(status_code=404, detail="Menu group not found")
    return db_menu_group

@app.put("/api/menu-groups/{menu_group_id}", response_model=schemas.MenuGroup)
def update_menu_group(menu_group_id: int, menu_group: schemas.MenuGroupCreate, db: Session = Depends(get_db)):
    db_menu_group = crud.update_menu_group(db, menu_group_id=menu_group_id, menu_group=menu_group)
    if db_menu_group is None:
        raise HTTPException(status_code=404, detail="Menu group not found")
    return db_menu_group

@app.delete("/api/menu-groups/{menu_group_id}", response_model=schemas.MenuGroup)
def delete_menu_group(menu_group_id: int, db: Session = Depends(get_db)):
    db_menu_group = crud.delete_menu_group(db, menu_group_id=menu_group_id)
    if db_menu_group is None:
        raise HTTPException(status_code=404, detail="Menu group not found")
    return db_menu_group

# Menu Item Endpoints
@app.post("/api/menu-items/", response_model=schemas.MenuItem)
def create_menu_item(menu_item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    try:
        print(f"Đang thử tạo menu item: {menu_item.dict()}")
        result = crud.create_menu_item(db=db, menu_item=menu_item)
        print(f"Tạo menu item thành công: {result}")
        return result
    except Exception as e:
        print(f"Lỗi khi tạo menu item: {str(e)}")
        raise

@app.get("/api/menu-items/", response_model=List[schemas.MenuItem])
def read_menu_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    menu_items = crud.get_menu_items(db, skip=skip, limit=limit)
    return menu_items

@app.get("/api/menu-items/{menu_item_id}", response_model=schemas.MenuItem)
def read_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    db_menu_item = crud.get_menu_item(db, menu_item_id=menu_item_id)
    if db_menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return db_menu_item

@app.put("/api/menu-items/{menu_item_id}", response_model=schemas.MenuItem)
def update_menu_item(menu_item_id: int, menu_item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_menu_item = crud.update_menu_item(db, menu_item_id=menu_item_id, menu_item=menu_item)
    if db_menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return db_menu_item

@app.delete("/api/menu-items/{menu_item_id}", response_model=schemas.MenuItem)
def delete_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    db_menu_item = crud.delete_menu_item(db, menu_item_id=menu_item_id)
    if db_menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return db_menu_item

@app.post("/api/menu-items/bulk/")
def create_menu_items_bulk(
    menu_items: List[schemas.MenuItemCreate] = Body(...),
    db: Session = Depends(get_db)
):
    duplicated = []
    added = []
    for item in menu_items:
        try:
            db_item = crud.create_menu_item(db=db, menu_item=item)
            added.append(db_item)
        except IntegrityError:
            db.rollback()
            duplicated.append(item.name)
    return {
        "added": [item.name for item in added],
        "duplicated": duplicated,
        "message": f"Đã thêm {len(added)} món, bỏ qua {len(duplicated)} món trùng tên."
    }

# Staff Role endpoints
@app.post("/staff-roles/", response_model=schemas.StaffRole)
def create_staff_role(staff_role: schemas.StaffRoleCreate, db: Session = Depends(get_db)):
    return crud.create_staff_role(db=db, staff_role=staff_role)

@app.get("/staff-roles/", response_model=List[schemas.StaffRole])
def read_staff_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    staff_roles = crud.get_staff_roles(db, skip=skip, limit=limit)
    return staff_roles

@app.get("/staff-roles/{staff_role_id}", response_model=schemas.StaffRole)
def read_staff_role(staff_role_id: int, db: Session = Depends(get_db)):
    db_staff_role = crud.get_staff_role(db, staff_role_id=staff_role_id)
    if db_staff_role is None:
        raise HTTPException(status_code=404, detail="Staff role not found")
    return db_staff_role

@app.put("/staff-roles/{staff_role_id}", response_model=schemas.StaffRole)
def update_staff_role(staff_role_id: int, staff_role: schemas.StaffRoleCreate, db: Session = Depends(get_db)):
    db_staff_role = crud.update_staff_role(db, staff_role_id=staff_role_id, staff_role=staff_role)
    if db_staff_role is None:
        raise HTTPException(status_code=404, detail="Staff role not found")
    return db_staff_role

@app.delete("/staff-roles/{staff_role_id}", response_model=schemas.StaffRole)
def delete_staff_role(staff_role_id: int, db: Session = Depends(get_db)):
    db_staff_role = crud.delete_staff_role(db, staff_role_id=staff_role_id)
    if db_staff_role is None:
        raise HTTPException(status_code=404, detail="Staff role not found")
    return db_staff_role

# Staff endpoints
@app.post("/staff/", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    return crud.create_staff(db=db, staff=staff)

@app.get("/staff/", response_model=List[schemas.Staff])
def read_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    staffs = crud.get_staffs(db, skip=skip, limit=limit)
    return staffs

@app.get("/staff/{staff_id}", response_model=schemas.Staff)
def read_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = crud.get_staff(db, staff_id=staff_id)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff not found")
    return db_staff

@app.put("/staff/{staff_id}", response_model=schemas.Staff)
def update_staff(staff_id: int, staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = crud.update_staff(db, staff_id=staff_id, staff=staff)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff not found")
    return db_staff

@app.delete("/staff/{staff_id}", response_model=schemas.Staff)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = crud.delete_staff(db, staff_id=staff_id)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff not found")
    return db_staff

# Staff Attendance endpoints
@app.post("/staff-attendance/", response_model=schemas.StaffAttendance)
def create_staff_attendance(attendance: schemas.StaffAttendanceCreate, db: Session = Depends(get_db)):
    return crud.create_staff_attendance(db=db, attendance=attendance)

@app.get("/staff-attendance/", response_model=List[schemas.StaffAttendance])
def read_staff_attendances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    attendances = crud.get_staff_attendances(db, skip=skip, limit=limit)
    return attendances

@app.get("/staff-attendance/{attendance_id}", response_model=schemas.StaffAttendance)
def read_staff_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = crud.get_staff_attendance(db, attendance_id=attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Staff attendance not found")
    return db_attendance

@app.get("/staff-attendance/staff/{staff_id}/date/{date}", response_model=schemas.StaffAttendance)
def read_staff_attendance_by_date(staff_id: int, date: date, db: Session = Depends(get_db)):
    db_attendance = crud.get_staff_attendance_by_date(db, staff_id=staff_id, date=date)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Staff attendance not found")
    return db_attendance

@app.put("/staff-attendance/{attendance_id}", response_model=schemas.StaffAttendance)
def update_staff_attendance(attendance_id: int, attendance: schemas.StaffAttendanceCreate, db: Session = Depends(get_db)):
    db_attendance = crud.update_staff_attendance(db, attendance_id=attendance_id, attendance=attendance)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Staff attendance not found")
    return db_attendance

@app.delete("/staff-attendance/{attendance_id}", response_model=schemas.StaffAttendance)
def delete_staff_attendance(attendance_id: int, db: Session = Depends(get_db)):
    db_attendance = crud.delete_staff_attendance(db, attendance_id=attendance_id)
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Staff attendance not found")
    return db_attendance

# Staff Performance endpoints
@app.post("/staff-performance/", response_model=schemas.StaffPerformance)
def create_staff_performance(performance: schemas.StaffPerformanceCreate, db: Session = Depends(get_db)):
    return crud.create_staff_performance(db=db, performance=performance)

@app.get("/staff-performance/", response_model=List[schemas.StaffPerformance])
def read_staff_performances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    performances = crud.get_staff_performances(db, skip=skip, limit=limit)
    return performances

@app.get("/staff-performance/{performance_id}", response_model=schemas.StaffPerformance)
def read_staff_performance(performance_id: int, db: Session = Depends(get_db)):
    db_performance = crud.get_staff_performance(db, performance_id=performance_id)
    if db_performance is None:
        raise HTTPException(status_code=404, detail="Staff performance not found")
    return db_performance

@app.get("/staff-performance/staff/{staff_id}/date/{date}", response_model=schemas.StaffPerformance)
def read_staff_performance_by_date(staff_id: int, date: date, db: Session = Depends(get_db)):
    db_performance = crud.get_staff_performance_by_date(db, staff_id=staff_id, date=date)
    if db_performance is None:
        raise HTTPException(status_code=404, detail="Staff performance not found")
    return db_performance

@app.put("/staff-performance/{performance_id}", response_model=schemas.StaffPerformance)
def update_staff_performance(performance_id: int, performance: schemas.StaffPerformanceCreate, db: Session = Depends(get_db)):
    db_performance = crud.update_staff_performance(db, performance_id=performance_id, performance=performance)
    if db_performance is None:
        raise HTTPException(status_code=404, detail="Staff performance not found")
    return db_performance

@app.delete("/staff-performance/{performance_id}", response_model=schemas.StaffPerformance)
def delete_staff_performance(performance_id: int, db: Session = Depends(get_db)):
    db_performance = crud.delete_staff_performance(db, performance_id=performance_id)
    if db_performance is None:
        raise HTTPException(status_code=404, detail="Staff performance not found")
    return db_performance

# Staff Schedule endpoints
@app.post("/staff-schedule/", response_model=schemas.StaffSchedule)
def create_staff_schedule(schedule: schemas.StaffScheduleCreate, db: Session = Depends(get_db)):
    return crud.create_staff_schedule(db=db, schedule=schedule)

@app.get("/staff-schedule/", response_model=List[schemas.StaffSchedule])
def read_staff_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schedules = crud.get_staff_schedules(db, skip=skip, limit=limit)
    return schedules

@app.get("/staff-schedule/{schedule_id}", response_model=schemas.StaffSchedule)
def read_staff_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.get_staff_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Staff schedule not found")
    return db_schedule

@app.get("/staff-schedule/staff/{staff_id}/date/{date}", response_model=schemas.StaffSchedule)
def read_staff_schedule_by_date(staff_id: int, date: date, db: Session = Depends(get_db)):
    db_schedule = crud.get_staff_schedule_by_date(db, staff_id=staff_id, date=date)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Staff schedule not found")
    return db_schedule

@app.put("/staff-schedule/{schedule_id}", response_model=schemas.StaffSchedule)
def update_staff_schedule(schedule_id: int, schedule: schemas.StaffScheduleCreate, db: Session = Depends(get_db)):
    db_schedule = crud.update_staff_schedule(db, schedule_id=schedule_id, schedule=schedule)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Staff schedule not found")
    return db_schedule

@app.delete("/staff-schedule/{schedule_id}", response_model=schemas.StaffSchedule)
def delete_staff_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.delete_staff_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Staff schedule not found")
    return db_schedule

# Order Endpoints
@app.post("/orders/", response_model=schemas.OrderResponse)
async def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        # Tạo order mới với các trường cần thiết
        db_order = Order(
            table_id=order.table_id,
            staff_id=order.staff_id,
            shift_id=order.shift_id,
            status=order.status,
            total_amount=order.total_amount,
            note=order.note,
            order_code=order.order_code,
            payment_status=order.payment_status,
            time_in=order.time_in,
            time_out=order.time_out
        )
        
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        # Broadcast thông báo order mới
        await manager.broadcast(json.dumps({
            "type": "new_order",
            "data": {
                "order_id": db_order.id,
                "timestamp": datetime.now().isoformat()
            }
        }))
        
        # Chuyển đổi kết quả thành dict
        result = {
            "id": db_order.id,
            "table_id": db_order.table_id,
            "staff_id": db_order.staff_id,
            "shift_id": db_order.shift_id,
            "status": db_order.status,
            "total_amount": db_order.total_amount,
            "note": db_order.note,
            "order_code": db_order.order_code,
            "payment_status": db_order.payment_status,
            "time_in": db_order.time_in,
            "time_out": db_order.time_out,
            "items": []  # Thêm items rỗng vì không cần thiết cho danh sách
        }
        
        return result
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi khi tạo order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi tạo order: {str(e)}"
        )

@app.get("/orders/", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        # Chỉ lấy các order có status là active hoặc pending
        orders = db.query(
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
        ).filter(
            Order.status.in_(["active", "pending"])
        ).order_by(
            Order.time_in.desc()  # Sắp xếp theo thời gian mới nhất
        ).offset(skip).limit(limit).all()
        
        # Chuyển đổi kết quả thành dict
        result = []
        for order in orders:
            # Lấy thông tin items của order, chỉ lấy các cột cần thiết
            items = db.query(
                models.OrderItem.id,
                models.OrderItem.order_id,
                models.OrderItem.menu_item_id,
                models.OrderItem.quantity,
                models.OrderItem.unit_price,
                models.OrderItem.total_price,
                models.OrderItem.note
            ).filter(
                models.OrderItem.order_id == order.id
            ).all()
            
            # Chuyển đổi items thành dict
            items_dict = []
            for item in items:
                menu_item = db.query(models.MenuItem).filter(
                    models.MenuItem.id == item.menu_item_id
                ).first()
                
                items_dict.append({
                    "id": item.id,
                    "order_id": item.order_id,
                    "menu_item_id": item.menu_item_id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "note": item.note,
                    "name": menu_item.name if menu_item else ""
                })
            
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
                "time_in": order.time_in,
                "time_out": order.time_out,
                "items": items_dict
            }
            result.append(order_dict)
        
        return result
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách orders: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy danh sách orders: {str(e)}"
        )

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    # Gán tên món cho từng item
    for item in db_order.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        item.name = menu_item.name if menu_item else ""
    return db_order

@app.put("/orders/{order_id}", response_model=schemas.OrderResponse)
def update_order(order_id: int, order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = crud.update_order(db, order_id=order_id, order=order)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@app.delete("/orders/{order_id}", response_model=schemas.OrderResponse)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.delete_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@app.get("/orders/active", response_model=List[schemas.OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).filter(models.Order.status.in_(["pending", "active"])).all()

# Payment Endpoints
@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    return crud.create_payment(db=db, payment=payment)

@app.get("/payments/", response_model=List[schemas.Payment])
def read_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payments = crud.get_payments(db, skip=skip, limit=limit)
    return payments

@app.get("/payments/{payment_id}", response_model=schemas.Payment)
def read_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = crud.get_payment(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

# Table endpoints
@app.post("/tables/", response_model=schemas.Table)
def create_table(table: schemas.TableCreate, db: Session = Depends(get_db)):
    return crud.create_table(db=db, table=table)

@app.get("/tables/", response_model=List[schemas.Table])
def read_tables(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tables = crud.get_tables(db, skip=skip, limit=limit)
    return tables

@app.get("/tables/{table_id}", response_model=schemas.Table)
def read_table(table_id: int, db: Session = Depends(get_db)):
    db_table = crud.get_table(db, table_id=table_id)
    if db_table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table

@app.put("/tables/{table_id}", response_model=schemas.Table)
def update_table(table_id: int, table: schemas.TableCreate, db: Session = Depends(get_db)):
    db_table = crud.update_table(db, table_id=table_id, table=table)
    if db_table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table

@app.delete("/tables/{table_id}")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    db_table = crud.delete_table(db, table_id=table_id)
    if db_table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table deleted successfully"}

# Promotion Endpoints
@app.post("/promotions/", response_model=schemas.Promotion)
def create_promotion(promotion: schemas.PromotionCreate, db: Session = Depends(get_db)):
    return crud.create_promotion(db=db, promotion=promotion)

@app.get("/promotions/", response_model=List[schemas.Promotion])
def read_promotions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    promotions = crud.get_promotions(db, skip=skip, limit=limit)
    return promotions

@app.get("/promotions/{promotion_id}", response_model=schemas.Promotion)
def read_promotion(promotion_id: int, db: Session = Depends(get_db)):
    db_promotion = crud.get_promotion(db, promotion_id=promotion_id)
    if db_promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return db_promotion

@app.put("/promotions/{promotion_id}", response_model=schemas.Promotion)
def update_promotion(promotion_id: int, promotion: schemas.PromotionCreate, db: Session = Depends(get_db)):
    db_promotion = crud.update_promotion(db, promotion_id=promotion_id, promotion=promotion)
    if db_promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return db_promotion

@app.delete("/promotions/{promotion_id}", response_model=schemas.Promotion)
def delete_promotion(promotion_id: int, db: Session = Depends(get_db)):
    db_promotion = crud.delete_promotion(db, promotion_id=promotion_id)
    if db_promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return db_promotion

# Dashboard Endpoints
@app.get("/dashboard/revenue")
def get_revenue(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Get actual revenue (completed payments)
    actual_revenue = db.query(models.Payment).filter(
        models.Payment.payment_time >= start_of_day,
        models.Payment.payment_time <= end_of_day
    ).with_entities(func.sum(models.Payment.total_amount)).scalar() or 0

    # Get estimated revenue (pending orders)
    estimated_revenue = db.query(models.Order).filter(
        models.Order.time_in >= start_of_day,
        models.Order.time_in <= end_of_day,
        models.Order.status == "pending"
    ).with_entities(func.sum(models.OrderItem.quantity * models.OrderItem.unit_price)).scalar() or 0

    return {
        "actual_revenue": actual_revenue,
        "estimated_revenue": estimated_revenue,
        "total_revenue": actual_revenue + estimated_revenue
    }

@app.get("/dashboard/cancelled-orders")
def get_cancelled_orders(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    cancelled_orders = db.query(models.Order).filter(
        models.Order.time_in >= start_of_day,
        models.Order.time_in <= end_of_day,
        models.Order.status == "cancelled"
    ).count()

    return {"cancelled_orders": cancelled_orders}

@app.get("/dashboard/revenue-by-hour")
def get_revenue_by_hour(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    revenue_by_hour = db.query(
        extract('hour', models.Payment.payment_time).label('hour'),
        func.sum(models.Payment.total_amount).label('revenue')
    ).filter(
        models.Payment.payment_time >= start_of_day,
        models.Payment.payment_time <= end_of_day
    ).group_by('hour').all()

    return [{"hour": r.hour, "revenue": r.revenue} for r in revenue_by_hour]

@app.get("/dashboard/revenue-by-group")
def get_revenue_by_group(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    revenue_by_group = db.query(
        models.MenuGroup.name.label('group_name'),
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label('revenue')
    ).join(
        models.MenuItem, models.MenuItem.group_id == models.MenuGroup.id
    ).join(
        models.OrderItem, models.OrderItem.menu_item_id == models.MenuItem.id
    ).join(
        models.Order, models.Order.id == models.OrderItem.order_id
    ).filter(
        models.Order.time_in >= start_of_day,
        models.Order.time_in <= end_of_day
    ).group_by('group_name').all()

    return [{"group_name": r.group_name, "revenue": r.revenue} for r in revenue_by_group]

# Category endpoints
@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_categories(db, skip=skip, limit=limit)
    return categories

@app.get("/categories/{category_id}", response_model=schemas.Category)
def read_category(category_id: int, db: Session = Depends(get_db)):
    db_category = crud.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@app.put("/categories/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = crud.update_category(db, category_id=category_id, category=category)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@app.delete("/categories/{category_id}", response_model=schemas.Category)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = crud.delete_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

# Product endpoints
@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.get("/products/category/{category_id}", response_model=List[schemas.Product])
def read_products_by_category(category_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products_by_category(db, category_id=category_id, skip=skip, limit=limit)
    return products

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.delete("/products/{product_id}", response_model=schemas.Product)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# Ingredient endpoints
@app.post("/ingredients/", response_model=schemas.Ingredient)
def create_ingredient(ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    return crud.create_ingredient(db=db, ingredient=ingredient)

@app.get("/ingredients/", response_model=List[schemas.Ingredient])
def read_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ingredients = crud.get_ingredients(db, skip=skip, limit=limit)
    return ingredients

@app.get("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def read_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = crud.get_ingredient(db, ingredient_id=ingredient_id)
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return db_ingredient

@app.put("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(ingredient_id: int, ingredient: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_ingredient = crud.update_ingredient(db, ingredient_id=ingredient_id, ingredient=ingredient)
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return db_ingredient

@app.delete("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    db_ingredient = crud.delete_ingredient(db, ingredient_id=ingredient_id)
    if db_ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return db_ingredient

# ProductIngredient endpoints
@app.post("/product-ingredients/", response_model=schemas.ProductIngredient)
def create_product_ingredient(product_ingredient: schemas.ProductIngredientCreate, db: Session = Depends(get_db)):
    return crud.create_product_ingredient(db=db, product_ingredient=product_ingredient)

@app.get("/product-ingredients/", response_model=List[schemas.ProductIngredient])
def read_product_ingredients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    product_ingredients = crud.get_product_ingredients(db, skip=skip, limit=limit)
    return product_ingredients

@app.get("/product-ingredients/product/{product_id}", response_model=List[schemas.ProductIngredient])
def read_product_ingredients_by_product(product_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    product_ingredients = crud.get_product_ingredients_by_product(db, product_id=product_id, skip=skip, limit=limit)
    return product_ingredients

@app.get("/product-ingredients/{product_ingredient_id}", response_model=schemas.ProductIngredient)
def read_product_ingredient(product_ingredient_id: int, db: Session = Depends(get_db)):
    db_product_ingredient = crud.get_product_ingredient(db, product_ingredient_id=product_ingredient_id)
    if db_product_ingredient is None:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    return db_product_ingredient

@app.put("/product-ingredients/{product_ingredient_id}", response_model=schemas.ProductIngredient)
def update_product_ingredient(product_ingredient_id: int, product_ingredient: schemas.ProductIngredientCreate, db: Session = Depends(get_db)):
    db_product_ingredient = crud.update_product_ingredient(db, product_ingredient_id=product_ingredient_id, product_ingredient=product_ingredient)
    if db_product_ingredient is None:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    return db_product_ingredient

@app.delete("/product-ingredients/{product_ingredient_id}", response_model=schemas.ProductIngredient)
def delete_product_ingredient(product_ingredient_id: int, db: Session = Depends(get_db)):
    db_product_ingredient = crud.delete_product_ingredient(db, product_ingredient_id=product_ingredient_id)
    if db_product_ingredient is None:
        raise HTTPException(status_code=404, detail="Product ingredient not found")
    return db_product_ingredient

# Table operations
@app.post("/tables/merge/", response_model=schemas.Table)
def merge_tables(table_ids: List[int], new_table_name: str, db: Session = Depends(get_db)):
    return crud.merge_tables(db=db, table_ids=table_ids, new_table_name=new_table_name)

@app.post("/tables/split/", response_model=schemas.Table)
def split_table(table_id: int, items_to_move: List[int], new_table_name: str, db: Session = Depends(get_db)):
    return crud.split_table(db=db, table_id=table_id, items_to_move=items_to_move, new_table_name=new_table_name)

@app.put("/tables/{table_id}/move/", response_model=schemas.Table)
def move_table(table_id: int, new_layout_id: int, new_row: int, new_column: int, db: Session = Depends(get_db)):
    db_table = crud.move_table(db=db, table_id=table_id, new_layout_id=new_layout_id, new_row=new_row, new_column=new_column)
    if db_table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table

# OrderItem endpoints
@app.post("/order-items/", response_model=schemas.OrderItemResponse)
def create_order_item(order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    return crud.create_order_item(db=db, order_item=order_item)

@app.get("/order-items/", response_model=List[schemas.OrderItemResponse])
def read_order_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    order_items = crud.get_order_items(db, skip=skip, limit=limit)
    return order_items

@app.get("/order-items/{order_item_id}", response_model=schemas.OrderItemResponse)
def read_order_item(order_item_id: int, db: Session = Depends(get_db)):
    db_order_item = crud.get_order_item(db, order_item_id=order_item_id)
    if db_order_item is None:
        raise HTTPException(status_code=404, detail="Order item not found")
    return db_order_item

@app.put("/order-items/{order_item_id}", response_model=schemas.OrderItemResponse)
def update_order_item(order_item_id: int, order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    db_order_item = crud.update_order_item(db, order_item_id=order_item_id, order_item=order_item)
    if db_order_item is None:
        raise HTTPException(status_code=404, detail="Order item not found")
    return db_order_item

@app.delete("/order-items/{order_item_id}", response_model=schemas.OrderItemResponse)
def delete_order_item(order_item_id: int, db: Session = Depends(get_db)):
    db_order_item = crud.delete_order_item(db, order_item_id=order_item_id)
    if db_order_item is None:
        raise HTTPException(status_code=404, detail="Order item not found")
    return db_order_item

# CancelReason endpoints
@app.post("/cancel-reasons/", response_model=schemas.CancelReason)
def create_cancel_reason(cancel_reason: schemas.CancelReasonCreate, db: Session = Depends(get_db)):
    return crud.create_cancel_reason(db=db, cancel_reason=cancel_reason)

@app.get("/cancel-reasons/", response_model=List[schemas.CancelReason])
def read_cancel_reasons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cancel_reasons = crud.get_cancel_reasons(db, skip=skip, limit=limit)
    return cancel_reasons

@app.get("/cancel-reasons/{cancel_reason_id}", response_model=schemas.CancelReason)
def read_cancel_reason(cancel_reason_id: int, db: Session = Depends(get_db)):
    db_cancel_reason = crud.get_cancel_reason(db, cancel_reason_id=cancel_reason_id)
    if db_cancel_reason is None:
        raise HTTPException(status_code=404, detail="Cancel reason not found")
    return db_cancel_reason

@app.put("/cancel-reasons/{cancel_reason_id}", response_model=schemas.CancelReason)
def update_cancel_reason(cancel_reason_id: int, cancel_reason: schemas.CancelReasonCreate, db: Session = Depends(get_db)):
    db_cancel_reason = crud.update_cancel_reason(db, cancel_reason_id=cancel_reason_id, cancel_reason=cancel_reason)
    if db_cancel_reason is None:
        raise HTTPException(status_code=404, detail="Cancel reason not found")
    return db_cancel_reason

@app.delete("/cancel-reasons/{cancel_reason_id}", response_model=schemas.CancelReason)
def delete_cancel_reason(cancel_reason_id: int, db: Session = Depends(get_db)):
    db_cancel_reason = crud.delete_cancel_reason(db, cancel_reason_id=cancel_reason_id)
    if db_cancel_reason is None:
        raise HTTPException(status_code=404, detail="Cancel reason not found")
    return db_cancel_reason

# Order operations
@app.post("/orders/{order_id}/items/", response_model=schemas.OrderItemResponse)
def add_order_item(order_id: int, order_item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    return crud.add_order_item(db=db, order_id=order_id, order_item=order_item)

@app.put("/orders/{order_id}/status/", response_model=schemas.OrderResponse)
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    db_order = crud.update_order_status(db, order_id=order_id, status=status)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    # Broadcast thông báo cập nhật trạng thái
    await manager.broadcast(json.dumps({
        "type": "order_status_update",
        "data": {
            "order_id": order_id,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
    }))
    return db_order

@app.post("/orders/{order_id}/cancel/", response_model=schemas.OrderResponse)
def cancel_order(order_id: int, cancel_reason_id: int, db: Session = Depends(get_db)):
    db_order = crud.cancel_order(db, order_id=order_id, cancel_reason_id=cancel_reason_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

# Payment operations
@app.put("/payments/{payment_id}/status/", response_model=schemas.Payment)
def update_payment_status(payment_id: int, status: str, db: Session = Depends(get_db)):
    db_payment = crud.update_payment_status(db, payment_id=payment_id, status=status)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

@app.get("/payments/order/{order_id}", response_model=List[schemas.Payment])
def get_payments_by_order(order_id: int, db: Session = Depends(get_db)):
    payments = crud.get_payments_by_order(db, order_id=order_id)
    return payments

@app.get("/payments/date-range/", response_model=List[schemas.Payment])
def get_payments_by_date_range(start_date: datetime, end_date: datetime, db: Session = Depends(get_db)):
    payments = crud.get_payments_by_date_range(db, start_date=start_date, end_date=end_date)
    return payments

@app.get("/payments/summary/")
def get_payment_summary(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Tổng doanh thu theo phương thức thanh toán
    payment_method_summary = db.query(
        models.Payment.payment_method,
        func.sum(models.Payment.total_amount).label('total_amount'),
        func.count(models.Payment.id).label('count')
    ).filter(
        models.Payment.payment_time >= start_of_day,
        models.Payment.payment_time <= end_of_day
    ).group_by(models.Payment.payment_method).all()

    # Tổng doanh thu theo giờ
    hourly_summary = db.query(
        extract('hour', models.Payment.payment_time).label('hour'),
        func.sum(models.Payment.total_amount).label('total_amount'),
        func.count(models.Payment.id).label('count')
    ).filter(
        models.Payment.payment_time >= start_of_day,
        models.Payment.payment_time <= end_of_day
    ).group_by('hour').all()

    return {
        "payment_method_summary": [
            {
                "method": p.payment_method,
                "total_amount": p.total_amount,
                "count": p.count
            } for p in payment_method_summary
        ],
        "hourly_summary": [
            {
                "hour": h.hour,
                "total_amount": h.total_amount,
                "count": h.count
            } for h in hourly_summary
        ]
    }

# Printer Settings endpoints
@app.post("/printer-settings/", response_model=schemas.PrinterSettings)
def create_printer_settings(printer_settings: schemas.PrinterSettingsCreate, db: Session = Depends(get_db)):
    return crud.create_printer_settings(db=db, printer_settings=printer_settings)

@app.get("/printer-settings/", response_model=List[schemas.PrinterSettings])
def read_printer_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    printer_settings = crud.get_printer_settings_list(db, skip=skip, limit=limit)
    return printer_settings

@app.get("/printer-settings/{printer_settings_id}", response_model=schemas.PrinterSettings)
def read_printer_settings_by_id(printer_settings_id: int, db: Session = Depends(get_db)):
    db_printer_settings = crud.get_printer_settings(db, printer_settings_id=printer_settings_id)
    if db_printer_settings is None:
        raise HTTPException(status_code=404, detail="Printer settings not found")
    return db_printer_settings

@app.get("/printer-settings/default/", response_model=schemas.PrinterSettings)
def read_default_printer_settings(db: Session = Depends(get_db)):
    db_printer_settings = crud.get_default_printer_settings(db)
    if db_printer_settings is None:
        raise HTTPException(status_code=404, detail="Default printer settings not found")
    return db_printer_settings

@app.put("/printer-settings/{printer_settings_id}", response_model=schemas.PrinterSettings)
def update_printer_settings(printer_settings_id: int, printer_settings: schemas.PrinterSettingsCreate, db: Session = Depends(get_db)):
    db_printer_settings = crud.update_printer_settings(db, printer_settings_id=printer_settings_id, printer_settings=printer_settings)
    if db_printer_settings is None:
        raise HTTPException(status_code=404, detail="Printer settings not found")
    return db_printer_settings

@app.delete("/printer-settings/{printer_settings_id}", response_model=schemas.PrinterSettings)
def delete_printer_settings(printer_settings_id: int, db: Session = Depends(get_db)):
    db_printer_settings = crud.delete_printer_settings(db, printer_settings_id=printer_settings_id)
    if db_printer_settings is None:
        raise HTTPException(status_code=404, detail="Printer settings not found")
    return db_printer_settings

# Receipt Template endpoints
@app.post("/receipt-templates/", response_model=schemas.ReceiptTemplate)
def create_receipt_template(receipt_template: schemas.ReceiptTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_receipt_template(db=db, receipt_template=receipt_template)

@app.get("/receipt-templates/", response_model=List[schemas.ReceiptTemplate])
def read_receipt_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    receipt_templates = crud.get_receipt_templates(db, skip=skip, limit=limit)
    return receipt_templates

@app.get("/receipt-templates/{receipt_template_id}", response_model=schemas.ReceiptTemplate)
def read_receipt_template(receipt_template_id: int, db: Session = Depends(get_db)):
    db_receipt_template = crud.get_receipt_template(db, receipt_template_id=receipt_template_id)
    if db_receipt_template is None:
        raise HTTPException(status_code=404, detail="Receipt template not found")
    return db_receipt_template

@app.get("/receipt-templates/type/{template_type}/active/", response_model=schemas.ReceiptTemplate)
def read_active_receipt_template(template_type: str, db: Session = Depends(get_db)):
    db_receipt_template = crud.get_active_receipt_template_by_type(db, template_type=template_type)
    if db_receipt_template is None:
        raise HTTPException(status_code=404, detail="Active receipt template not found")
    return db_receipt_template

@app.put("/receipt-templates/{receipt_template_id}", response_model=schemas.ReceiptTemplate)
def update_receipt_template(receipt_template_id: int, receipt_template: schemas.ReceiptTemplateCreate, db: Session = Depends(get_db)):
    db_receipt_template = crud.update_receipt_template(db, receipt_template_id=receipt_template_id, receipt_template=receipt_template)
    if db_receipt_template is None:
        raise HTTPException(status_code=404, detail="Receipt template not found")
    return db_receipt_template

@app.delete("/receipt-templates/{receipt_template_id}", response_model=schemas.ReceiptTemplate)
def delete_receipt_template(receipt_template_id: int, db: Session = Depends(get_db)):
    db_receipt_template = crud.delete_receipt_template(db, receipt_template_id=receipt_template_id)
    if db_receipt_template is None:
        raise HTTPException(status_code=404, detail="Receipt template not found")
    return db_receipt_template

# Sales Report endpoints
@app.post("/sales-reports/", response_model=schemas.SalesReport)
def create_sales_report(sales_report: schemas.SalesReportCreate, db: Session = Depends(get_db)):
    return crud.create_sales_report(db=db, sales_report=sales_report)

@app.get("/sales-reports/", response_model=List[schemas.SalesReport])
def read_sales_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sales_reports = crud.get_sales_reports(db, skip=skip, limit=limit)
    return sales_reports

@app.get("/sales-reports/{sales_report_id}", response_model=schemas.SalesReport)
def read_sales_report(sales_report_id: int, db: Session = Depends(get_db)):
    db_sales_report = crud.get_sales_report(db, sales_report_id=sales_report_id)
    if db_sales_report is None:
        raise HTTPException(status_code=404, detail="Sales report not found")
    return db_sales_report

@app.get("/sales-reports/date/{report_date}/type/{report_type}", response_model=schemas.SalesReport)
def read_sales_report_by_date(report_date: date, report_type: str, db: Session = Depends(get_db)):
    db_sales_report = crud.get_sales_report_by_date(db, report_date=report_date, report_type=report_type)
    if db_sales_report is None:
        raise HTTPException(status_code=404, detail="Sales report not found")
    return db_sales_report

@app.put("/sales-reports/{sales_report_id}", response_model=schemas.SalesReport)
def update_sales_report(sales_report_id: int, sales_report: schemas.SalesReportCreate, db: Session = Depends(get_db)):
    db_sales_report = crud.update_sales_report(db, sales_report_id=sales_report_id, sales_report=sales_report)
    if db_sales_report is None:
        raise HTTPException(status_code=404, detail="Sales report not found")
    return db_sales_report

@app.delete("/sales-reports/{sales_report_id}", response_model=schemas.SalesReport)
def delete_sales_report(sales_report_id: int, db: Session = Depends(get_db)):
    db_sales_report = crud.delete_sales_report(db, sales_report_id=sales_report_id)
    if db_sales_report is None:
        raise HTTPException(status_code=404, detail="Sales report not found")
    return db_sales_report

# Product Performance endpoints
@app.post("/product-performance/", response_model=schemas.ProductPerformance)
def create_product_performance(product_performance: schemas.ProductPerformanceCreate, db: Session = Depends(get_db)):
    return crud.create_product_performance(db=db, product_performance=product_performance)

@app.get("/product-performance/", response_model=List[schemas.ProductPerformance])
def read_product_performances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    product_performances = crud.get_product_performances(db, skip=skip, limit=limit)
    return product_performances

@app.get("/product-performance/{product_performance_id}", response_model=schemas.ProductPerformance)
def read_product_performance(product_performance_id: int, db: Session = Depends(get_db)):
    db_product_performance = crud.get_product_performance(db, product_performance_id=product_performance_id)
    if db_product_performance is None:
        raise HTTPException(status_code=404, detail="Product performance not found")
    return db_product_performance

@app.get("/product-performance/product/{product_id}/date/{report_date}", response_model=schemas.ProductPerformance)
def read_product_performance_by_date(product_id: int, report_date: date, db: Session = Depends(get_db)):
    db_product_performance = crud.get_product_performance_by_date(db, product_id=product_id, report_date=report_date)
    if db_product_performance is None:
        raise HTTPException(status_code=404, detail="Product performance not found")
    return db_product_performance

@app.put("/product-performance/{product_performance_id}", response_model=schemas.ProductPerformance)
def update_product_performance(product_performance_id: int, product_performance: schemas.ProductPerformanceCreate, db: Session = Depends(get_db)):
    db_product_performance = crud.update_product_performance(db, product_performance_id=product_performance_id, product_performance=product_performance)
    if db_product_performance is None:
        raise HTTPException(status_code=404, detail="Product performance not found")
    return db_product_performance

@app.delete("/product-performance/{product_performance_id}", response_model=schemas.ProductPerformance)
def delete_product_performance(product_performance_id: int, db: Session = Depends(get_db)):
    db_product_performance = crud.delete_product_performance(db, product_performance_id=product_performance_id)
    if db_product_performance is None:
        raise HTTPException(status_code=404, detail="Product performance not found")
    return db_product_performance

@app.post("/api/orders/close-all/", tags=["orders"])
async def close_all_orders(db: Session = Depends(get_db)):
    try:
        # Lấy tất cả order đang pending, chỉ chọn các cột cần thiết
        active_orders = db.query(
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
        ).filter(
            Order.status == "pending"
        ).all()
        
        if not active_orders:
            return {"message": "Không có order nào cần đóng"}
        
        # Cập nhật trạng thái của tất cả order thành completed và thêm time_out
        for order in active_orders:
            try:
                # Sử dụng update trực tiếp thay vì query toàn bộ record
                db.query(Order).filter(Order.id == order.id).update({
                    "status": "completed",
                    "time_out": datetime.now(),
                    "payment_status": "paid"
                })
            except Exception as e:
                logger.error(f"Lỗi khi cập nhật order {order.id}: {str(e)}")
                continue
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Lỗi khi commit transaction: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lưu thay đổi: {str(e)}"
            )
        
        # Broadcast thông báo đóng tất cả order
        try:
            await manager.broadcast(json.dumps({
                "type": "close_all_orders",
                "data": {
                    "count": len(active_orders),
                    "timestamp": datetime.now().isoformat()
                }
            }))
        except Exception as e:
            logger.error(f"Lỗi khi broadcast thông báo: {str(e)}")
        
        return {"message": f"Đã đóng {len(active_orders)} order thành công"}
    except Exception as e:
        logger.error(f"Lỗi không xác định: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi không xác định: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
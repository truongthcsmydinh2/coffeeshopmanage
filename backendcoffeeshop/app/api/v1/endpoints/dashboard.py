from fastapi import APIRouter, Depends, Query, Body, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Order, Shift, OrderItem, MenuItem, Table
from datetime import datetime, timedelta, time
from typing import Dict
from sqlalchemy import func
import requests
import json
import asyncio
import logging
import uuid
from .printer_manager import printer_manager

router = APIRouter()

@router.get("/summary")
def dashboard_summary(date: str = Query(..., description="YYYY-MM-DD"), db: Session = Depends(get_db)) -> Dict:
    # Parse ngày
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Sai định dạng ngày. Đúng: YYYY-MM-DD"}

    # Lấy tất cả order trong ngày
    start_dt = datetime.combine(target_date, time(0, 0, 0))
    end_dt = datetime.combine(target_date, time(23, 59, 59))
    orders = db.query(Order).filter(Order.time_in >= start_dt, Order.time_in <= end_dt).all()

    # Tổng doanh thu và hóa đơn cả ngày
    result = {
        "total": {
            "revenue": sum(o.total_amount or 0 for o in orders),
            "orders": len(orders)
        },
        "shifts": {
            "morning": {"revenue": 0, "orders": 0},
            "afternoon": {"revenue": 0, "orders": 0},
            "evening": {"revenue": 0, "orders": 0}
        }
    }

    # Thống kê theo ca dựa vào shift_id
    for order in orders:
        if order.shift_id:
            shift = db.query(Shift).filter(Shift.id == order.shift_id).first()
            if shift:
                shift_name = shift.shift_type.lower()  # Chuyển về chữ thường để so sánh
                if shift_name in result["shifts"]:
                    result["shifts"][shift_name]["revenue"] += order.total_amount or 0
                    result["shifts"][shift_name]["orders"] += 1

    return result

@router.get("/cigarettes")
def cigarettes_summary(date: str = Query(..., description="YYYY-MM-DD"), db: Session = Depends(get_db)) -> Dict:
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Sai định dạng ngày. Đúng: YYYY-MM-DD"}

    # Lấy tất cả order trong ngày
    start_dt = datetime.combine(target_date, time(0, 0, 0))
    end_dt = datetime.combine(target_date, time(23, 59, 59))
    
    # Khởi tạo kết quả
    result = {
        "shifts": {
            "morning": {"items": []},
            "afternoon": {"items": []},
            "evening": {"items": []}
        }
    }

    # Lấy tất cả order items thuộc nhóm thuốc lá (group_id = 17)
    cigarettes = db.query(
        OrderItem,
        Order,
        MenuItem,
        Shift
    ).join(
        Order, OrderItem.order_id == Order.id
    ).join(
        MenuItem, OrderItem.menu_item_id == MenuItem.id
    ).join(
        Shift, Order.shift_id == Shift.id
    ).filter(
        Order.time_in >= start_dt,
        Order.time_in <= end_dt,
        MenuItem.group_id == 17
    ).all()

    # Thống kê theo ca
    for item, order, menu_item, shift in cigarettes:
        shift_name = shift.shift_type.lower()
        if shift_name in result["shifts"]:
            # Tìm xem item đã có trong ca chưa
            existing_item = next(
                (x for x in result["shifts"][shift_name]["items"] if x["id"] == menu_item.id),
                None
            )
            
            if existing_item:
                # Nếu đã có thì cộng thêm số lượng
                existing_item["quantity"] += item.quantity
            else:
                # Nếu chưa có thì thêm mới
                result["shifts"][shift_name]["items"].append({
                    "id": menu_item.id,
                    "name": menu_item.name,
                    "quantity": item.quantity
                })

    return result

@router.get("/shift-report")
def shift_report(date: str = Query(..., description="YYYY-MM-DD"), shift: str = Query(..., description="morning/afternoon/evening"), db: Session = Depends(get_db)) -> Dict:
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Sai định dạng ngày. Đúng: YYYY-MM-DD"}

    # Lấy thông tin ca
    shift_obj = db.query(Shift).filter(Shift.shift_type == shift.upper()).first()
    if not shift_obj:
        return {"error": "Không tìm thấy ca"}

    # Lấy tất cả order trong ca
    start_dt = datetime.combine(target_date, time(0, 0, 0))
    end_dt = datetime.combine(target_date, time(23, 59, 59))
    orders = db.query(Order).filter(
        Order.time_in >= start_dt,
        Order.time_in <= end_dt,
        Order.shift_id == shift_obj.id
    ).all()

    # Thống kê chung
    result = {
        "shift": shift,
        "date": date,
        "total_revenue": sum(o.total_amount or 0 for o in orders),
        "total_orders": len(orders),
        "cigarettes": []
    }

    # Thống kê thuốc lá
    cigarettes = db.query(
        OrderItem,
        MenuItem
    ).join(
        MenuItem, OrderItem.menu_item_id == MenuItem.id
    ).join(
        Order, OrderItem.order_id == Order.id
    ).filter(
        Order.time_in >= start_dt,
        Order.time_in <= end_dt,
        Order.shift_id == shift_obj.id,
        MenuItem.group_id == 17
    ).all()

    # Gộp số lượng theo từng loại thuốc
    cigarette_dict = {}
    for item, menu_item in cigarettes:
        if menu_item.id not in cigarette_dict:
            cigarette_dict[menu_item.id] = {
                "name": menu_item.name,
                "quantity": 0
            }
        cigarette_dict[menu_item.id]["quantity"] += item.quantity

    result["cigarettes"] = list(cigarette_dict.values())

    return result

@router.websocket("/ws/printer")
async def printer_websocket_endpoint(websocket: WebSocket):
    printer_id = str(uuid.uuid4())
    try:
        # Chấp nhận kết nối trước khi thêm vào manager
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
        
        # Thêm vào manager sau khi đã kết nối thành công
        await printer_manager.connect(printer_id, websocket)
        
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
                        # Cập nhật thông tin printer
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
        printer_manager.disconnect(printer_id)

@router.post("/print-shift-report")
async def print_shift_report(
    date: str = Body(...),
    shift: str = Body(...),
    db: Session = Depends(get_db)
):
    logger = logging.getLogger("uvicorn.error")
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Sai định dạng ngày. Đúng: YYYY-MM-DD"}

    # Tái sử dụng logic tổng hợp
    summary = dashboard_summary(date, db)
    cigarettes = cigarettes_summary(date, db)

    # Lấy dữ liệu theo ca
    shift_key = shift.lower()
    if shift_key not in summary["shifts"]:
        return {"error": "Không tìm thấy dữ liệu ca"}
    shift_data = summary["shifts"][shift_key]
    cigarette_items = cigarettes["shifts"][shift_key]["items"]

    # Format bill tổng kết ca
    summary_lines = [
        {"text": "TỔNG KẾT CA", "fontSize": 14, "fontName": "Arial Black", "bold": True, "align": "center"},
        {"text": f"Ngày: {target_date.strftime('%d/%m/%Y')}", "fontSize": 10, "bold": False, "align": "left"},
        {"text": f"Ca: {'Ca sáng' if shift_key == 'morning' else 'Ca chiều' if shift_key == 'afternoon' else 'Ca tối'}", "fontSize": 10, "bold": False, "align": "left"},
        {"text": "--------------------------------", "fontSize": 16, "bold": False, "align": "left"},
        {"text": f"Tổng doanh thu: {shift_data['revenue']:,.0f} ₫", "fontSize": 12, "bold": True, "align": "left"},
        {"text": f"Tổng số hóa đơn: {shift_data['orders']}", "fontSize": 12, "bold": False, "align": "left"},
        {"text": "--------------------------------", "fontSize": 12, "bold": False, "align": "left"},
        {"text": "Thống kê thuốc lá:", "fontSize": 13, "bold": True, "align": "left"},
    ]
    if cigarette_items:
        for item in cigarette_items:
            summary_lines.append({
                "text": f"{item['name']} x{item['quantity']} gói", "fontSize": 12, "bold": False, "align": "left"
            })
    else:
        summary_lines.append({"text": "Không có dữ liệu thuốc lá", "fontSize": 12, "bold": False, "align": "left"})
    summary_lines.append({"text": "--------------------------------", "fontSize": 12, "bold": False, "align": "left"})
    summary_lines.append({"text": "Người lập biên bản", "fontSize": 12, "bold": False, "align": "center"})
    summary_lines.append({"text": "(Ký, ghi rõ họ tên)", "fontSize": 12, "bold": False, "align": "center"})

    # Gửi tới tất cả các máy in đang kết nối
    success = False
    for printer_id in printer_manager.active_printers.keys():
        try:
            result = await printer_manager.send_to_printer(printer_id, {
                "type": "print",
                "data": summary_lines
            })
            if result:
                success = True
                logger.info(f"Đã gửi dữ liệu tới printer {printer_id}")
        except Exception as e:
            logger.error(f"Lỗi khi gửi dữ liệu tới printer {printer_id}: {str(e)}")
    
    if not success:
        logger.error("Không thể gửi dữ liệu tới bất kỳ máy in nào")
        return {"error": "Không thể gửi dữ liệu tới máy in. Vui lòng kiểm tra kết nối máy in."}
        
    return {"success": True, "message": "Đã gửi biên bản đóng ca tới máy in"} 
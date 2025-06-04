from sqlalchemy.orm import Session
from .database import models
from .database.database import get_db
from . import schemas
from typing import List, Optional
from datetime import datetime, date
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from sqlalchemy import func, extract

def handle_not_found(entity_name: str):
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            if result is None:
                raise HTTPException(status_code=404, detail=f"{entity_name} not found")
            return result
        return wrapper
    return decorator

# Menu Group CRUD
@handle_not_found("Menu group")
def get_menu_group(db: Session, menu_group_id: int):
    return db.query(models.MenuGroup).filter(models.MenuGroup.id == menu_group_id).first()

def get_menu_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MenuGroup).offset(skip).limit(limit).all()

def create_menu_group(db: Session, menu_group: schemas.MenuGroupCreate):
    try:
        db_menu_group = models.MenuGroup(**menu_group.dict())
        db.add(db_menu_group)
        db.commit()
        db.refresh(db_menu_group)
        return db_menu_group
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Menu group already exists")

@handle_not_found("Menu group")
def update_menu_group(db: Session, menu_group_id: int, menu_group: schemas.MenuGroupUpdate):
    db_menu_group = get_menu_group(db, menu_group_id)
    try:
        for key, value in menu_group.dict().items():
            setattr(db_menu_group, key, value)
        db.commit()
        db.refresh(db_menu_group)
        return db_menu_group
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Menu group update failed")

@handle_not_found("Menu group")
def delete_menu_group(db: Session, menu_group_id: int):
    db_menu_group = get_menu_group(db, menu_group_id)
    try:
        db.delete(db_menu_group)
        db.commit()
        return db_menu_group
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete menu group with existing items")

# Menu Item CRUD
@handle_not_found("Menu item")
def get_menu_item(db: Session, menu_item_id: int):
    return db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()

def get_menu_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MenuItem).offset(skip).limit(limit).all()

def create_menu_item(db: Session, menu_item: schemas.MenuItemCreate):
    try:
        db_menu_item = models.MenuItem(
            name=menu_item.name,
            code=menu_item.code,
            unit=menu_item.unit,
            price=menu_item.price,
            group_id=menu_item.group_id
        )
        db.add(db_menu_item)
        db.commit()
        db.refresh(db_menu_item)
        return db_menu_item
    except Exception as e:
        db.rollback()
        raise Exception(f"Lỗi khi tạo menu item: {str(e)}")

@handle_not_found("Menu item")
def update_menu_item(db: Session, menu_item_id: int, menu_item: schemas.MenuItemCreate):
    db_menu_item = get_menu_item(db, menu_item_id)
    try:
        for key, value in menu_item.dict().items():
            setattr(db_menu_item, key, value)
        db.commit()
        db.refresh(db_menu_item)
        return db_menu_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Menu item update failed")

@handle_not_found("Menu item")
def delete_menu_item(db: Session, menu_item_id: int):
    db_menu_item = get_menu_item(db, menu_item_id)
    try:
        db.delete(db_menu_item)
        db.commit()
        return db_menu_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete menu item with existing orders")

# Staff Role CRUD
def create_staff_role(db: Session, staff_role: schemas.StaffRoleCreate):
    db_staff_role = models.StaffRole(**staff_role.dict())
    db.add(db_staff_role)
    db.commit()
    db.refresh(db_staff_role)
    return db_staff_role

def get_staff_role(db: Session, staff_role_id: int):
    return db.query(models.StaffRole).filter(models.StaffRole.id == staff_role_id).first()

def get_staff_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StaffRole).offset(skip).limit(limit).all()

def update_staff_role(db: Session, staff_role_id: int, staff_role: schemas.StaffRoleCreate):
    db_staff_role = get_staff_role(db, staff_role_id)
    if db_staff_role:
        for key, value in staff_role.dict().items():
            setattr(db_staff_role, key, value)
        db.commit()
        db.refresh(db_staff_role)
    return db_staff_role

def delete_staff_role(db: Session, staff_role_id: int):
    db_staff_role = get_staff_role(db, staff_role_id)
    if db_staff_role:
        db.delete(db_staff_role)
        db.commit()
    return db_staff_role

# Staff CRUD
def create_staff(db: Session, staff: schemas.StaffCreate):
    db_staff = models.Staff(**staff.dict())
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def get_staff(db: Session, staff_id: int):
    return db.query(models.Staff).filter(models.Staff.id == staff_id).first()

def get_staffs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Staff).offset(skip).limit(limit).all()

def update_staff(db: Session, staff_id: int, staff: schemas.StaffCreate):
    db_staff = get_staff(db, staff_id)
    if db_staff:
        for key, value in staff.dict().items():
            setattr(db_staff, key, value)
        db.commit()
        db.refresh(db_staff)
    return db_staff

def delete_staff(db: Session, staff_id: int):
    db_staff = get_staff(db, staff_id)
    if db_staff:
        db.delete(db_staff)
        db.commit()
    return db_staff

# Staff Attendance CRUD
def create_staff_attendance(db: Session, attendance: schemas.StaffAttendanceCreate):
    db_attendance = models.StaffAttendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_staff_attendance(db: Session, attendance_id: int):
    return db.query(models.StaffAttendance).filter(models.StaffAttendance.id == attendance_id).first()

def get_staff_attendances(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StaffAttendance).offset(skip).limit(limit).all()

def get_staff_attendance_by_date(db: Session, staff_id: int, date: date):
    return db.query(models.StaffAttendance).filter(
        models.StaffAttendance.staff_id == staff_id,
        models.StaffAttendance.date == date
    ).first()

def update_staff_attendance(db: Session, attendance_id: int, attendance: schemas.StaffAttendanceCreate):
    db_attendance = get_staff_attendance(db, attendance_id)
    if db_attendance:
        for key, value in attendance.dict().items():
            setattr(db_attendance, key, value)
        db.commit()
        db.refresh(db_attendance)
    return db_attendance

def delete_staff_attendance(db: Session, attendance_id: int):
    db_attendance = get_staff_attendance(db, attendance_id)
    if db_attendance:
        db.delete(db_attendance)
        db.commit()
    return db_attendance

# Staff Performance CRUD
def create_staff_performance(db: Session, performance: schemas.StaffPerformanceCreate):
    db_performance = models.StaffPerformance(**performance.dict())
    db.add(db_performance)
    db.commit()
    db.refresh(db_performance)
    return db_performance

def get_staff_performance(db: Session, performance_id: int):
    return db.query(models.StaffPerformance).filter(models.StaffPerformance.id == performance_id).first()

def get_staff_performances(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StaffPerformance).offset(skip).limit(limit).all()

def get_staff_performance_by_date(db: Session, staff_id: int, date: date):
    return db.query(models.StaffPerformance).filter(
        models.StaffPerformance.staff_id == staff_id,
        models.StaffPerformance.date == date
    ).first()

def update_staff_performance(db: Session, performance_id: int, performance: schemas.StaffPerformanceCreate):
    db_performance = get_staff_performance(db, performance_id)
    if db_performance:
        for key, value in performance.dict().items():
            setattr(db_performance, key, value)
        db.commit()
        db.refresh(db_performance)
    return db_performance

def delete_staff_performance(db: Session, performance_id: int):
    db_performance = get_staff_performance(db, performance_id)
    if db_performance:
        db.delete(db_performance)
        db.commit()
    return db_performance

# Staff Schedule CRUD
def create_staff_schedule(db: Session, schedule: schemas.StaffScheduleCreate):
    db_schedule = models.StaffSchedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_staff_schedule(db: Session, schedule_id: int):
    return db.query(models.StaffSchedule).filter(models.StaffSchedule.id == schedule_id).first()

def get_staff_schedules(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StaffSchedule).offset(skip).limit(limit).all()

def get_staff_schedule_by_date(db: Session, staff_id: int, date: date):
    return db.query(models.StaffSchedule).filter(
        models.StaffSchedule.staff_id == staff_id,
        models.StaffSchedule.date == date
    ).first()

def update_staff_schedule(db: Session, schedule_id: int, schedule: schemas.StaffScheduleCreate):
    db_schedule = get_staff_schedule(db, schedule_id)
    if db_schedule:
        for key, value in schedule.dict().items():
            setattr(db_schedule, key, value)
        db.commit()
        db.refresh(db_schedule)
    return db_schedule

def delete_staff_schedule(db: Session, schedule_id: int):
    db_schedule = get_staff_schedule(db, schedule_id)
    if db_schedule:
        db.delete(db_schedule)
        db.commit()
    return db_schedule

# Order CRUD
def create_order(db: Session, order: schemas.OrderCreate):
    # Lấy shift đang hoạt động
    active_shift = db.query(models.Shift).filter(
        models.Shift.is_active == True,
        models.Shift.status == "active"
    ).first()
    
    if not active_shift:
        raise ValueError("Không tìm thấy ca làm việc đang hoạt động")

    db_order = models.Order(
        table_id=order.table_id,
        staff_id=order.staff_id,
        shift_id=active_shift.id,  # Sử dụng shift đang hoạt động
        status=order.status,
        total_amount=order.total_amount,
        note=order.note,
        order_code=order.order_code,
        payment_status="unpaid"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Create order items
    for item in order.items:
        print(f"[ORDER] Đang xử lý item: {item}")
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if not menu_item:
            print(f"[ORDER] Không tìm thấy menu_item với id: {item.menu_item_id}, bỏ qua!")
            continue  # Bỏ qua nếu menu_item không tồn tại
        db_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            note=item.note
        )
        db.add(db_item)
        print(f"[ORDER] Đã thêm item vào order_items: {db_item}")
    
    db.commit()
    db.refresh(db_order)

    # Cập nhật trạng thái bàn thành 'occupied'
    db_table = db.query(models.Table).filter(models.Table.id == db_order.table_id).first()
    if db_table:
        db_table.status = 'occupied'
        db.commit()
        db.refresh(db_table)

    return db_order

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def update_order(db: Session, order_id: int, order: schemas.OrderCreate):
    db_order = get_order(db, order_id)
    for key, value in order.dict(exclude={'items'}).items():
        setattr(db_order, key, value)
    
    # Update order items
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()
    for item in order.items:
        db_item = models.OrderItem(
            order_id=order_id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            note=item.note
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    db.delete(db_order)
    db.commit()
    return db_order

# Payment CRUD
def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    
    # Update order status
    db_order = get_order(db, payment.order_id)
    db_order.status = "completed"
    db_order.time_out = datetime.utcnow()
    
    # Update table status
    db_table = db_order.table
    db_table.status = "free"
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_payment(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.id == payment_id).first()

def get_payments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Payment).offset(skip).limit(limit).all()

# Table CRUD
def create_table(db: Session, table: schemas.TableCreate):
    # Kiểm tra tên bàn trùng
    base_name = table.name
    counter = 1
    while True:
        existing_table = db.query(models.Table).filter(models.Table.name == table.name).first()
        if not existing_table:
            break
        # Nếu tên trùng, thêm số thứ tự vào cuối
        table.name = f"{base_name} ({counter})"
        counter += 1

    table_data = table.dict(exclude_unset=True)
    db_table = models.Table(**table_data)
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

def get_table(db: Session, table_id: int):
    return db.query(models.Table).filter(models.Table.id == table_id).first()

def get_tables(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Table).offset(skip).limit(limit).all()

def update_table(db: Session, table_id: int, table: schemas.TableCreate):
    db_table = get_table(db, table_id)
    for key, value in table.dict().items():
        setattr(db_table, key, value)
    db.commit()
    db.refresh(db_table)
    return db_table

def delete_table(db: Session, table_id: int):
    db_table = get_table(db, table_id)
    if db_table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    db.delete(db_table)
    db.commit()
    return {"message": "Table deleted successfully"}

# Promotion CRUD
def create_promotion(db: Session, promotion: schemas.PromotionCreate):
    db_promotion = models.Promotion(**promotion.dict())
    db.add(db_promotion)
    db.commit()
    db.refresh(db_promotion)
    return db_promotion

def get_promotion(db: Session, promotion_id: int):
    return db.query(models.Promotion).filter(models.Promotion.id == promotion_id).first()

def get_promotions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Promotion).offset(skip).limit(limit).all()

def update_promotion(db: Session, promotion_id: int, promotion: schemas.PromotionCreate):
    db_promotion = get_promotion(db, promotion_id)
    for key, value in promotion.dict().items():
        setattr(db_promotion, key, value)
    db.commit()
    db.refresh(db_promotion)
    return db_promotion

def delete_promotion(db: Session, promotion_id: int):
    db_promotion = get_promotion(db, promotion_id)
    db.delete(db_promotion)
    db.commit()
    return db_promotion

# Printer Settings CRUD
def create_printer_settings(db: Session, printer_settings: schemas.PrinterSettingsCreate):
    db_printer_settings = models.PrinterSettings(**printer_settings.dict())
    db.add(db_printer_settings)
    db.commit()
    db.refresh(db_printer_settings)
    return db_printer_settings

def get_printer_settings(db: Session, printer_settings_id: int):
    return db.query(models.PrinterSettings).filter(models.PrinterSettings.id == printer_settings_id).first()

def get_printer_settings_list(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PrinterSettings).offset(skip).limit(limit).all()

def get_default_printer_settings(db: Session):
    return db.query(models.PrinterSettings).filter(models.PrinterSettings.is_default == True).first()

def update_printer_settings(db: Session, printer_settings_id: int, printer_settings: schemas.PrinterSettingsCreate):
    db_printer_settings = get_printer_settings(db, printer_settings_id)
    if db_printer_settings:
        for key, value in printer_settings.dict().items():
            setattr(db_printer_settings, key, value)
        db.commit()
        db.refresh(db_printer_settings)
    return db_printer_settings

def delete_printer_settings(db: Session, printer_settings_id: int):
    db_printer_settings = get_printer_settings(db, printer_settings_id)
    if db_printer_settings:
        db.delete(db_printer_settings)
        db.commit()
    return db_printer_settings

# Receipt Template CRUD
def create_receipt_template(db: Session, receipt_template: schemas.ReceiptTemplateCreate):
    db_receipt_template = models.ReceiptTemplate(**receipt_template.dict())
    db.add(db_receipt_template)
    db.commit()
    db.refresh(db_receipt_template)
    return db_receipt_template

def get_receipt_template(db: Session, receipt_template_id: int):
    return db.query(models.ReceiptTemplate).filter(models.ReceiptTemplate.id == receipt_template_id).first()

def get_receipt_templates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ReceiptTemplate).offset(skip).limit(limit).all()

def get_active_receipt_template_by_type(db: Session, template_type: str):
    return db.query(models.ReceiptTemplate).filter(
        models.ReceiptTemplate.type == template_type,
        models.ReceiptTemplate.is_active == True
    ).first()

def update_receipt_template(db: Session, receipt_template_id: int, receipt_template: schemas.ReceiptTemplateCreate):
    db_receipt_template = get_receipt_template(db, receipt_template_id)
    if db_receipt_template:
        for key, value in receipt_template.dict().items():
            setattr(db_receipt_template, key, value)
        db.commit()
        db.refresh(db_receipt_template)
    return db_receipt_template

def delete_receipt_template(db: Session, receipt_template_id: int):
    db_receipt_template = get_receipt_template(db, receipt_template_id)
    if db_receipt_template:
        db.delete(db_receipt_template)
        db.commit()
    return db_receipt_template

# Sales Report CRUD
def create_sales_report(db: Session, sales_report: schemas.SalesReportCreate):
    db_sales_report = models.SalesReport(**sales_report.dict())
    db.add(db_sales_report)
    db.commit()
    db.refresh(db_sales_report)
    return db_sales_report

def get_sales_report(db: Session, sales_report_id: int):
    return db.query(models.SalesReport).filter(models.SalesReport.id == sales_report_id).first()

def get_sales_reports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SalesReport).offset(skip).limit(limit).all()

def get_sales_report_by_date(db: Session, report_date: date, report_type: str):
    return db.query(models.SalesReport).filter(
        models.SalesReport.report_date == report_date,
        models.SalesReport.report_type == report_type
    ).first()

def update_sales_report(db: Session, sales_report_id: int, sales_report: schemas.SalesReportCreate):
    db_sales_report = get_sales_report(db, sales_report_id)
    if db_sales_report:
        for key, value in sales_report.dict().items():
            setattr(db_sales_report, key, value)
        db.commit()
        db.refresh(db_sales_report)
    return db_sales_report

def delete_sales_report(db: Session, sales_report_id: int):
    db_sales_report = get_sales_report(db, sales_report_id)
    if db_sales_report:
        db.delete(db_sales_report)
        db.commit()
    return db_sales_report

# Product Performance CRUD
def create_product_performance(db: Session, product_performance: schemas.ProductPerformanceCreate):
    db_product_performance = models.ProductPerformance(**product_performance.dict())
    db.add(db_product_performance)
    db.commit()
    db.refresh(db_product_performance)
    return db_product_performance

def get_product_performance(db: Session, product_performance_id: int):
    return db.query(models.ProductPerformance).filter(models.ProductPerformance.id == product_performance_id).first()

def get_product_performances(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ProductPerformance).offset(skip).limit(limit).all()

def get_product_performance_by_date(db: Session, product_id: int, report_date: date):
    return db.query(models.ProductPerformance).filter(
        models.ProductPerformance.product_id == product_id,
        models.ProductPerformance.report_date == report_date
    ).first()

def update_product_performance(db: Session, product_performance_id: int, product_performance: schemas.ProductPerformanceCreate):
    db_product_performance = get_product_performance(db, product_performance_id)
    if db_product_performance:
        for key, value in product_performance.dict().items():
            setattr(db_product_performance, key, value)
        db.commit()
        db.refresh(db_product_performance)
    return db_product_performance

def delete_product_performance(db: Session, product_performance_id: int):
    db_product_performance = get_product_performance(db, product_performance_id)
    if db_product_performance:
        db.delete(db_product_performance)
        db.commit()
    return db_product_performance

# OrderItem CRUD
def get_order_item(db: Session, order_item_id: int):
    return db.query(models.OrderItem).filter(models.OrderItem.id == order_item_id).first()

def get_order_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.OrderItem).offset(skip).limit(limit).all()

def create_order_item(db: Session, order_item: schemas.OrderItemCreate):
    db_order_item = models.OrderItem(**order_item.dict())
    db.add(db_order_item)
    db.commit()
    db.refresh(db_order_item)
    return db_order_item

def update_order_item(db: Session, order_item_id: int, order_item: schemas.OrderItemCreate):
    db_order_item = get_order_item(db, order_item_id)
    if db_order_item:
        for key, value in order_item.dict().items():
            setattr(db_order_item, key, value)
        db.commit()
        db.refresh(db_order_item)
    return db_order_item

def delete_order_item(db: Session, order_item_id: int):
    db_order_item = get_order_item(db, order_item_id)
    if db_order_item:
        db.delete(db_order_item)
        db.commit()
    return db_order_item 
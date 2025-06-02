from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/coffeeshop")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_tables():
    """Khởi tạo các bảng và dữ liệu mặc định nếu chưa tồn tại"""
    from .models import Base
    Base.metadata.create_all(bind=engine)

def init_staff_roles():
    """Khởi tạo dữ liệu mẫu cho bảng staff_roles nếu chưa có dữ liệu"""
    from .models import StaffRole
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có dữ liệu chưa
        if db.query(StaffRole).first() is None:
            # Tạo các vai trò mặc định
            roles = [
                StaffRole(id=1, name="Quản lý", description="Quản lý toàn bộ hệ thống"),
                StaffRole(id=2, name="Nhân viên phục vụ", description="Phục vụ khách hàng"),
                StaffRole(id=3, name="Nhân viên pha chế", description="Pha chế đồ uống"),
                StaffRole(id=4, name="Thu ngân", description="Xử lý thanh toán")
            ]
            db.add_all(roles)
            db.commit()
    finally:
        db.close()

def init_default_shift():
    """Khởi tạo shift mặc định nếu chưa có shift nào"""
    from .models import Shift
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có shift nào chưa
        existing_shift = db.query(Shift).first()
        if existing_shift is None:
            # Tạo shift mặc định
            now = datetime.utcnow()
            shift = Shift(
                id=1,
                start_time=now,
                end_time=now + timedelta(hours=8),
                status="active",
                is_active=True
            )
            db.add(shift)
            db.commit()
        else:
            # Nếu đã có shift, đảm bảo nó đang active
            if not existing_shift.is_active:
                existing_shift.is_active = True
                existing_shift.status = "active"
                db.commit()
    finally:
        db.close()

def init_default_tables():
    """Khởi tạo bàn mặc định nếu chưa có"""
    from .models import Table
    db = SessionLocal()
    try:
        # Lấy danh sách ID của các bàn đã tồn tại
        existing_ids = {table.id for table in db.query(Table).all()}
        existing_names = {table.name for table in db.query(Table).all()}
        
        # Thêm các bàn mới nếu chưa có
        for i in range(1, 39):
            # Bỏ qua nếu ID đã tồn tại
            if i in existing_ids:
                continue
                
            table_name = f"Bàn {i}"
            # Kiểm tra xem tên bàn đã tồn tại chưa
            if table_name in existing_names:
                # Nếu đã tồn tại, thêm hậu tố số
                suffix = 1
                while f"{table_name}_{suffix}" in existing_names:
                    suffix += 1
                table_name = f"{table_name}_{suffix}"
            
            # Thêm bàn mới
            table = Table(
                id=i,
                name=table_name,
                status="available",
                is_active=True
            )
            db.add(table)
            existing_names.add(table_name)
        
        db.commit()
    finally:
        db.close()

def init_all():
    """Khởi tạo tất cả các bảng và dữ liệu mặc định"""
    init_tables()
    init_staff_roles()
    init_default_shift()
    init_default_tables() 
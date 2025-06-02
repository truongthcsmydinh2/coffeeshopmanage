from .database import SessionLocal, engine, Base
from .models.role import Role
from .models.staff import Staff

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Thêm role quản lý nếu chưa tồn tại
    manager_role = db.query(Role).filter(Role.name == "Quản lý").first()
    if not manager_role:
        manager_role = Role(
            name="Quản lý",
            description="Quản lý cửa hàng"
        )
        db.add(manager_role)
        db.commit()
        db.refresh(manager_role)

    # Thêm nhân viên quản lý nếu chưa tồn tại
    manager = db.query(Staff).filter(Staff.role_id == manager_role.id).first()
    if not manager:
        manager = Staff(
            name="Quản lý",
            role_id=manager_role.id,
            phone="0123456789",
            email="quanly@example.com",
            address="Hà Nội",
            is_active=True
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)

    db.close()

if __name__ == "__main__":
    init_db() 
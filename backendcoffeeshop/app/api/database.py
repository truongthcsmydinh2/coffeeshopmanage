from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from ..database.database import Base, engine

# Lấy thông tin kết nối từ biến môi trường hoặc sử dụng giá trị mặc định
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "coffeeshop")

# Tạo URL kết nối
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Tạo engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Tạo SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency để lấy database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
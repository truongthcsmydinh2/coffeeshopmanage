# Coffee Shop Management System Backend

Hệ thống quản lý quán cafe - Backend API

## Yêu cầu hệ thống

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd backendcoffeeshop
```

2. Tạo và kích hoạt môi trường ảo:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
```

3. Cài đặt các dependencies:
```bash
pip install -r requirements.txt
```

4. Tạo database PostgreSQL:
```sql
CREATE DATABASE cafeshopmanage;
```

5. Cấu hình biến môi trường:
- Tạo file `.env` trong thư mục gốc
- Thêm các biến môi trường sau:
```
DATABASE_URL=postgresql://myvps:abcd1234@localhost:5432/cafeshopmanage
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Chạy ứng dụng

1. Khởi động server:
```bash
uvicorn app.main:app --reload
```

2. Truy cập API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Menu
- `GET /menu-groups/` - Lấy danh sách nhóm món
- `POST /menu-groups/` - Tạo nhóm món mới
- `GET /menu-items/` - Lấy danh sách món
- `POST /menu-items/` - Tạo món mới

### Staff
- `GET /staff/` - Lấy danh sách nhân viên
- `POST /staff/` - Thêm nhân viên mới

### Orders
- `GET /orders/` - Lấy danh sách đơn hàng
- `POST /orders/` - Tạo đơn hàng mới
- `GET /orders/{order_id}` - Lấy chi tiết đơn hàng

### Tables
- `GET /tables/` - Lấy danh sách bàn
- `POST /tables/` - Thêm bàn mới
- `PUT /tables/{table_id}` - Cập nhật thông tin bàn

### Payments
- `POST /payments/` - Tạo thanh toán mới
- `GET /payments/` - Lấy danh sách thanh toán

### Dashboard
- `GET /dashboard/revenue` - Lấy thông tin doanh thu
- `GET /dashboard/cancelled-orders` - Lấy số lượng đơn hủy
- `GET /dashboard/revenue-by-hour` - Lấy doanh thu theo giờ
- `GET /dashboard/revenue-by-group` - Lấy doanh thu theo nhóm món

## Cấu trúc dự án

```
backendcoffeeshop/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   └── database.py
├── requirements.txt
├── .env
└── README.md
```

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Vui lòng tạo issue hoặc pull request để đóng góp.

## Giấy phép

MIT License 
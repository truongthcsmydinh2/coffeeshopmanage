# Hướng dẫn quản lý hình ảnh - Coffee Shop App

## 📁 Cấu trúc thư mục

```
/home/vps/coffeeshopmanage/image/
└── images/           # Thư mục chứa hình ảnh menu items
```

## 📤 Upload hình ảnh

### Cách 1: Upload trực tiếp vào server

```bash
# Vào thư mục images
cd /home/vps/coffeeshopmanage/image/images/

# Upload file (ví dụ bằng scp từ máy local)
scp /path/to/image.jpg user@server:/home/vps/coffeeshopmanage/image/images/
```

### Cách 2: Copy từ thư mục khác

```bash
# Copy tất cả images từ nguồn khác
cp /path/to/old/images/* /home/vps/coffeeshopmanage/image/images/
```

## 🖼️ Quy tắc đặt tên file

Hình ảnh phải có tên trùng với **mã món** (code) trong database:

**Ví dụ:**
- Món có `code = "CF001"` → File: `CF001.jpg` hoặc `CF001.png`
- Món có `code = "TRASUA01"` → File: `TRASUA01.jpg` hoặc `TRASUA01.png`

**Định dạng hỗ trợ:**
- `.jpg` / `.jpeg`
- `.png`
- `.webp`

## 🔍 Kiểm tra hình ảnh

### Xem danh sách images hiện có:
```bash
ls -lah /home/vps/coffeeshopmanage/image/images/
```

### Test một image cụ thể:
```bash
# Thay CF001 bằng code món của bạn
curl -I http://localhost:8000/image/images/CF001.jpg
```

### Xem trong browser:
```
http://YOUR_SERVER_IP:8000/image/images/CF001.jpg
```

## 📋 Lấy danh sách codes từ database

Để biết cần upload images cho những món nào:

```bash
# Vào backend container
docker exec -it coffeeshopmanage_backend_1 python3 -c "
from app.database.database import engine
from sqlalchemy import text
conn = engine.connect()
result = conn.execute(text('SELECT code, name FROM menu_items ORDER BY code'))
for row in result:
    print(f'{row[0]} - {row[1]}')
"
```

Hoặc query trực tiếp PostgreSQL:

```bash
docker exec -it coffeeshopmanage_db_1 psql -U postgres -d coffeeshop -c "SELECT code, name FROM menu_items ORDER BY code LIMIT 20;"
```

## 🔄 Sau khi upload

Hình ảnh sẽ **tự động hiển thị** ngay lập tức, không cần restart Docker vì thư mục được mount trực tiếp.

## 📝 Lưu ý

1. **File name phải khớp với code**: Case-sensitive (phân biệt chữ hoa/thường)
2. **Permissions**: Đảm bảo files có quyền đọc
   ```bash
   chmod 644 /home/vps/coffeeshopmanage/image/images/*
   ```
3. **Backup**: Nên backup thư mục images thường xuyên
   ```bash
   tar -czf images-backup-$(date +%Y%m%d).tar.gz /home/vps/coffeeshopmanage/image/images/
   ```

## 🎯 Ví dụ hoàn chỉnh

```bash
# 1. Kiểm tra xem món có code gì
docker exec -it coffeeshopmanage_backend_1 python3 -c "
from app.database.database import engine
from sqlalchemy import text
conn = engine.connect()
result = conn.execute(text(\"SELECT code, name FROM menu_items WHERE name LIKE '%cà phê%' LIMIT 5\"))
for row in result:
    print(f'{row[0]} - {row[1]}')
"

# 2. Upload ảnh với tên đúng code
# Giả sử code là "CF001"
# Copy/upload file CF001.jpg vào /home/vps/coffeeshopmanage/image/images/

# 3. Test xem ảnh đã hiển thị chưa
curl -I http://localhost:8000/image/images/CF001.jpg

# 4. Mở browser và test
# http://YOUR_IP:8000/image/images/CF001.jpg
```

## 🐛 Troubleshooting

### Hình ảnh không hiển thị?

1. **Kiểm tra file tồn tại:**
   ```bash
   ls -la /home/vps/coffeeshopmanage/image/images/CF001.jpg
   ```

2. **Kiểm tra permissions:**
   ```bash
   chmod 644 /home/vps/coffeeshopmanage/image/images/*
   ```

3. **Kiểm tra trong container:**
   ```bash
   docker exec coffeeshopmanage_backend_1 ls -la /app/image/images/
   ```

4. **Check logs:**
   ```bash
   docker-compose logs backend | grep -i image
   ```

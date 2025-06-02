from app.database.database import engine
import pymysql

# Hàm thêm cột image_url vào bảng menu_groups nếu chưa tồn tại
def add_image_url_column():
    try:
        conn = engine.raw_connection()
        cursor = conn.cursor()
        
        # Kiểm tra xem cột image_url đã tồn tại chưa
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'menu_groups' 
            AND COLUMN_NAME = 'image_url'
        """)
        
        column_exists = cursor.fetchone()[0] > 0
        
        if not column_exists:
            print("Thêm cột image_url vào bảng menu_groups...")
            cursor.execute("""
                ALTER TABLE menu_groups
                ADD COLUMN image_url VARCHAR(255) NULL
            """)
            conn.commit()
            print("Đã thêm cột image_url thành công!")
        else:
            print("Cột image_url đã tồn tại!")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Lỗi: {e}")

if __name__ == "__main__":
    add_image_url_column() 
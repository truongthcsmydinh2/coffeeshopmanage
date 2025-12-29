#!/usr/bin/env python3
"""
Migrate data from MySQL to PostgreSQL with proper order and schema handling
"""
import pymysql
import psycopg2
from psycopg2.extras import execute_batch
import sys

# Database connections
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'coffee_user',
    'password': 'Coffee@Password123',
    'database': 'coffee_shop',
    'charset': 'utf8mb4'
}

POSTGRES_CONN = "postgresql://postgres:postgres@localhost:5433/coffeeshop"

# Define migration order (parent tables first)
TABLE_ORDER = [
    'staff_roles',
    'staff',
    'menu_groups',
    'menu_items',
    'tables',
    'shifts',
    'orders',
    'order_items',
    'cancelled_order_items',
    'payments',
    # ... other tables
]

def convert_value(value, column_name):
    """Convert MySQL values to PostgreSQL compatible values"""
    if column_name in ['is_active', 'is_deleted', 'is_available', 'is_admin']:
        return bool(value) if value is not None else None
    return value

def get_table_columns(pg_conn, table_name):
    """Get actual columns that exist in PostgreSQL table"""
    cursor = pg_conn.cursor()
    cursor.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    return [row[0] for row in cursor.fetchall()]

def migrate_table(mysql_conn, pg_conn, table_name):
    """Migrate a single table from MySQL to PostgreSQL"""
    print(f"\n📦 {table_name}")
    
    # Get data from MySQL
    mysql_cursor = mysql_conn.cursor()
    mysql_cursor.execute(f"SELECT * FROM {table_name}")
    rows = mysql_cursor.fetchall()
    
    if not rows:
        print(f"  ⏭️  Empty")
        return True
    
    # Get MySQL column names
    mysql_cursor.execute(f"DESCRIBE {table_name}")
    mysql_columns = [col[0] for col in mysql_cursor.fetchall()]
    
    # Get PostgreSQL column names
    try:
        pg_columns = get_table_columns(pg_conn, table_name)
    except:
        print(f"  ⚠️  Table not found in PostgreSQL, skipping")
        return True
    
    # Find common columns
    common_columns = [col for col in mysql_columns if col in pg_columns]
    
    if not common_columns:
        print(f"  ⚠️  No matching columns")
        return True
    
    print(f"  📊 {len(rows)} rows, {len(common_columns)}/{len(mysql_columns)} columns")
    
    # Prepare PostgreSQL insert
    pg_cursor = pg_conn.cursor()
    
    # Clear existing data
    try:
        pg_cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;")
        pg_conn.commit()
    except:
        try:
            pg_cursor.execute(f"DELETE FROM {table_name};")
            pg_conn.commit()
        except:
            pg_conn.rollback()
    
    # Build insert query with only common columns
    columns_str = ", ".join(common_columns)
    placeholders = ", ".join(["%s"] * len(common_columns))
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
    
    try:
        # Extract only common column values
        mysql_col_indices = [mysql_columns.index(col) for col in common_columns]
        converted_rows = []
        for row in rows:
            converted_row = [
                convert_value(row[idx], common_columns[i]) 
                for i, idx in enumerate(mysql_col_indices)
            ]
            converted_rows.append(tuple(converted_row))
        
        execute_batch(pg_cursor, insert_query, converted_rows)
        pg_conn.commit()
        print(f"  ✅ {len(rows)} rows")
        return True
    except Exception as e:
        print(f"  ❌ {str(e)[:100]}")
        pg_conn.rollback()
        return False

def main():
    try:
        print("="*60)
        print("🔄 MySQL → PostgreSQL Migration")
        print("="*60)
        
        # Connect
        mysql_conn = pymysql.connect(**MYSQL_CONFIG)
        pg_conn = psycopg2.connect(POSTGRES_CONN)
        
        # Get all tables
        cursor = mysql_conn.cursor()
        cursor.execute("SHOW TABLES")
        all_tables = [row[0] for row in cursor.fetchall()]
        
        # Migrate in order
        success = 0
        failed = 0
        
        # First migrate tables in defined order
        for table in TABLE_ORDER:
            if table in all_tables:
                if migrate_table(mysql_conn, pg_conn, table):
                    success += 1
                else:
                    failed += 1
        
        # Then migrate remaining tables
        remaining = [t for t in all_tables if t not in TABLE_ORDER]
        if remaining:
            print("\n" + "="*60)
            print("📋 Remaining tables:")
            for table in remaining:
                if migrate_table(mysql_conn, pg_conn, table):
                    success += 1
                else:
                    failed += 1
        
        mysql_conn.close()
        pg_conn.close()
        
        print("\n" + "="*60)
        print(f"✅ Success: {success} | ❌ Failed: {failed}")
        print("="*60)
        
        if failed == 0:
            print("\n🎉 Migration completed!")
        
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

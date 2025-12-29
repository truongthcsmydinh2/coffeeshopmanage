#!/usr/bin/env python3
"""
Migrate data from SQLite to PostgreSQL
Run this inside the backend container
"""
import sqlite3
import os
import sys

# Add the app directory to sys.path
sys.path.insert(0, '/app')

# Database connections
SQLITE_DB = "/app/coffee_shop.db"

def convert_value(value, column_name):
    """Convert SQLite values to PostgreSQL compatible values"""
    # Handle boolean fields (SQLite stores as 0/1)
    if column_name in ['is_active', 'is_deleted', 'is_available', 'is_admin']:
        return bool(value) if value is not None else None
    # Handle None/NULL
    if value is None:
        return None
    return value

def get_table_data(sqlite_db):
    """Export all data from SQLite"""
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'alembic%';")
    tables = [row[0] for row in cursor.fetchall()]
    
    data = {}
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        data[table] = {'columns': columns, 'rows': rows}
        print(f"Exported {len(rows)} rows from {table}")
    
    conn.close()
    return data

def import_to_postgres(data):
    """Import data to PostgreSQL using SQLAlchemy"""
    from app.database.database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        for table_name, table_data in data.items():
            if not table_data['rows']:
                print(f"Skipping empty table: {table_name}")
                continue
                
            columns = table_data['columns']
            rows = table_data['rows']
            
            # Truncate table
            try:
                conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE"))
                conn.commit()
            except Exception as e:
                print(f"Warning truncating {table_name}: {e}")
                try:
                    conn.execute(text(f"DELETE FROM {table_name}"))
                    conn.commit()  
                except Exception as e2:
                    print(f"Warning deleting from {table_name}: {e2}")
            
            # Insert data with type conversion
            columns_str = ", ".join(columns)
            placeholders = ", ".join([f":{col}" for col in columns])
            insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
            
            try:
                # Convert rows to list of dicts with proper type conversion
                rows_dicts = []
                for row in rows:
                    row_dict = {}
                    for col, val in zip(columns, row):
                        row_dict[col] = convert_value(val, col)
                    rows_dicts.append(row_dict)
                
                conn.execute(text(insert_sql), rows_dicts)
                conn.commit()
                print(f"✅ Imported {len(rows)} rows to {table_name}")
            except Exception as e:
                print(f"❌ Error importing to {table_name}: {e}")
                conn.rollback()

if __name__ == "__main__":
    print("Starting migration...")
    print(f"SQLite DB: {SQLITE_DB}")
    
    if not os.path.exists(SQLITE_DB):
        print(f"Error: SQLite database not found at {SQLITE_DB}")
        sys.exit(1)
    
    # Export from SQLite
    print("\n=== Exporting from SQLite ===")
    data = get_table_data(SQLITE_DB)
    
    # Import to PostgreSQL
    print("\n=== Importing to PostgreSQL ===")
    import_to_postgres(data)
    
    print("\n=== Migration completed! ===")

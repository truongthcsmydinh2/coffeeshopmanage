#!/usr/bin/env python3
"""
Migrate data from SQLite to PostgreSQL
"""
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import sys

# Database connections
SQLITE_DB = "/home/vps/coffeeshopmanage/backendcoffeeshop/coffee_shop.db"
POSTGRES_CONN = "postgresql://postgres:postgres@localhost:5433/coffeeshop"

def get_table_names(sqlite_conn):
    """Get all table names from SQLite"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    return [row[0] for row in cursor.fetchall()]

def migrate_table(sqlite_conn, pg_conn, table_name):
    """Migrate a single table from SQLite to PostgreSQL"""
    print(f"Migrating table: {table_name}")
    
    # Get data from SQLite
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print(f"  -> Table {table_name} is empty, skipping")
        return
    
    # Get column names
    column_names = [description[0] for description in sqlite_cursor.description]
    
    # Prepare PostgreSQL insert
    pg_cursor = pg_conn.cursor()
    
    # Clear existing data
    try:
        pg_cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;")
    except Exception as e:
        print(f"  -> Warning: Could not truncate {table_name}: {e}")
        # Try delete instead
        try:
            pg_cursor.execute(f"DELETE FROM {table_name};")
        except Exception as e2:
            print(f"  -> Warning: Could not delete from {table_name}: {e2}")
    
    # Insert data
    columns_str = ", ".join(column_names)
    placeholders = ", ".join(["%s"] * len(column_names))
    insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
    
    try:
        pg_cursor.executemany(insert_query, rows)
        pg_conn.commit()
        print(f"  -> Migrated {len(rows)} rows")
    except Exception as e:
        print(f"  -> Error migrating {table_name}: {e}")
        pg_conn.rollback()
        raise

def main():
    try:
        # Connect to databases
        print("Connecting to SQLite database...")
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        
        print("Connecting to PostgreSQL database...")
        pg_conn = psycopg2.connect(POSTGRES_CONN)
        
        # Get all tables
        tables = get_table_names(sqlite_conn)
        print(f"Found {len(tables)} tables to migrate: {', '.join(tables)}")
        
        # Migrate each table
        for table in tables:
            try:
                migrate_table(sqlite_conn, pg_conn, table)
            except Exception as e:
                print(f"Failed to migrate {table}: {e}")
                continue
        
        # Close connections
        sqlite_conn.close()
        pg_conn.close()
        
        print("\nMigration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

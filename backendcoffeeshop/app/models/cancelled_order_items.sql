CREATE TABLE cancelled_order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50),
    table_id VARCHAR(50),
    item_id INTEGER,
    item_name VARCHAR(255),
    quantity INTEGER,
    reason TEXT,
    cancelled_by VARCHAR(100),
    cancelled_at TIMESTAMP
); 
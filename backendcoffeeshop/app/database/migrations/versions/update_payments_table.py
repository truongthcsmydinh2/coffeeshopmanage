"""update payments table

Revision ID: update_payments_table
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'update_payments_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Tạo enum PaymentMethod
    payment_method = sa.Enum('cash', 'card', 'momo', 'zalopay', 'vnpay', 'transfer', name='paymentmethod')
    payment_method.create(op.get_bind())
    
    # Tạo enum PaymentStatus
    payment_status = sa.Enum('pending', 'completed', 'failed', 'refunded', name='paymentstatus')
    payment_status.create(op.get_bind())
    
    # Thêm cột method và status mới
    op.add_column('payments', sa.Column('method', payment_method, nullable=True))
    op.add_column('payments', sa.Column('status', payment_status, nullable=True))
    
    # Cập nhật giá trị mặc định cho các bản ghi hiện có
    op.execute("UPDATE payments SET method = 'cash' WHERE method IS NULL")
    op.execute("UPDATE payments SET status = 'completed' WHERE status IS NULL")
    
    # Đặt cột method và status là NOT NULL
    op.alter_column('payments', 'method',
               existing_type=payment_method,
               nullable=False)
    op.alter_column('payments', 'status',
               existing_type=payment_status,
               nullable=False)

def downgrade():
    # Xóa cột method và status
    op.drop_column('payments', 'method')
    op.drop_column('payments', 'status')
    
    # Xóa enum
    op.execute('DROP TYPE paymentmethod')
    op.execute('DROP TYPE paymentstatus') 
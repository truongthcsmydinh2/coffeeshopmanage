from alembic import op
import sqlalchemy as sa

def upgrade():
    # Đổi tên cột staff_id thành staff_id_1
    op.alter_column('orders', 'staff_id', new_column_name='staff_id_1')

def downgrade():
    # Đổi tên cột staff_id_1 thành staff_id
    op.alter_column('orders', 'staff_id_1', new_column_name='staff_id') 
"""rename_staff_id_to_staff_id_1

Revision ID: 62d984559122
Revises: 
Create Date: 2025-06-05 01:15:12.701684

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '62d984559122'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Đổi tên cột staff_id thành staff_id_1 trong bảng orders
    op.alter_column('orders', 'staff_id', new_column_name='staff_id_1', existing_type=sa.Integer())
    
    # Cập nhật các tham chiếu đến staff_id trong các view hoặc trigger (nếu có)


def downgrade() -> None:
    # Đổi tên cột ngược lại từ staff_id_1 thành staff_id 
    op.alter_column('orders', 'staff_id_1', new_column_name='staff_id')

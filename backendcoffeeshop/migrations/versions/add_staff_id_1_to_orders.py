"""add staff_id_1 to orders

Revision ID: add_staff_id_1_to_orders
Revises: dab7a7789450
Create Date: 2024-06-05 01:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_staff_id_1_to_orders'
down_revision = 'dab7a7789450'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Không cần thêm cột staff_id_1 vì đã được thêm bởi migration trước đó
    pass

def downgrade() -> None:
    # Không cần xóa cột staff_id_1 vì sẽ được xử lý bởi migration trước đó
    pass 
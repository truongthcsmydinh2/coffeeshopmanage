from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('order_items', sa.Column('unit_price', sa.Float(), nullable=True))
    op.add_column('order_items', sa.Column('total_price', sa.Float(), nullable=True))

def downgrade():
    op.drop_column('order_items', 'unit_price')
    op.drop_column('order_items', 'total_price') 
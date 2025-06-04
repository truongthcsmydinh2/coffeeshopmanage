"""merge_heads

Revision ID: dab7a7789450
Revises: 62d984559122, bdf24ff56237
Create Date: 2025-06-05 01:21:06.522883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dab7a7789450'
down_revision: Union[str, None] = ('62d984559122', 'bdf24ff56237')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

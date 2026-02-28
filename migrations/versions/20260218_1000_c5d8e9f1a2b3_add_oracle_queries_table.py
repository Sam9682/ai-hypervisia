"""add oracle queries table

Revision ID: c5d8e9f1a2b3
Revises: b4bf46d2c974
Create Date: 2026-02-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c5d8e9f1a2b3'
down_revision = 'b4bf46d2c974'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create oracle_queries table
    op.create_table(
        'oracle_queries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('context', sa.Text(), nullable=True),
        sa.Column('ai_provider', sa.String(length=50), nullable=False, server_default='kiro'),
        sa.Column('processing_time', sa.Float(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_oracle_queries_id'), 'oracle_queries', ['id'], unique=False)
    op.create_index(op.f('ix_oracle_queries_user_id'), 'oracle_queries', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_oracle_queries_user_id'), table_name='oracle_queries')
    op.drop_index(op.f('ix_oracle_queries_id'), table_name='oracle_queries')
    op.drop_table('oracle_queries')

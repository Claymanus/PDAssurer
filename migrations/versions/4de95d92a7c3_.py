"""empty message

Revision ID: 4de95d92a7c3
Revises: 4f4e6f392520
Create Date: 2015-04-19 09:35:27.421441

"""

# revision identifiers, used by Alembic.
revision = '4de95d92a7c3'
down_revision = '4f4e6f392520'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('key_data',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.String(), nullable=True),
    sa.Column('user_id', sa.String(), nullable=True),
    sa.Column('access_key', sa.String(), nullable=True),
    sa.Column('refresh_key', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('key_data')
    ### end Alembic commands ###

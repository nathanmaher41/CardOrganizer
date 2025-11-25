# app/database.py
import os
from sqlmodel import SQLModel, create_engine, Session

# Use DATABASE_URL from env in prod, fallback to local SQLite for dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cardlab.db")

# Neon uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For SQLite we need special connect args, for Postgres we don't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Add pool settings for production PostgreSQL
engine_kwargs = {
    "echo": False,
    "connect_args": connect_args
}

# Add connection pool settings for PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(DATABASE_URL, **engine_kwargs)


def init_db() -> None:
    """
    Create all tables. Call this once at startup.
    """
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    FastAPI dependency that yields a database session.
    """
    with Session(engine) as session:
        yield session
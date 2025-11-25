# app/database.py
import os
from sqlmodel import SQLModel, create_engine, Session

# Use DATABASE_URL from env in prod, fallback to local SQLite for dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cardlab.db")

# For SQLite we need special connect args, for Postgres we don't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


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

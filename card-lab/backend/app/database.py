# app/database.py
from sqlmodel import SQLModel, create_engine, Session

# For now: local SQLite file in the backend folder
DATABASE_URL = "sqlite:///./cardlab.db"

# echo=True prints SQL to console; handy while debugging
engine = create_engine(DATABASE_URL, echo=False)


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

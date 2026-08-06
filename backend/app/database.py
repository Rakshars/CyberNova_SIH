"""
database.py
-----------
SQLAlchemy engine and session factory.

SQLite is used by default (no setup required).
To switch to PostgreSQL, change DATABASE_URL in .env to:
  postgresql+psycopg2://user:password@localhost:5432/soc_db

No other code changes are needed — SQLAlchemy handles the rest.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import get_settings

settings = get_settings()

# For SQLite: enable WAL mode for better concurrent read performance
# connect_args is SQLite-specific and ignored by PostgreSQL
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,   # logs all SQL in development
)

# Enable SQLite foreign key enforcement (off by default in SQLite)
if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that provides a database session per request.
    Automatically closes the session when the request is done.

    Usage in a route:
        def my_endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Create all tables if they don't exist. Called on app startup."""
    from app.models import security_event, incident, user, asset, risk_score, response_action, audit_log  # noqa: F401
    Base.metadata.create_all(bind=engine)

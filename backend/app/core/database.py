from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def ensure_database() -> None:
    """Create the application database if it does not exist.

    When using Supabase the default ``postgres`` database is used directly
    (databases are provisioned from the dashboard), so nothing is created.
    """
    url = make_url(settings.DATABASE_URL)
    db_name = settings.DATABASE_NAME
    if db_name in ("", "postgres"):
        return
    admin_url = url.set(database="postgres")
    try:
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", pool_pre_ping=True)
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": db_name},
            ).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
        admin_engine.dispose()
    except Exception:
        # Connection without CREATE privilege is not fatal here: if the
        # database already exists, the main engine will connect fine.
        pass


def create_tables() -> None:
    from app import models  # noqa: F401  (ensures all models are registered)

    Base.metadata.create_all(bind=engine)


def init_db() -> None:
    ensure_database()
    if settings.AUTO_CREATE_TABLES:
        create_tables()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
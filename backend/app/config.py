"""
config.py
----------
Central configuration using pydantic-settings.
All values come from environment variables or the .env file.
Changing DATABASE_URL to a PostgreSQL URL later requires zero code changes.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Autonomous SOC"
    app_env: str = "development"
    debug: bool = True

    # Database — defaults to SQLite; override with PostgreSQL URL in .env
    database_url: str = "sqlite:///./autonomous_soc.db"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ML settings
    contamination_rate: float = 0.08   # expected anomaly fraction for Isolation Forest
    risk_threshold: int = 40            # minimum score to classify an event as an incident

    # Secret
    secret_key: str = "change-me-before-deployment"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance. Use as a FastAPI dependency."""
    return Settings()

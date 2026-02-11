"""Application configuration via environment variables."""

from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./mathrumble.db"

    # Game defaults
    WIN_THRESHOLD: int = 10
    ROUND_DURATION: int = 120  # seconds
    MAX_PLAYERS_PER_TEAM: int = 5
    QUESTION_TIME_LIMIT_EASY: int = 15
    QUESTION_TIME_LIMIT_MEDIUM: int = 12
    QUESTION_TIME_LIMIT_HARD: int = 10
    QUESTION_TIME_LIMIT_EXTREME: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

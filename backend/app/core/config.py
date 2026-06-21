from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Alterect API"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/alterect"
    USE_SQLITE: bool = True
    REDIS_URL: str = "redis://localhost:6379/0"

    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "alterect-drawings"
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: Optional[str] = None

    SLACK_CLIENT_ID: Optional[str] = None
    SLACK_CLIENT_SECRET: Optional[str] = None
    DROPBOX_CLIENT_ID: Optional[str] = None
    DROPBOX_CLIENT_SECRET: Optional[str] = None
    BOX_CLIENT_ID: Optional[str] = None
    BOX_CLIENT_SECRET: Optional[str] = None
    PROCORE_CLIENT_ID: Optional[str] = None
    PROCORE_CLIENT_SECRET: Optional[str] = None
    BIM360_CLIENT_ID: Optional[str] = None
    BIM360_CLIENT_SECRET: Optional[str] = None

    OAUTH_REDIRECT_BASE: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    JWT_SECRET: str = "alterect-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 72

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://alterect.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

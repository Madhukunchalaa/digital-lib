from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shoot @ Sight Weddings Portal API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "madtech_super_secret_jwt_key_shoot_at_sight_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # PostgreSQL + pgvector
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/shootatsight_db"
    
    # Redis for Celery background processing
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cloudflare R2 / S3 Storage Settings
    R2_ACCOUNT_ID: Optional[str] = "your_cloudflare_account_id"
    R2_ACCESS_KEY_ID: Optional[str] = "your_r2_access_key"
    R2_SECRET_ACCESS_KEY: Optional[str] = "your_r2_secret_key"
    R2_BUCKET_NAME: str = "shootatsight-photos"
    R2_PUBLIC_DOMAIN: Optional[str] = "https://pub-photos.shootatsight.com"
    
    class Config:
        env_file = ".env"

settings = Settings()

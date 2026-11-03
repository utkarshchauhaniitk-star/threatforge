from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    DATABASE_URL: str = Field(default="sqlite:///./threatforge.db")
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    MAX_UPLOAD_SIZE_MB: int = Field(default=10)
    API_TITLE: str = "ThreatForge Security Monitoring API"
    API_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()

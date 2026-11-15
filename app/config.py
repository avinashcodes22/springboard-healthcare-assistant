from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI-Driven Healthcare Assistance Platform"
    app_version: str = "0.4.0"

    uploads_dir: Path = PROJECT_ROOT / "uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024

    database_host: str = "127.0.0.1"
    database_port: int = 5433
    database_name: str = "healthcare_db"
    database_user: str = "healthcare_user"
    postgres_password: SecretStr

    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.database_user,
            password=self.postgres_password.get_secret_value(),
            host=self.database_host,
            port=self.database_port,
            database=self.database_name,
        )


settings = Settings()

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://pelintir:pelintir@localhost:5432/pelintir"
    meili_url: str = "http://localhost:7700"
    meili_master_key: str = "masterKey"

    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:3001"])

    db_pool_min_size: int = 1
    db_pool_max_size: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()

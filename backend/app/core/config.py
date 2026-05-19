from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List, Optional
from pathlib import Path

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "NexusAI"
    VERSION: str = "0.1.0"
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Frontend CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return [self.FRONTEND_URL]

    # AI Providers
    GROQ_API_KEY: str
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    DEFAULT_LLM_PROVIDER: str = "groq"
    DEFAULT_MODEL: str = "llama-3.1-70b-versatile"

    # Database
    DATABASE_URL: str = "sqlite:///./data/nexusai.db"

    # Rate Limiting
    RATE_LIMIT_TEXT: str = "30/minute"
    RATE_LIMIT_FILE: str = "10/minute"
    RATE_LIMIT_HEAVY: str = "5/minute"

    # File Upload Limits (bytes)
    MAX_AUDIO_SIZE: int = 26214400      # 25MB
    MAX_IMAGE_SIZE: int = 10485760      # 10MB
    MAX_CODE_SIZE: int = 5242880        # 5MB
    MAX_DOCUMENT_SIZE: int = 10485760   # 10MB
    MAX_ARCHIVE_SIZE: int = 52428800    # 50MB

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[3] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()  # pyright: ignore[reportCallIssue]

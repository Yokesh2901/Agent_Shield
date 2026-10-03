import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentShield"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./agentshield.db"
    )
    
    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agentshield_super_secret_jwt_key_production_grade_32bytes_min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Laya Engine Settings
    LAYA_MODEL_NAME: str = os.getenv("LAYA_MODEL_NAME", "english")
    LAYA_MIN_CONFIDENCE: float = float(os.getenv("LAYA_MIN_CONFIDENCE", "0.75"))
    LAYA_TIMEOUT_SECONDS: float = float(os.getenv("LAYA_TIMEOUT_SECONDS", "3.0"))
    
    # Optional LLM Fallback (e.g., Ollama or custom endpoint)
    ENABLE_LLM_FALLBACK: bool = os.getenv("ENABLE_LLM_FALLBACK", "false").lower() == "true"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

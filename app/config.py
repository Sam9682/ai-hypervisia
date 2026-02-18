"""Application configuration using Pydantic settings"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email (optional for development)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@hypervisia.org"
    
    # Payment (optional for development)
    STRIPE_API_KEY: str = "sk_test_dummy_key"
    STRIPE_WEBHOOK_SECRET: str = "whsec_dummy_secret"
    PAYPAL_CLIENT_ID: str = "dummy_client_id"
    PAYPAL_CLIENT_SECRET: str = "dummy_client_secret"
    PAYPAL_MODE: str = "sandbox"
    
    # Application
    APP_NAME: str = "HYPERVISIA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://ai-hypervisia:3000"
    
    # File Storage
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # Membership
    ANNUAL_MEMBERSHIP_FEE: float = 50.00
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into a list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Global settings instance
settings = Settings()

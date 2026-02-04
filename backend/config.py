import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder first, then root folder
backend_env = Path(__file__).parent / ".env"
root_env = Path(__file__).parent.parent / ".env"

if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()  # Fallback to default behavior


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USER: str = os.getenv("EMAIL_USER", "")
    EMAIL_PASS: str = os.getenv("EMAIL_PASS", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change_me")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    OTP_EXPIRY_MINUTES: int = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))


settings = Settings()


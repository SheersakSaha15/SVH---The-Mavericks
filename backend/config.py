import os
from pathlib import Path
from dotenv import load_dotenv

# Load single master .env file from root Main Code folder or backend folder
root_env = Path(__file__).parent.parent / ".env"
backend_env = Path(__file__).parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
else:
    load_dotenv(override=True)


class Settings:
    PROJECT_NAME: str = "HealthBridge AI Backend"
    VERSION: str = "1.0.0"
    
    # Teammate's RAG AI Service Endpoint URL
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:5000/api/chat")

    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Government Health Database API (data.gov.in)
    DATA_GOV_IN_API_KEY: str = os.getenv("DATA_GOV_IN_API_KEY", "")
    GOVT_HEALTH_API_URL: str = os.getenv("GOVT_HEALTH_API_URL", "https://api.data.gov.in/resource")
    
    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

    # Telegram Fallback Bot Configuration
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "8856353198:AAHCxBV6YUCAb9toMonRltjtjbuVrOdjwo0")

    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://chnvxtmcrulbpofltfhy.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobnZ4dG1jcnVsYnBvZmx0Zmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2ODU2MTgsImV4cCI6MjEwNDI2MTYxOH0.VgsnZGAKxH2-CsAPkoNxoj0Qar0DC-EbKwX8pjEzwdk")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_TyAmsC9k_OfioBFVDkv3Dw_Wss6RGi0")

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()


from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://dev:dev@localhost:5432/statutelens"
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_agent_id: str = ""
    embedding_model: str = "all-MiniLM-L6-v2"
    cors_origins: list[str] = ["http://localhost:5173"]
    log_level: str = "info"

    class Config:
        env_file = ".env"

settings = Settings()

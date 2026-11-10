from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AI_PORT: int = 8000
    INTERNAL_SERVICE_KEY: str
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    GEMINI_FALLBACK_MODELS: str = "gemini-3.5-flash,gemini-3.8-flash,gemini-3.1-flash-lite"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    CHROMA_PERSIST_DIR: str = "../database/chroma_data"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

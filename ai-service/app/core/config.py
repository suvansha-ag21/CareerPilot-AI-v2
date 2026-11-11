from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AI_PORT: int = 8000
    INTERNAL_SERVICE_KEY: str
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_FALLBACK_MODELS: str = "gemini-flash-lite-latest,gemini-3.1-flash-lite-preview,gemini-3-flash-preview,gemini-3.6-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    CHROMA_PERSIST_DIR: str = "../database/chroma_data"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

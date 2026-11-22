from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AI_PORT: int = 8000
    INTERNAL_SERVICE_KEY: str = "cp_int_7a2c9e4b1d6f803e5a7c9b1d4f6e8a2c"
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_FALLBACK_MODELS: str = "gemini-2.0-flash,gemini-1.5-pro,gemini-1.5-flash-latest"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    CHROMA_PERSIST_DIR: str = "database/chroma_data"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

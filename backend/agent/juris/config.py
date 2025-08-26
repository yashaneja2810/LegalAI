"""
Configuration management for Juris Legal Document Simplification Agent.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Google Cloud Configuration
    gcp_project_id: str = Field(..., env="GCP_PROJECT_ID")
    gcp_location: str = Field(default="us-central1", env="GCP_LOCATION")
    google_application_credentials: Optional[str] = Field(None, env="GOOGLE_APPLICATION_CREDENTIALS")
    
    # Google Cloud Storage
    gcs_bucket_name: str = Field(..., env="GCS_BUCKET_NAME")
    
    # Vertex AI Configuration
    vertex_ai_index_id: str = Field(..., env="VERTEX_AI_INDEX_ID")
    vertex_ai_index_endpoint_id: str = Field(..., env="VERTEX_AI_INDEX_ENDPOINT_ID")
    vertex_ai_embedding_model: str = Field(default="text-embedding-004", env="VERTEX_AI_EMBEDDING_MODEL")
    vertex_ai_chat_model: str = Field(default="gemini-1.5-pro", env="VERTEX_AI_CHAT_MODEL")
    
    # Firestore Configuration
    firestore_collection_chats: str = Field(default="juris_chats", env="FIRESTORE_COLLECTION_CHATS")
    firestore_collection_documents: str = Field(default="juris_documents", env="FIRESTORE_COLLECTION_DOCUMENTS")
    
    # Application Configuration
    max_documents_per_user: int = Field(default=10, env="MAX_DOCUMENTS_PER_USER")
    max_chunk_size: int = Field(default=1000, env="MAX_CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    max_retrieval_results: int = Field(default=5, env="MAX_RETRIEVAL_RESULTS")
    max_chat_history: int = Field(default=20, env="MAX_CHAT_HISTORY")
    
    # FastAPI Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_reload: bool = Field(default=True, env="API_RELOAD")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings


def validate_gcp_credentials() -> bool:
    """Validate that Google Cloud credentials are properly configured."""
    if settings.google_application_credentials:
        return os.path.exists(settings.google_application_credentials)
    
    # Check for default credentials
    try:
        import google.auth
        google.auth.default()
        return True
    except Exception:
        return False


def get_gcs_file_path(user_id: str, session_id: str, filename: str) -> str:
    """Generate GCS file path for uploaded documents."""
    return f"users/{user_id}/sessions/{session_id}/{filename}"


def get_firestore_chat_path(session_id: str) -> str:
    """Generate Firestore path for chat messages."""
    return f"{settings.firestore_collection_chats}/{session_id}/messages"


def get_firestore_document_path(user_id: str, document_id: str) -> str:
    """Generate Firestore path for document metadata."""
    return f"{settings.firestore_collection_documents}/{user_id}/{document_id}"

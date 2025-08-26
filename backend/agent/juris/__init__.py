"""
Juris Legal Document Simplification Agent

A comprehensive AI-powered system for legal document analysis and simplification.
"""

__version__ = "1.0.0"
__author__ = "LegalEase Team"
__description__ = "AI-powered legal document simplification and analysis"

from .config import settings
from .graph import rag_pipeline
from .storage import gcs_manager, firestore_manager
from .retriever import retriever
from .prompts import prompt_manager
from .exceptions import (
    JurisException,
    DocumentProcessingError,
    EmbeddingGenerationError,
    VectorStoreError,
    StorageError,
    ValidationError,
    RateLimitError,
    QuotaExceededError
)

__all__ = [
    "settings",
    "rag_pipeline", 
    "gcs_manager",
    "firestore_manager",
    "retriever",
    "prompt_manager",
    "JurisException",
    "DocumentProcessingError",
    "EmbeddingGenerationError", 
    "VectorStoreError",
    "StorageError",
    "ValidationError",
    "RateLimitError",
    "QuotaExceededError"
]

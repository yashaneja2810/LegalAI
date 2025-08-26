"""
Custom exceptions and error handling for Juris Legal Document Agent.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class JurisException(Exception):
    """Base exception for Juris application."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DocumentProcessingError(JurisException):
    """Exception raised during document processing."""
    pass


class EmbeddingGenerationError(JurisException):
    """Exception raised during embedding generation."""
    pass


class VectorStoreError(JurisException):
    """Exception raised during vector store operations."""
    pass


class StorageError(JurisException):
    """Exception raised during storage operations."""
    pass


class ValidationError(JurisException):
    """Exception raised during input validation."""
    pass


class RateLimitError(JurisException):
    """Exception raised when rate limits are exceeded."""
    pass


class QuotaExceededError(JurisException):
    """Exception raised when quotas are exceeded."""
    pass


# HTTP Exception mappings
def map_exception_to_http(exception: Exception) -> HTTPException:
    """
    Map internal exceptions to HTTP exceptions.
    
    Args:
        exception: Internal exception
        
    Returns:
        HTTPException with appropriate status code
    """
    if isinstance(exception, ValidationError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exception.message
        )
    
    elif isinstance(exception, DocumentProcessingError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Document processing failed: {exception.message}"
        )
    
    elif isinstance(exception, EmbeddingGenerationError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {exception.message}"
        )
    
    elif isinstance(exception, VectorStoreError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector search service unavailable: {exception.message}"
        )
    
    elif isinstance(exception, StorageError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Storage service unavailable: {exception.message}"
        )
    
    elif isinstance(exception, RateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {exception.message}"
        )
    
    elif isinstance(exception, QuotaExceededError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Quota exceeded: {exception.message}"
        )
    
    else:
        # Generic internal server error
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please try again later."
        )


# Validation utilities
class InputValidator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_user_id(user_id: str) -> str:
        """Validate user ID format."""
        if not user_id or not user_id.strip():
            raise ValidationError("User ID cannot be empty")
        
        if len(user_id) > 100:
            raise ValidationError("User ID too long (max 100 characters)")
        
        # Basic sanitization
        user_id = user_id.strip()
        
        # Check for valid characters (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in '-_' for c in user_id):
            raise ValidationError("User ID contains invalid characters")
        
        return user_id
    
    @staticmethod
    def validate_session_id(session_id: str) -> str:
        """Validate session ID format."""
        if not session_id or not session_id.strip():
            raise ValidationError("Session ID cannot be empty")
        
        if len(session_id) > 100:
            raise ValidationError("Session ID too long (max 100 characters)")
        
        session_id = session_id.strip()
        
        if not all(c.isalnum() or c in '-_' for c in session_id):
            raise ValidationError("Session ID contains invalid characters")
        
        return session_id
    
    @staticmethod
    def validate_document_id(document_id: str) -> str:
        """Validate document ID format."""
        if not document_id or not document_id.strip():
            raise ValidationError("Document ID cannot be empty")
        
        if len(document_id) > 100:
            raise ValidationError("Document ID too long (max 100 characters)")
        
        document_id = document_id.strip()
        
        if not all(c.isalnum() or c in '-_' for c in document_id):
            raise ValidationError("Document ID contains invalid characters")
        
        return document_id
    
    @staticmethod
    def validate_question(question: str) -> str:
        """Validate user question."""
        if not question or not question.strip():
            raise ValidationError("Question cannot be empty")
        
        question = question.strip()
        
        if len(question) > 1000:
            raise ValidationError("Question too long (max 1000 characters)")
        
        if len(question) < 3:
            raise ValidationError("Question too short (min 3 characters)")
        
        return question
    
    @staticmethod
    def validate_filename(filename: str) -> str:
        """Validate uploaded filename."""
        if not filename or not filename.strip():
            raise ValidationError("Filename cannot be empty")
        
        filename = filename.strip()
        
        if len(filename) > 255:
            raise ValidationError("Filename too long (max 255 characters)")
        
        # Check for dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        if any(char in filename for char in dangerous_chars):
            raise ValidationError("Filename contains invalid characters")
        
        return filename
    
    @staticmethod
    def validate_file_content(content: bytes, max_size_mb: int = 10) -> bytes:
        """Validate file content."""
        if not content:
            raise ValidationError("File content cannot be empty")
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if len(content) > max_size_bytes:
            raise ValidationError(f"File too large (max {max_size_mb}MB)")
        
        if len(content) < 10:  # Minimum file size
            raise ValidationError("File too small (min 10 bytes)")
        
        return content
    
    @staticmethod
    def validate_file_type(filename: str) -> str:
        """Validate file type by extension."""
        allowed_extensions = {'.pdf', '.txt', '.docx', '.doc'}
        
        filename_lower = filename.lower()
        if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
            raise ValidationError(
                f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return filename


# Rate limiting utilities
class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self.requests = {}  # user_id -> list of timestamps
    
    def check_rate_limit(
        self, 
        user_id: str, 
        max_requests: int = 10, 
        window_minutes: int = 1
    ) -> bool:
        """
        Check if user has exceeded rate limit.
        
        Args:
            user_id: User identifier
            max_requests: Maximum requests allowed
            window_minutes: Time window in minutes
            
        Returns:
            True if within rate limit, False otherwise
        """
        import time
        
        current_time = time.time()
        window_seconds = window_minutes * 60
        
        # Clean old requests
        if user_id in self.requests:
            self.requests[user_id] = [
                req_time for req_time in self.requests[user_id]
                if current_time - req_time < window_seconds
            ]
        else:
            self.requests[user_id] = []
        
        # Check rate limit
        if len(self.requests[user_id]) >= max_requests:
            return False
        
        # Add current request
        self.requests[user_id].append(current_time)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


# Error response models
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    """Error detail model."""
    message: str
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response model."""
    success: bool = False
    error: ErrorDetail
    timestamp: str
    request_id: Optional[str] = None


# Logging utilities
import logging
import traceback
from datetime import datetime

def log_error(
    logger: logging.Logger,
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
):
    """
    Log error with context information.
    
    Args:
        logger: Logger instance
        error: Exception that occurred
        context: Additional context information
        user_id: User ID if available
    """
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "context": context or {},
        "traceback": traceback.format_exc()
    }
    
    logger.error(f"Error occurred: {error_info}")


# Health check utilities
async def check_service_health(service_name: str, check_function) -> Dict[str, Any]:
    """
    Check health of a service.
    
    Args:
        service_name: Name of the service
        check_function: Async function to check service health
        
    Returns:
        Health status dictionary
    """
    try:
        await check_function()
        return {
            "service": service_name,
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "service": service_name,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

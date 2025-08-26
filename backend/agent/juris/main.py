"""
FastAPI main application for Juris Legal Document Simplification Agent.
"""

import os
import uuid
import logging
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from config import settings, validate_gcp_credentials
from graph import rag_pipeline
from storage import firestore_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Pydantic models for request/response
class ChatRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    session_id: str = Field(..., description="Session identifier")
    question: str = Field(..., description="User's question")
    document_id: Optional[str] = Field(None, description="Optional specific document ID")


class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    citations: List[str] = []
    chunks_retrieved: int = 0
    error: Optional[str] = None


class DocumentResponse(BaseModel):
    success: bool
    document_id: Optional[str] = None
    filename: Optional[str] = None
    num_chunks: Optional[int] = None
    text_length: Optional[int] = None
    error: Optional[str] = None


class SummaryResponse(BaseModel):
    success: bool
    summary: Optional[str] = None
    document_id: Optional[str] = None
    filename: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    components: dict = {}
    error: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Juris Legal Document Agent")
    
    # Validate Google Cloud credentials
    if not validate_gcp_credentials():
        logger.error("Google Cloud credentials not properly configured")
        raise RuntimeError("Google Cloud credentials not found or invalid")
    
    logger.info("Google Cloud credentials validated")
    
    # Perform health check
    health_status = await rag_pipeline.health_check()
    if health_status["status"] == "unhealthy":
        logger.error(f"Health check failed: {health_status}")
        raise RuntimeError("Application health check failed")
    
    logger.info("Application startup completed successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Juris Legal Document Agent")


# Create FastAPI app
app = FastAPI(
    title="Juris Legal Document Agent",
    description="AI-powered legal document simplification and analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://legal-ai-gules.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Utility functions
def validate_file_type(filename: str) -> bool:
    """Validate uploaded file type."""
    allowed_extensions = {'.pdf', '.txt', '.docx', '.doc'}
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)


def get_content_type(filename: str) -> str:
    """Get content type from filename."""
    if filename.lower().endswith('.pdf'):
        return 'application/pdf'
    elif filename.lower().endswith(('.docx', '.doc')):
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    elif filename.lower().endswith('.txt'):
        return 'text/plain'
    else:
        return 'application/octet-stream'


# API Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        health_status = await rag_pipeline.health_check()
        return HealthResponse(**health_status)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            error=str(e)
        )


@app.post("/ingest", response_model=DocumentResponse)
async def ingest_document(
    user_id: str = Form(...),
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Ingest a legal document for analysis.
    
    Args:
        user_id: User identifier
        session_id: Session identifier
        file: Uploaded document file (PDF, TXT, DOCX)
    
    Returns:
        Document ingestion result
    """
    try:
        # Validate file type
        if not validate_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload PDF, TXT, or DOCX files."
            )
        
        # Check file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size is 10MB."
            )
        
        # Check if user has too many documents
        user_docs = await firestore_manager.list_user_documents_metadata(user_id)
        if len(user_docs) >= settings.max_documents_per_user:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {settings.max_documents_per_user} documents allowed per user."
            )
        
        # Get content type
        content_type = get_content_type(file.filename)
        
        # Ingest document
        result = await rag_pipeline.ingest_document(
            user_id=user_id,
            session_id=session_id,
            filename=file.filename,
            content=content,
            content_type=content_type
        )
        
        if result["success"]:
            logger.info(f"Document ingested successfully: {result['document_id']}")
            return DocumentResponse(**result)
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document ingestion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Document ingestion failed: {str(e)}"
        )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    Chat with uploaded documents.
    
    Args:
        request: Chat request with user question
    
    Returns:
        AI response with citations
    """
    try:
        # Validate input
        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty."
            )
        
        # Process chat request
        result = await rag_pipeline.chat_with_document(
            user_id=request.user_id,
            session_id=request.session_id,
            question=request.question,
            document_id=request.document_id
        )
        
        if result["success"]:
            logger.info(f"Chat processed successfully for user {request.user_id}")
            return ChatResponse(**result)
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )


@app.post("/summarize", response_model=SummaryResponse)
async def summarize_document(
    user_id: str = Form(...),
    document_id: str = Form(...)
):
    """
    Generate a summary of a document.
    
    Args:
        user_id: User identifier
        document_id: Document identifier
    
    Returns:
        Document summary
    """
    try:
        result = await rag_pipeline.generate_document_summary(
            user_id=user_id,
            document_id=document_id
        )
        
        if result["success"]:
            logger.info(f"Summary generated for document {document_id}")
            return SummaryResponse(**result)
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Summary generation failed: {str(e)}"
        )


@app.get("/documents")
async def list_documents(user_id: str, session_id: Optional[str] = None):
    """
    List documents for a user or session.
    
    Args:
        user_id: User identifier
        session_id: Optional session identifier
    
    Returns:
        List of documents
    """
    try:
        if session_id:
            documents = await rag_pipeline.get_session_documents(user_id, session_id)
        else:
            documents = await firestore_manager.list_user_documents_metadata(user_id)
        
        return {
            "success": True,
            "documents": documents,
            "count": len(documents)
        }
    
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {str(e)}"
        )


@app.get("/chat-history")
async def get_chat_history(session_id: str, limit: Optional[int] = 20):
    """
    Get chat history for a session.
    
    Args:
        session_id: Session identifier
        limit: Maximum number of messages to return
    
    Returns:
        Chat history
    """
    try:
        messages = await firestore_manager.get_chat_history(
            session_id=session_id,
            limit=limit
        )
        
        return {
            "success": True,
            "messages": messages,
            "count": len(messages)
        }
    
    except Exception as e:
        logger.error(f"Failed to get chat history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chat history: {str(e)}"
        )


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, user_id: str):
    """
    Delete a document and all associated data.
    
    Args:
        document_id: Document identifier
        user_id: User identifier
    
    Returns:
        Deletion result
    """
    try:
        result = await rag_pipeline.delete_document(
            user_id=user_id,
            document_id=document_id
        )
        
        if result["success"]:
            logger.info(f"Document deleted: {document_id}")
            return result
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document deletion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Document deletion failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Juris Legal Document Agent API",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )

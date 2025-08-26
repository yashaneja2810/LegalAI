"""
LangChain RAG pipeline for Juris Legal Document Agent.
Orchestrates the retrieval-augmented generation workflow.
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
import logging

from langchain_google_vertexai import ChatVertexAI
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from google.cloud import aiplatform

from config import settings
from retriever import retriever
from storage import firestore_manager
from prompts import prompt_manager
from ingest import ingestion_pipeline

logger = logging.getLogger(__name__)


class JurisRAGPipeline:
    """Complete RAG pipeline for legal document analysis."""
    
    def __init__(self):
        """Initialize the RAG pipeline."""
        # Initialize Vertex AI
        aiplatform.init(
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        # Initialize chat model
        self.chat_model = ChatVertexAI(
            model_name=settings.vertex_ai_chat_model,
            project=settings.gcp_project_id,
            location=settings.gcp_location,
            temperature=0.1,  # Low temperature for consistent legal analysis
            max_output_tokens=2048,
            top_p=0.8,
            top_k=40
        )
    
    async def ingest_document(
        self,
        user_id: str,
        session_id: str,
        filename: str,
        content: bytes,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Ingest a document into the system.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            filename: Original filename
            content: File content as bytes
            content_type: MIME type
            
        Returns:
            Ingestion result
        """
        try:
            logger.info(f"Starting document ingestion: {filename} for user {user_id}")
            
            # Run the ingestion pipeline
            result = await ingestion_pipeline.ingest_document(
                user_id, session_id, filename, content, content_type
            )
            
            # Store chunks and embeddings in the retriever
            await retriever.store_document_chunks(
                result["chunks"],
                result["embeddings"]
            )
            
            logger.info(f"Document ingestion completed: {result['document_id']}")
            
            return {
                "success": True,
                "document_id": result["document_id"],
                "filename": filename,
                "num_chunks": len(result["chunks"]),
                "text_length": len(result["extracted_text"])
            }
            
        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_document_summary(
        self,
        user_id: str,
        document_id: str
    ) -> Dict[str, Any]:
        """
        Generate a summary of a document.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            
        Returns:
            Summary result
        """
        try:
            # Get document metadata
            doc_metadata = await firestore_manager.get_document_metadata(user_id, document_id)
            if not doc_metadata:
                raise ValueError("Document not found")
            
            # Retrieve all chunks for the document
            chunks = await retriever.retrieve_relevant_chunks(
                query="summary overview main points",  # Generic query to get representative chunks
                user_id=user_id,
                document_id=document_id,
                top_k=10  # Get more chunks for summary
            )
            
            if not chunks:
                raise ValueError("No document content found for summary")
            
            # Combine chunk texts for summary
            document_text = "\n\n".join([chunk["text"] for chunk in chunks])
            
            # Generate summary prompt
            summary_prompt = prompt_manager.get_summary_prompt(document_text)
            
            # Generate summary
            response = await self.chat_model.ainvoke([HumanMessage(content=summary_prompt)])
            summary = response.content
            
            # Validate response format
            if not prompt_manager.validate_response_format(summary):
                logger.warning("Generated summary doesn't follow expected format")
            
            return {
                "success": True,
                "summary": summary,
                "document_id": document_id,
                "filename": doc_metadata.get("filename", "unknown")
            }
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def chat_with_document(
        self,
        user_id: str,
        session_id: str,
        question: str,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Chat with documents using RAG.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            question: User's question
            document_id: Optional specific document ID
            
        Returns:
            Chat response
        """
        try:
            logger.info(f"Processing chat question for user {user_id}, session {session_id}")
            
            # Save user message to chat history
            await firestore_manager.save_chat_message(
                session_id=session_id,
                message_type="user",
                content=question
            )
            
            # Retrieve relevant chunks
            chunks = await retriever.retrieve_relevant_chunks(
                query=question,
                user_id=user_id,
                document_id=document_id,
                top_k=settings.max_retrieval_results
            )
            
            # Get chat history for context
            chat_history = await firestore_manager.get_chat_history(
                session_id=session_id,
                limit=settings.max_chat_history
            )
            
            # Generate response
            if chunks:
                response = await self._generate_rag_response(
                    question=question,
                    chunks=chunks,
                    chat_history=chat_history
                )
            else:
                response = prompt_manager.get_no_context_response(question)
            
            # Save assistant response to chat history
            response_metadata = {
                "citations": prompt_manager.format_citations(chunks) if chunks else [],
                "num_chunks_retrieved": len(chunks),
                "document_id": document_id
            }
            
            await firestore_manager.save_chat_message(
                session_id=session_id,
                message_type="assistant",
                content=response,
                metadata=response_metadata
            )
            
            return {
                "success": True,
                "response": response,
                "citations": response_metadata["citations"],
                "chunks_retrieved": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _generate_rag_response(
        self,
        question: str,
        chunks: List[Dict[str, Any]],
        chat_history: List[Dict[str, Any]]
    ) -> str:
        """
        Generate RAG response using retrieved chunks and chat history.
        
        Args:
            question: User's question
            chunks: Retrieved document chunks
            chat_history: Previous chat messages
            
        Returns:
            Generated response
        """
        try:
            # Format context and history
            context = prompt_manager.format_context(chunks)
            history = prompt_manager.format_chat_history(chat_history)
            
            # Choose prompt based on whether there's chat history
            if len(chat_history) > 1:  # More than just the current user message
                prompt = prompt_manager.get_conversation_prompt(question, context, history)
            else:
                prompt = prompt_manager.get_analysis_prompt(question, context)
            
            # Generate response
            response = await self.chat_model.ainvoke([HumanMessage(content=prompt)])
            
            return response.content
            
        except Exception as e:
            logger.error(f"RAG response generation failed: {e}")
            raise
    
    async def get_session_documents(self, user_id: str, session_id: str) -> List[Dict[str, Any]]:
        """
        Get all documents for a session.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            
        Returns:
            List of document metadata
        """
        try:
            # Get all user documents and filter by session
            all_docs = await firestore_manager.list_user_documents_metadata(user_id)
            session_docs = [
                doc for doc in all_docs 
                if doc.get("session_id") == session_id
            ]
            
            return session_docs
            
        except Exception as e:
            logger.error(f"Failed to get session documents: {e}")
            return []
    
    async def delete_document(
        self,
        user_id: str,
        document_id: str
    ) -> Dict[str, Any]:
        """
        Delete a document and all associated data.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            
        Returns:
            Deletion result
        """
        try:
            # Delete from retriever (vector store and text storage)
            await retriever.delete_document(user_id, document_id)
            
            # Get document metadata to find GCS path
            doc_metadata = await firestore_manager.get_document_metadata(user_id, document_id)
            
            if doc_metadata and "gcs_path" in doc_metadata:
                # Delete from GCS
                from storage import gcs_manager
                await gcs_manager.delete_document(doc_metadata["gcs_path"])
            
            # Note: Firestore document metadata is kept for audit trail
            # In production, you might want to mark it as deleted instead
            
            logger.info(f"Document deleted: {document_id}")
            
            return {
                "success": True,
                "document_id": document_id
            }
            
        except Exception as e:
            logger.error(f"Document deletion failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all components.
        
        Returns:
            Health status
        """
        try:
            health_status = {
                "status": "healthy",
                "components": {}
            }
            
            # Check Vertex AI chat model
            try:
                test_response = await self.chat_model.ainvoke([
                    HumanMessage(content="Hello, this is a health check.")
                ])
                health_status["components"]["vertex_ai_chat"] = "healthy"
            except Exception as e:
                health_status["components"]["vertex_ai_chat"] = f"unhealthy: {e}"
                health_status["status"] = "degraded"
            
            # Check Firestore
            try:
                # Simple test query
                await firestore_manager.get_chat_history("health_check", limit=1)
                health_status["components"]["firestore"] = "healthy"
            except Exception as e:
                health_status["components"]["firestore"] = f"unhealthy: {e}"
                health_status["status"] = "degraded"
            
            # Check GCS
            try:
                from storage import gcs_manager
                await gcs_manager.list_user_documents("health_check")
                health_status["components"]["gcs"] = "healthy"
            except Exception as e:
                health_status["components"]["gcs"] = f"unhealthy: {e}"
                health_status["status"] = "degraded"
            
            return health_status
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global instance
rag_pipeline = JurisRAGPipeline()

"""
Google Cloud Storage and Firestore integration for Juris Legal Document Agent.
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from google.cloud import storage
from google.cloud import firestore
from google.cloud.exceptions import NotFound, GoogleCloudError
import logging

from config import settings, get_gcs_file_path, get_firestore_chat_path, get_firestore_document_path

logger = logging.getLogger(__name__)


class GCSManager:
    """Google Cloud Storage manager for document storage."""
    
    def __init__(self):
        """Initialize GCS client."""
        self.client = storage.Client(project=settings.gcp_project_id)
        self.bucket = self.client.bucket(settings.gcs_bucket_name)
    
    async def upload_document(
        self, 
        user_id: str, 
        session_id: str, 
        filename: str, 
        content: bytes,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload document to GCS.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            filename: Original filename
            content: File content as bytes
            content_type: MIME type of the file
            
        Returns:
            GCS blob path
        """
        try:
            blob_path = get_gcs_file_path(user_id, session_id, filename)
            blob = self.bucket.blob(blob_path)
            
            # Set metadata
            blob.metadata = {
                "user_id": user_id,
                "session_id": session_id,
                "original_filename": filename,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "content_type": content_type
            }
            
            # Upload content
            blob.upload_from_string(content, content_type=content_type)
            
            logger.info(f"Document uploaded to GCS: {blob_path}")
            return blob_path
            
        except GoogleCloudError as e:
            logger.error(f"Failed to upload document to GCS: {e}")
            raise
    
    async def download_document(self, blob_path: str) -> Tuple[bytes, Dict[str, Any]]:
        """
        Download document from GCS.
        
        Args:
            blob_path: GCS blob path
            
        Returns:
            Tuple of (content, metadata)
        """
        try:
            blob = self.bucket.blob(blob_path)
            
            if not blob.exists():
                raise NotFound(f"Document not found: {blob_path}")
            
            content = blob.download_as_bytes()
            metadata = blob.metadata or {}
            
            return content, metadata
            
        except GoogleCloudError as e:
            logger.error(f"Failed to download document from GCS: {e}")
            raise
    
    async def delete_document(self, blob_path: str) -> bool:
        """
        Delete document from GCS.
        
        Args:
            blob_path: GCS blob path
            
        Returns:
            True if deleted successfully
        """
        try:
            blob = self.bucket.blob(blob_path)
            blob.delete()
            
            logger.info(f"Document deleted from GCS: {blob_path}")
            return True
            
        except NotFound:
            logger.warning(f"Document not found for deletion: {blob_path}")
            return False
        except GoogleCloudError as e:
            logger.error(f"Failed to delete document from GCS: {e}")
            raise
    
    async def list_user_documents(self, user_id: str, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List documents for a user.
        
        Args:
            user_id: User identifier
            session_id: Optional session identifier to filter by
            
        Returns:
            List of document metadata
        """
        try:
            prefix = f"users/{user_id}/"
            if session_id:
                prefix += f"sessions/{session_id}/"
            
            blobs = self.client.list_blobs(self.bucket, prefix=prefix)
            
            documents = []
            for blob in blobs:
                doc_info = {
                    "blob_path": blob.name,
                    "filename": os.path.basename(blob.name),
                    "size": blob.size,
                    "created": blob.time_created.isoformat() if blob.time_created else None,
                    "updated": blob.updated.isoformat() if blob.updated else None,
                    "metadata": blob.metadata or {}
                }
                documents.append(doc_info)
            
            return documents
            
        except GoogleCloudError as e:
            logger.error(f"Failed to list user documents: {e}")
            raise


class FirestoreManager:
    """Firestore manager for chat history and document metadata."""
    
    def __init__(self):
        """Initialize Firestore client."""
        self.client = firestore.Client(project=settings.gcp_project_id)
    
    async def save_chat_message(
        self, 
        session_id: str, 
        message_type: str, 
        content: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Save chat message to Firestore.
        
        Args:
            session_id: Session identifier
            message_type: 'user' or 'assistant'
            content: Message content
            metadata: Optional metadata (citations, etc.)
            
        Returns:
            Message ID
        """
        try:
            message_id = str(uuid.uuid4())
            
            message_data = {
                "id": message_id,
                "session_id": session_id,
                "type": message_type,
                "content": content,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "metadata": metadata or {}
            }
            
            # Save to Firestore
            doc_ref = self.client.collection(settings.firestore_collection_chats).document(session_id)
            messages_ref = doc_ref.collection("messages").document(message_id)
            messages_ref.set(message_data)
            
            logger.info(f"Chat message saved: {session_id}/{message_id}")
            return message_id
            
        except GoogleCloudError as e:
            logger.error(f"Failed to save chat message: {e}")
            raise
    
    async def get_chat_history(
        self, 
        session_id: str, 
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get chat history for a session.
        
        Args:
            session_id: Session identifier
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of chat messages
        """
        try:
            messages_ref = (
                self.client
                .collection(settings.firestore_collection_chats)
                .document(session_id)
                .collection("messages")
                .order_by("timestamp", direction=firestore.Query.ASCENDING)
            )
            
            if limit:
                messages_ref = messages_ref.limit(limit)
            
            messages = []
            for doc in messages_ref.stream():
                message_data = doc.to_dict()
                messages.append(message_data)
            
            return messages
            
        except GoogleCloudError as e:
            logger.error(f"Failed to get chat history: {e}")
            raise
    
    async def save_document_metadata(
        self, 
        user_id: str, 
        document_id: str, 
        metadata: Dict[str, Any]
    ) -> None:
        """
        Save document metadata to Firestore.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            metadata: Document metadata
        """
        try:
            doc_data = {
                "user_id": user_id,
                "document_id": document_id,
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP,
                **metadata
            }
            
            doc_ref = (
                self.client
                .collection(settings.firestore_collection_documents)
                .document(user_id)
                .collection("documents")
                .document(document_id)
            )
            doc_ref.set(doc_data)
            
            logger.info(f"Document metadata saved: {user_id}/{document_id}")
            
        except GoogleCloudError as e:
            logger.error(f"Failed to save document metadata: {e}")
            raise
    
    async def get_document_metadata(
        self, 
        user_id: str, 
        document_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get document metadata from Firestore.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            
        Returns:
            Document metadata or None if not found
        """
        try:
            doc_ref = (
                self.client
                .collection(settings.firestore_collection_documents)
                .document(user_id)
                .collection("documents")
                .document(document_id)
            )
            
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
            
        except GoogleCloudError as e:
            logger.error(f"Failed to get document metadata: {e}")
            raise
    
    async def list_user_documents_metadata(self, user_id: str) -> List[Dict[str, Any]]:
        """
        List all document metadata for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of document metadata
        """
        try:
            docs_ref = (
                self.client
                .collection(settings.firestore_collection_documents)
                .document(user_id)
                .collection("documents")
                .order_by("created_at", direction=firestore.Query.DESCENDING)
            )
            
            documents = []
            for doc in docs_ref.stream():
                doc_data = doc.to_dict()
                documents.append(doc_data)
            
            return documents
            
        except GoogleCloudError as e:
            logger.error(f"Failed to list user documents metadata: {e}")
            raise


# Global instances
gcs_manager = GCSManager()
firestore_manager = FirestoreManager()

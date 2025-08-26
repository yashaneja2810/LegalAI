"""
Vertex AI Vector Search integration for Juris Legal Document Agent.
Handles embedding storage, retrieval, and similarity search.
"""

import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
import logging

from google.cloud import aiplatform
from google.cloud.aiplatform import MatchingEngineIndex, MatchingEngineIndexEndpoint
from google.cloud.aiplatform_v1 import IndexDatapoint
from langchain_google_vertexai import VertexAIEmbeddings

from config import settings

logger = logging.getLogger(__name__)


class VertexAIVectorStore:
    """Vertex AI Vector Search integration for document embeddings."""
    
    def __init__(self):
        """Initialize Vertex AI Vector Search client."""
        # Initialize Vertex AI
        aiplatform.init(
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        # Initialize embedding model
        self.embeddings = VertexAIEmbeddings(
            model_name=settings.vertex_ai_embedding_model,
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        # Get index and endpoint
        self.index = MatchingEngineIndex(settings.vertex_ai_index_id)
        self.index_endpoint = MatchingEngineIndexEndpoint(settings.vertex_ai_index_endpoint_id)
    
    async def upsert_embeddings(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> List[str]:
        """
        Upsert embeddings to Vertex AI Vector Search.
        
        Args:
            chunks: List of chunk dictionaries with text and metadata
            embeddings: List of embedding vectors
            
        Returns:
            List of datapoint IDs
        """
        try:
            if len(chunks) != len(embeddings):
                raise ValueError("Number of chunks must match number of embeddings")
            
            datapoints = []
            datapoint_ids = []
            
            for chunk, embedding in zip(chunks, embeddings):
                # Generate unique datapoint ID
                datapoint_id = str(uuid.uuid4())
                datapoint_ids.append(datapoint_id)
                
                # Prepare metadata for Vector Search
                # Note: Vertex AI Vector Search has limitations on metadata
                restricted_metadata = {
                    "document_id": chunk["metadata"].get("document_id", ""),
                    "user_id": chunk["metadata"].get("user_id", ""),
                    "session_id": chunk["metadata"].get("session_id", ""),
                    "filename": chunk["metadata"].get("filename", ""),
                    "chunk_index": str(chunk["metadata"].get("chunk_index", 0)),
                    "file_type": chunk["metadata"].get("file_type", ""),
                    "text": chunk["text"][:500]  # Truncate text for metadata
                }
                
                # Create datapoint
                datapoint = IndexDatapoint(
                    datapoint_id=datapoint_id,
                    feature_vector=embedding,
                    restricts=[
                        {"namespace": "user_id", "allow_list": [chunk["metadata"].get("user_id", "")]},
                        {"namespace": "document_id", "allow_list": [chunk["metadata"].get("document_id", "")]},
                    ],
                    crowding_tag=chunk["metadata"].get("document_id", "")
                )
                
                datapoints.append(datapoint)
            
            # Upsert datapoints to the index
            self.index.upsert_datapoints(datapoints=datapoints)
            
            logger.info(f"Upserted {len(datapoints)} embeddings to Vector Search")
            return datapoint_ids
            
        except Exception as e:
            logger.error(f"Failed to upsert embeddings: {e}")
            raise
    
    async def similarity_search(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search in Vertex AI Vector Search.
        
        Args:
            query: Search query
            user_id: User identifier for filtering
            document_id: Optional document ID for filtering
            top_k: Number of results to return
            
        Returns:
            List of search results with text and metadata
        """
        try:
            # Generate query embedding
            query_embedding = await self.embeddings.aembed_query(query)
            
            # Prepare filters
            restricts = [
                {"namespace": "user_id", "allow_list": [user_id]}
            ]
            
            if document_id:
                restricts.append({
                    "namespace": "document_id", 
                    "allow_list": [document_id]
                })
            
            # Perform search
            response = self.index_endpoint.find_neighbors(
                deployed_index_id=settings.vertex_ai_index_id,
                queries=[query_embedding],
                num_neighbors=top_k,
                restricts=restricts
            )
            
            # Process results
            results = []
            if response and len(response) > 0:
                neighbors = response[0]
                
                for neighbor in neighbors:
                    # Extract metadata and text from the neighbor
                    # Note: This is a simplified approach - in practice, you might need
                    # to store additional metadata separately and join it here
                    result = {
                        "id": neighbor.datapoint.datapoint_id,
                        "score": neighbor.distance,
                        "text": "Retrieved text chunk",  # You'll need to implement text retrieval
                        "metadata": {}  # You'll need to implement metadata retrieval
                    }
                    results.append(result)
            
            logger.info(f"Found {len(results)} similar documents for query")
            return results
            
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            raise
    
    async def delete_document_embeddings(
        self,
        user_id: str,
        document_id: str
    ) -> bool:
        """
        Delete all embeddings for a specific document.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            
        Returns:
            True if deletion was successful
        """
        try:
            # Note: Vertex AI Vector Search doesn't have a direct way to delete by metadata
            # This is a limitation of the current API
            # You would need to track datapoint IDs separately and delete them individually
            
            logger.warning("Document embedding deletion not fully implemented due to Vertex AI limitations")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document embeddings: {e}")
            raise


class EnhancedRetriever:
    """Enhanced retriever with fallback mechanisms and better text storage."""
    
    def __init__(self):
        """Initialize the enhanced retriever."""
        self.vector_store = VertexAIVectorStore()
        # In-memory storage for text chunks (for demo purposes)
        # In production, you'd want to use a proper database
        self.text_storage: Dict[str, Dict[str, Any]] = {}
    
    async def store_document_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> List[str]:
        """
        Store document chunks with embeddings and text.
        
        Args:
            chunks: List of chunk dictionaries
            embeddings: List of embedding vectors
            
        Returns:
            List of datapoint IDs
        """
        try:
            # Store embeddings in Vector Search
            datapoint_ids = await self.vector_store.upsert_embeddings(chunks, embeddings)
            
            # Store full text and metadata in memory (or database)
            for i, (chunk, datapoint_id) in enumerate(zip(chunks, datapoint_ids)):
                self.text_storage[datapoint_id] = {
                    "text": chunk["text"],
                    "metadata": chunk["metadata"],
                    "embedding": embeddings[i]
                }
            
            logger.info(f"Stored {len(chunks)} chunks with full text and embeddings")
            return datapoint_ids
            
        except Exception as e:
            logger.error(f"Failed to store document chunks: {e}")
            raise
    
    async def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks for a query.
        
        Args:
            query: Search query
            user_id: User identifier
            document_id: Optional document ID for filtering
            top_k: Number of results to return
            
        Returns:
            List of relevant chunks with full text and metadata
        """
        try:
            # First, try Vector Search
            vector_results = await self.vector_store.similarity_search(
                query, user_id, document_id, top_k
            )
            
            # Enhance results with stored text
            enhanced_results = []
            for result in vector_results:
                datapoint_id = result["id"]
                
                if datapoint_id in self.text_storage:
                    stored_data = self.text_storage[datapoint_id]
                    enhanced_result = {
                        "id": datapoint_id,
                        "score": result["score"],
                        "text": stored_data["text"],
                        "metadata": stored_data["metadata"]
                    }
                    enhanced_results.append(enhanced_result)
                else:
                    # Fallback to basic result
                    enhanced_results.append(result)
            
            # If no results from Vector Search, implement fallback search
            if not enhanced_results and document_id:
                enhanced_results = self._fallback_search(query, user_id, document_id, top_k)
            
            logger.info(f"Retrieved {len(enhanced_results)} relevant chunks")
            return enhanced_results
            
        except Exception as e:
            logger.error(f"Failed to retrieve relevant chunks: {e}")
            raise
    
    def _fallback_search(
        self,
        query: str,
        user_id: str,
        document_id: str,
        top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Fallback search using simple text matching.
        
        Args:
            query: Search query
            user_id: User identifier
            document_id: Document identifier
            top_k: Number of results to return
            
        Returns:
            List of matching chunks
        """
        try:
            query_lower = query.lower()
            matches = []
            
            for datapoint_id, stored_data in self.text_storage.items():
                metadata = stored_data["metadata"]
                
                # Check if chunk belongs to the user and document
                if (metadata.get("user_id") == user_id and 
                    metadata.get("document_id") == document_id):
                    
                    text = stored_data["text"].lower()
                    
                    # Simple keyword matching
                    if any(word in text for word in query_lower.split()):
                        matches.append({
                            "id": datapoint_id,
                            "score": 0.5,  # Default score for fallback
                            "text": stored_data["text"],
                            "metadata": metadata
                        })
            
            # Sort by relevance (simple keyword count)
            matches.sort(key=lambda x: sum(
                x["text"].lower().count(word) for word in query_lower.split()
            ), reverse=True)
            
            return matches[:top_k]
            
        except Exception as e:
            logger.error(f"Fallback search failed: {e}")
            return []
    
    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """
        Delete all data for a document.
        
        Args:
            user_id: User identifier
            document_id: Document identifier
            
        Returns:
            True if deletion was successful
        """
        try:
            # Delete from Vector Search
            await self.vector_store.delete_document_embeddings(user_id, document_id)
            
            # Delete from text storage
            to_delete = []
            for datapoint_id, stored_data in self.text_storage.items():
                metadata = stored_data["metadata"]
                if (metadata.get("user_id") == user_id and 
                    metadata.get("document_id") == document_id):
                    to_delete.append(datapoint_id)
            
            for datapoint_id in to_delete:
                del self.text_storage[datapoint_id]
            
            logger.info(f"Deleted document {document_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise


# Global instance
retriever = EnhancedRetriever()

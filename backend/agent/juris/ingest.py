"""
Document ingestion pipeline for Juris Legal Document Agent.
Handles document upload, text extraction, chunking, and embedding generation.
"""

import io
import uuid
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import logging

# Document processing
import PyPDF2
from docx import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_vertexai import VertexAIEmbeddings

# Google Cloud
from google.cloud import aiplatform

from config import settings
from storage import gcs_manager, firestore_manager

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Document processing and text extraction."""
    
    @staticmethod
    def extract_text_from_pdf(content: bytes) -> Tuple[str, List[str]]:
        """
        Extract text from PDF content.
        
        Args:
            content: PDF file content as bytes
            
        Returns:
            Tuple of (full_text, page_texts)
        """
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            full_text = ""
            page_texts = []
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        # Clean the text
                        cleaned_text = DocumentProcessor._clean_text(page_text)
                        if cleaned_text:
                            full_text += cleaned_text + "\n\n"
                            page_texts.append(cleaned_text)
                        else:
                            page_texts.append("")
                    else:
                        page_texts.append("")
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")
                    page_texts.append("")
            
            return full_text.strip(), page_texts
            
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ValueError(f"Failed to extract text from PDF: {e}")
    
    @staticmethod
    def extract_text_from_docx(content: bytes) -> str:
        """
        Extract text from DOCX content.
        
        Args:
            content: DOCX file content as bytes
            
        Returns:
            Extracted text
        """
        try:
            docx_file = io.BytesIO(content)
            doc = Document(docx_file)
            
            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text.strip())
            
            full_text = "\n".join(text_parts)
            return DocumentProcessor._clean_text(full_text)
            
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            raise ValueError(f"Failed to extract text from DOCX: {e}")
    
    @staticmethod
    def extract_text_from_txt(content: bytes) -> str:
        """
        Extract text from TXT content.
        
        Args:
            content: TXT file content as bytes
            
        Returns:
            Extracted text
        """
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    text = content.decode(encoding)
                    return DocumentProcessor._clean_text(text)
                except UnicodeDecodeError:
                    continue
            
            # If all encodings fail, use utf-8 with error handling
            text = content.decode('utf-8', errors='ignore')
            return DocumentProcessor._clean_text(text)
            
        except Exception as e:
            logger.error(f"TXT extraction error: {e}")
            raise ValueError(f"Failed to extract text from TXT: {e}")
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Clean extracted text.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 2:  # Skip very short lines
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """
        Get file type from filename.
        
        Args:
            filename: File name
            
        Returns:
            File type ('pdf', 'docx', 'txt', or 'unknown')
        """
        suffix = Path(filename).suffix.lower()
        
        if suffix == '.pdf':
            return 'pdf'
        elif suffix in ['.docx', '.doc']:
            return 'docx'
        elif suffix == '.txt':
            return 'txt'
        else:
            return 'unknown'


class DocumentChunker:
    """Document chunking using LangChain's RecursiveCharacterTextSplitter."""
    
    def __init__(self):
        """Initialize the text splitter."""
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.max_chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Chunk text into smaller pieces.
        
        Args:
            text: Text to chunk
            metadata: Optional metadata to include with each chunk
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text.strip():
            return []
        
        try:
            chunks = self.text_splitter.split_text(text)
            
            chunk_docs = []
            for i, chunk in enumerate(chunks):
                if chunk.strip():  # Only include non-empty chunks
                    chunk_metadata = {
                        "chunk_index": i,
                        "chunk_size": len(chunk),
                        **(metadata or {})
                    }
                    
                    chunk_docs.append({
                        "text": chunk.strip(),
                        "metadata": chunk_metadata
                    })
            
            logger.info(f"Created {len(chunk_docs)} chunks from text of length {len(text)}")
            return chunk_docs
            
        except Exception as e:
            logger.error(f"Text chunking error: {e}")
            raise


class EmbeddingGenerator:
    """Generate embeddings using Vertex AI."""
    
    def __init__(self):
        """Initialize Vertex AI embeddings."""
        # Initialize Vertex AI
        aiplatform.init(
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        self.embeddings = VertexAIEmbeddings(
            model_name=settings.vertex_ai_embedding_model,
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        try:
            if not texts:
                return []
            
            # Filter out empty texts
            valid_texts = [text for text in texts if text.strip()]
            if not valid_texts:
                return []
            
            embeddings = await self.embeddings.aembed_documents(valid_texts)
            
            logger.info(f"Generated {len(embeddings)} embeddings")
            return embeddings
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            raise


class DocumentIngestionPipeline:
    """Complete document ingestion pipeline."""
    
    def __init__(self):
        """Initialize the ingestion pipeline."""
        self.processor = DocumentProcessor()
        self.chunker = DocumentChunker()
        self.embedding_generator = EmbeddingGenerator()
    
    async def ingest_document(
        self,
        user_id: str,
        session_id: str,
        filename: str,
        content: bytes,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Complete document ingestion pipeline.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            filename: Original filename
            content: File content as bytes
            content_type: MIME type
            
        Returns:
            Ingestion result with document metadata
        """
        try:
            document_id = str(uuid.uuid4())
            
            # 1. Upload to GCS
            gcs_path = await gcs_manager.upload_document(
                user_id, session_id, filename, content, content_type
            )
            
            # 2. Extract text based on file type
            file_type = self.processor.get_file_type(filename)
            
            if file_type == 'pdf':
                extracted_text, page_texts = self.processor.extract_text_from_pdf(content)
            elif file_type == 'docx':
                extracted_text = self.processor.extract_text_from_docx(content)
                page_texts = [extracted_text]
            elif file_type == 'txt':
                extracted_text = self.processor.extract_text_from_txt(content)
                page_texts = [extracted_text]
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            if not extracted_text.strip():
                raise ValueError("No text could be extracted from the document")
            
            # 3. Chunk the text
            chunk_metadata = {
                "document_id": document_id,
                "user_id": user_id,
                "session_id": session_id,
                "filename": filename,
                "file_type": file_type,
                "gcs_path": gcs_path
            }
            
            chunks = self.chunker.chunk_text(extracted_text, chunk_metadata)
            
            if not chunks:
                raise ValueError("No valid chunks could be created from the document")
            
            # 4. Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = await self.embedding_generator.generate_embeddings(chunk_texts)
            
            # 5. Prepare document metadata
            document_metadata = {
                "document_id": document_id,
                "filename": filename,
                "file_type": file_type,
                "gcs_path": gcs_path,
                "content_type": content_type,
                "text_length": len(extracted_text),
                "num_chunks": len(chunks),
                "num_pages": len(page_texts) if page_texts else 1,
                "session_id": session_id
            }
            
            # 6. Save metadata to Firestore
            await firestore_manager.save_document_metadata(
                user_id, document_id, document_metadata
            )
            
            # 7. Return result for vector store indexing
            result = {
                "document_id": document_id,
                "metadata": document_metadata,
                "chunks": chunks,
                "embeddings": embeddings,
                "extracted_text": extracted_text,
                "page_texts": page_texts
            }
            
            logger.info(f"Document ingestion completed: {document_id}")
            return result
            
        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")
            raise


# Global instance
ingestion_pipeline = DocumentIngestionPipeline()

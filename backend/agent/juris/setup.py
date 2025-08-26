"""
Setup script for Juris Legal Document Agent.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import settings, validate_gcp_credentials
from storage import gcs_manager, firestore_manager


async def setup_gcs_bucket():
    """Setup Google Cloud Storage bucket."""
    try:
        print(f"Setting up GCS bucket: {settings.gcs_bucket_name}")
        
        # Check if bucket exists
        bucket = gcs_manager.client.bucket(settings.gcs_bucket_name)
        if not bucket.exists():
            print(f"Creating bucket: {settings.gcs_bucket_name}")
            bucket = gcs_manager.client.create_bucket(
                settings.gcs_bucket_name,
                location=settings.gcp_location
            )
            print(f"✓ Bucket created: {settings.gcs_bucket_name}")
        else:
            print(f"✓ Bucket already exists: {settings.gcs_bucket_name}")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to setup GCS bucket: {e}")
        return False


async def setup_firestore():
    """Setup Firestore collections."""
    try:
        print("Setting up Firestore collections...")
        
        # Create a test document to initialize collections
        test_doc_ref = firestore_manager.client.collection(
            settings.firestore_collection_chats
        ).document("setup_test")
        
        test_doc_ref.set({
            "test": True,
            "created_at": firestore_manager.client.SERVER_TIMESTAMP
        })
        
        # Delete the test document
        test_doc_ref.delete()
        
        print(f"✓ Firestore collection ready: {settings.firestore_collection_chats}")
        print(f"✓ Firestore collection ready: {settings.firestore_collection_documents}")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to setup Firestore: {e}")
        return False


async def test_vertex_ai():
    """Test Vertex AI connectivity."""
    try:
        print("Testing Vertex AI connectivity...")
        
        from langchain_google_vertexai import VertexAIEmbeddings, ChatVertexAI
        from google.cloud import aiplatform
        
        # Initialize Vertex AI
        aiplatform.init(
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        # Test embeddings
        embeddings = VertexAIEmbeddings(
            model_name=settings.vertex_ai_embedding_model,
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        test_embedding = await embeddings.aembed_query("test")
        print(f"✓ Vertex AI Embeddings working (dimension: {len(test_embedding)})")
        
        # Test chat model
        chat_model = ChatVertexAI(
            model_name=settings.vertex_ai_chat_model,
            project=settings.gcp_project_id,
            location=settings.gcp_location
        )
        
        from langchain.schema import HumanMessage
        response = await chat_model.ainvoke([HumanMessage(content="Hello")])
        print(f"✓ Vertex AI Chat working")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to test Vertex AI: {e}")
        return False


async def validate_environment():
    """Validate environment configuration."""
    print("Validating environment configuration...")
    
    # Check required environment variables
    required_vars = [
        "GCP_PROJECT_ID",
        "GCS_BUCKET_NAME",
        "VERTEX_AI_INDEX_ID",
        "VERTEX_AI_INDEX_ENDPOINT_ID"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not getattr(settings, var.lower(), None):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"✗ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✓ All required environment variables present")
    
    # Check Google Cloud credentials
    if not validate_gcp_credentials():
        print("✗ Google Cloud credentials not properly configured")
        return False
    
    print("✓ Google Cloud credentials validated")
    return True


async def main():
    """Main setup function."""
    print("=" * 50)
    print("Juris Legal Document Agent Setup")
    print("=" * 50)
    
    # Validate environment
    if not await validate_environment():
        print("\n❌ Environment validation failed. Please check your configuration.")
        return False
    
    print("\n" + "=" * 30)
    print("Setting up cloud services...")
    print("=" * 30)
    
    # Setup services
    success = True
    
    # Setup GCS
    if not await setup_gcs_bucket():
        success = False
    
    # Setup Firestore
    if not await setup_firestore():
        success = False
    
    # Test Vertex AI
    if not await test_vertex_ai():
        success = False
    
    print("\n" + "=" * 30)
    print("Setup Summary")
    print("=" * 30)
    
    if success:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Start the server: python main.py")
        print("2. Visit http://localhost:8000/docs for API documentation")
        print("3. Test with a document upload")
    else:
        print("❌ Setup completed with errors. Please check the logs above.")
    
    return success


if __name__ == "__main__":
    asyncio.run(main())

"""
Test script for Juris Legal Document Agent.
"""

import asyncio
import tempfile
import os
from pathlib import Path

# Add current directory to path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from graph import rag_pipeline


async def test_document_ingestion():
    """Test document ingestion pipeline."""
    print("Testing document ingestion...")
    
    # Create a test document
    test_content = """
    RENTAL AGREEMENT
    
    This rental agreement is entered into between John Doe (Landlord) and Jane Smith (Tenant).
    
    TERMS:
    1. Monthly rent is $1,200 due on the 1st of each month
    2. Security deposit of $1,200 is required
    3. Lease term is 12 months starting January 1, 2024
    4. Rent may be increased with 30 days notice
    5. Tenant is responsible for utilities
    6. No pets allowed without written permission
    7. Either party may terminate with 30 days written notice
    
    LATE FEES:
    A late fee of $50 will be charged for rent paid after the 5th of the month.
    
    MAINTENANCE:
    Tenant is responsible for minor repairs under $100.
    Landlord is responsible for major repairs and maintenance.
    """
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file = f.name
        
        # Read file content
        with open(temp_file, 'rb') as f:
            content = f.read()
        
        # Test ingestion
        result = await rag_pipeline.ingest_document(
            user_id="test_user",
            session_id="test_session",
            filename="test_rental_agreement.txt",
            content=content,
            content_type="text/plain"
        )
        
        # Clean up
        os.unlink(temp_file)
        
        if result["success"]:
            print(f"✓ Document ingestion successful")
            print(f"  Document ID: {result['document_id']}")
            print(f"  Chunks created: {result['num_chunks']}")
            return result["document_id"]
        else:
            print(f"✗ Document ingestion failed: {result['error']}")
            return None
            
    except Exception as e:
        print(f"✗ Document ingestion test failed: {e}")
        return None


async def test_document_summary(document_id):
    """Test document summary generation."""
    print("\nTesting document summary...")
    
    try:
        result = await rag_pipeline.generate_document_summary(
            user_id="test_user",
            document_id=document_id
        )
        
        if result["success"]:
            print("✓ Document summary generated successfully")
            print("Summary preview:")
            print("-" * 40)
            print(result["summary"][:200] + "...")
            print("-" * 40)
            return True
        else:
            print(f"✗ Document summary failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"✗ Document summary test failed: {e}")
        return False


async def test_chat_functionality(document_id):
    """Test chat functionality."""
    print("\nTesting chat functionality...")
    
    test_questions = [
        "What is the monthly rent amount?",
        "What are the late fee policies?",
        "Can I have pets in this rental?",
        "How much notice is required for termination?"
    ]
    
    success_count = 0
    
    for question in test_questions:
        try:
            print(f"\nAsking: {question}")
            
            result = await rag_pipeline.chat_with_document(
                user_id="test_user",
                session_id="test_session",
                question=question,
                document_id=document_id
            )
            
            if result["success"]:
                print(f"✓ Response generated ({result['chunks_retrieved']} chunks retrieved)")
                print(f"  Citations: {result['citations']}")
                success_count += 1
            else:
                print(f"✗ Chat failed: {result['error']}")
                
        except Exception as e:
            print(f"✗ Chat test failed: {e}")
    
    print(f"\nChat test results: {success_count}/{len(test_questions)} successful")
    return success_count == len(test_questions)


async def test_health_check():
    """Test health check functionality."""
    print("\nTesting health check...")
    
    try:
        health_status = await rag_pipeline.health_check()
        
        print(f"Overall status: {health_status['status']}")
        
        for component, status in health_status.get('components', {}).items():
            status_icon = "✓" if status == "healthy" else "✗"
            print(f"  {status_icon} {component}: {status}")
        
        return health_status['status'] in ['healthy', 'degraded']
        
    except Exception as e:
        print(f"✗ Health check test failed: {e}")
        return False


async def cleanup_test_data():
    """Clean up test data."""
    print("\nCleaning up test data...")
    
    try:
        # Delete test document
        result = await rag_pipeline.delete_document(
            user_id="test_user",
            document_id="test_document"  # This might not exist, but that's ok
        )
        print("✓ Test data cleanup completed")
        
    except Exception as e:
        print(f"Note: Cleanup encountered an issue (this is normal): {e}")


async def main():
    """Main test function."""
    print("=" * 50)
    print("Juris Legal Document Agent Test Suite")
    print("=" * 50)
    
    test_results = []
    
    # Test health check first
    health_ok = await test_health_check()
    test_results.append(("Health Check", health_ok))
    
    if not health_ok:
        print("\n❌ Health check failed. Skipping other tests.")
        return
    
    # Test document ingestion
    document_id = await test_document_ingestion()
    ingestion_ok = document_id is not None
    test_results.append(("Document Ingestion", ingestion_ok))
    
    if not ingestion_ok:
        print("\n❌ Document ingestion failed. Skipping dependent tests.")
        return
    
    # Test document summary
    summary_ok = await test_document_summary(document_id)
    test_results.append(("Document Summary", summary_ok))
    
    # Test chat functionality
    chat_ok = await test_chat_functionality(document_id)
    test_results.append(("Chat Functionality", chat_ok))
    
    # Clean up
    await cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 30)
    print("Test Results Summary")
    print("=" * 30)
    
    all_passed = True
    for test_name, passed in test_results:
        status_icon = "✓" if passed else "✗"
        print(f"{status_icon} {test_name}: {'PASSED' if passed else 'FAILED'}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 30)
    if all_passed:
        print("🎉 All tests passed! Juris agent is working correctly.")
    else:
        print("❌ Some tests failed. Please check the configuration and logs.")
    
    return all_passed


if __name__ == "__main__":
    asyncio.run(main())

# Juris Legal Document Simplification Agent

Juris is an AI-powered legal document simplification agent that helps users understand complex legal documents through plain-language explanations, risk analysis, and intelligent Q&A.

## Features

- **Document Upload & Processing**: Support for PDF, TXT, and DOCX files
- **AI-Powered Analysis**: Uses Google Vertex AI for embeddings and chat
- **Vector Search**: Efficient document retrieval using Vertex AI Vector Search
- **Plain Language Explanations**: Converts legal jargon into understandable language
- **Risk Identification**: Highlights potential risks and unfair terms
- **Citation System**: Provides exact references to source document sections
- **Persistent Chat**: Conversation history stored in Firestore
- **Cloud Storage**: Documents securely stored in Google Cloud Storage

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   LangChain     │    │  Vertex AI      │
│   Backend       │────│   Pipeline      │────│  (Embeddings    │
│                 │    │                 │    │   & Chat)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firestore     │    │   Vector        │    │   Cloud         │
│   (Chat         │    │   Search        │    │   Storage       │
│   History)      │    │   (Embeddings)  │    │   (Documents)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

- Python 3.10+
- Google Cloud Project with enabled APIs:
  - Vertex AI API
  - Cloud Storage API
  - Firestore API
- Google Cloud SDK installed and configured
- Service account with appropriate permissions

## Google Cloud Setup

### 1. Create Google Cloud Project

```bash
gcloud projects create your-project-id
gcloud config set project your-project-id
```

### 2. Enable Required APIs

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create juris-agent \
    --description="Service account for Juris Legal Agent" \
    --display-name="Juris Agent"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:juris-agent@your-project-id.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:juris-agent@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:juris-agent@your-project-id.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud iam service-accounts keys create juris-service-account.json \
    --iam-account=juris-agent@your-project-id.iam.gserviceaccount.com
```

### 4. Create Cloud Storage Bucket

```bash
gsutil mb gs://your-legal-docs-bucket
```

### 5. Create Vertex AI Vector Search Index

```bash
# Create index (this is a simplified example - see Google Cloud docs for full setup)
gcloud ai indexes create \
    --display-name="juris-legal-docs" \
    --description="Vector index for legal documents" \
    --metadata-schema-uri="gs://google-cloud-aiplatform/schema/metadataschema/default_metadata.yaml" \
    --region=us-central1
```

## Installation

### 1. Clone and Setup

```bash
cd backend/agent/juris
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cp .env.template .env
```

Edit `.env` with your Google Cloud configuration:

```env
# Google Cloud Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/juris-service-account.json

# Google Cloud Storage
GCS_BUCKET_NAME=your-legal-docs-bucket

# Vertex AI Configuration
VERTEX_AI_INDEX_ID=your-vector-search-index-id
VERTEX_AI_INDEX_ENDPOINT_ID=your-vector-search-endpoint-id
VERTEX_AI_EMBEDDING_MODEL=text-embedding-004
VERTEX_AI_CHAT_MODEL=gemini-1.5-pro

# Firestore Configuration
FIRESTORE_COLLECTION_CHATS=juris_chats
FIRESTORE_COLLECTION_DOCUMENTS=juris_documents
```

## Usage

### 1. Start the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 2. API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## API Endpoints

### Document Ingestion

**POST /ingest**

Upload and process a legal document.

```bash
curl -X POST "http://localhost:8000/ingest" \
  -F "user_id=user123" \
  -F "session_id=session456" \
  -F "file=@rental_agreement.pdf"
```

Response:
```json
{
  "success": true,
  "document_id": "doc-uuid",
  "filename": "rental_agreement.pdf",
  "num_chunks": 15,
  "text_length": 5420
}
```

### Chat with Documents

**POST /chat**

Ask questions about uploaded documents.

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "session_id": "session456",
    "question": "Can my rent be increased automatically?",
    "document_id": "doc-uuid"
  }'
```

Response:
```json
{
  "success": true,
  "response": "## Summary\nBased on your rental agreement...",
  "citations": ["rental_agreement.pdf:chunk_5", "rental_agreement.pdf:chunk_8"],
  "chunks_retrieved": 3
}
```

### Document Summary

**POST /summarize**

Generate a comprehensive document summary.

```bash
curl -X POST "http://localhost:8000/summarize" \
  -F "user_id=user123" \
  -F "document_id=doc-uuid"
```

### List Documents

**GET /documents**

List all documents for a user or session.

```bash
curl "http://localhost:8000/documents?user_id=user123&session_id=session456"
```

### Chat History

**GET /chat-history**

Retrieve chat history for a session.

```bash
curl "http://localhost:8000/chat-history?session_id=session456&limit=10"
```

### Health Check

**GET /health**

Check system health status.

```bash
curl "http://localhost:8000/health"
```

## Response Format

All AI responses follow this structured format:

```
## Summary
[Brief overview in 1-2 sentences]

## Key Points
• [Main aspect 1]
• [Main aspect 2]
• [Main aspect 3]

## Risks and Red Flags
• [Potential risk 1]
• [Concerning term 2]

## Suggested Questions
• [Follow-up question 1]
• [Follow-up question 2]

## Citations
• filename.pdf:chunk_1
• filename.pdf:chunk_3

⚠️ This is not legal advice. Consult a qualified attorney for legal guidance.
```

## File Structure

```
backend/agent/juris/
├── main.py              # FastAPI application
├── config.py            # Configuration management
├── storage.py           # GCS and Firestore integration
├── ingest.py            # Document ingestion pipeline
├── retriever.py         # Vector search integration
├── graph.py             # LangChain RAG pipeline
├── prompts.py           # Prompt templates
├── exceptions.py        # Error handling
├── requirements.txt     # Python dependencies
├── .env.template        # Environment template
└── README.md           # This file
```

## Error Handling

The system includes comprehensive error handling:

- **400 Bad Request**: Invalid input or file format
- **422 Unprocessable Entity**: Document processing errors
- **429 Too Many Requests**: Rate limiting
- **503 Service Unavailable**: External service issues
- **500 Internal Server Error**: Unexpected errors

## Security Considerations

- Input validation and sanitization
- File type and size restrictions
- Rate limiting per user
- Secure credential management
- Error message sanitization

## Monitoring and Logging

- Structured logging with context
- Health check endpoints
- Error tracking and reporting
- Performance metrics

## Limitations

- Maximum file size: 10MB
- Supported formats: PDF, TXT, DOCX
- Maximum documents per user: 10 (configurable)
- Rate limiting: 10 requests per minute per user

## Troubleshooting

### Common Issues

1. **Google Cloud Authentication**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   gcloud auth application-default login
   ```

2. **Vector Search Index Not Found**
   - Verify index ID and endpoint ID in .env
   - Ensure index is deployed and ready

3. **Document Processing Errors**
   - Check file format and size
   - Verify file is not corrupted
   - Check logs for specific error details

## Contributing

1. Follow Python PEP 8 style guidelines
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for API changes

## Example Usage Flow

### Complete Workflow Example

```python
import requests
import json

# 1. Upload a document
files = {'file': open('rental_agreement.pdf', 'rb')}
data = {'user_id': 'user123', 'session_id': 'session456'}
response = requests.post('http://localhost:8000/ingest', files=files, data=data)
doc_result = response.json()
document_id = doc_result['document_id']

# 2. Generate document summary
summary_data = {'user_id': 'user123', 'document_id': document_id}
response = requests.post('http://localhost:8000/summarize', data=summary_data)
summary = response.json()['summary']

# 3. Ask questions about the document
chat_data = {
    'user_id': 'user123',
    'session_id': 'session456',
    'question': 'What are the termination conditions?',
    'document_id': document_id
}
response = requests.post('http://localhost:8000/chat', json=chat_data)
answer = response.json()['response']

# 4. Get chat history
response = requests.get(f'http://localhost:8000/chat-history?session_id=session456')
history = response.json()['messages']
```

## Performance Optimization

- **Chunking Strategy**: Optimized chunk size (1000 chars) with overlap (200 chars)
- **Embedding Batching**: Process multiple chunks in batches
- **Caching**: In-memory caching for frequently accessed data
- **Async Processing**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections

## Deployment

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "main.py"]
```

### Cloud Run Deployment

```bash
gcloud run deploy juris-agent \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars GCP_PROJECT_ID=your-project-id
```

## License

This project is licensed under the MIT License.

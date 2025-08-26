# Legal Document AI Backend

This backend uses FastAPI, LangChain, MiniLM, Qdrant, and Gemini 2.5 Flash API to power legal document analysis and Q&A.

## Setup

1. **Clone the repo and navigate to the backend folder:**
   ```sh
   cd backend
   ```
2. **Create a `.env` file:**
   ```sh
   cp .env.example .env
   # Or manually create .env with QDRANT and GEMINI keys
   ```
3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
4. **Run the server:**
   ```sh
   uvicorn main:app --reload
   ```

## Environment Variables
- `QDRANT_API_URL`: Your Qdrant instance URL
- `QDRANT_API_KEY`: Your Qdrant API key
- `GEMINI_API_KEY`: Your Gemini 2.5 Flash API key

## Endpoints
- `POST /upload` — Upload a document (max 3 per user)
- `GET /docs` — List uploaded docs for a user
- `POST /summarize` — Get summary for a doc (to be implemented)
- `POST /chat` — Ask a question about a doc (to be implemented)

## TODO
- Integrate LangChain MiniLM for chunking/embedding
- Store vectors in Qdrant
- Use Gemini for summary and Q&A
- Connect to frontend
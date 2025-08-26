import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
from dotenv import load_dotenv
from langchain_utils import chunk_document, embed_chunks, store_embeddings, search_similar
from gemini_utils import gemini_summarize, gemini_qa
import PyPDF2
import io
import traceback

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

app = FastAPI(title="Legal Document AI Backend")

# Allow CORS for frontend - MUST be at the top
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://legal-ai-gules.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory user-doc tracking for demo (replace with DB in prod)
user_docs = {}

@app.get("/health")
def health():
    return {"status": "ok"}

def extract_text_from_pdf(content: bytes):
    """Extract text from PDF content efficiently and return both full text and per-page texts."""
    try:
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        page_texts = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
                page_texts.append(page_text.strip())
            else:
                page_texts.append("")
        
        # Clean the extracted text
        if text:
            # Remove PDF artifacts and metadata
            lines = text.split('\n')
            cleaned_lines = []
            for line in lines:
                line = line.strip()
                # Skip lines that are likely PDF metadata
                if (line and 
                    not line.startswith('%') and 
                    not line.startswith('obj') and
                    not line.startswith('endobj') and
                    not line.startswith('stream') and
                    not line.startswith('endstream') and
                    not line.startswith('xref') and
                    not line.startswith('trailer') and
                    not line.startswith('startxref') and
                    not line.startswith('<<') and
                    not line.startswith('>>') and
                    not line.startswith('/') and
                    len(line) > 3):  # Skip very short lines
                    cleaned_lines.append(line)
            
            text = '\n'.join(cleaned_lines)
            
            # If we still have mostly PDF metadata, try a different approach
            if len(text) < 100 or text.count('obj') > 10:
                # Fallback: try to get text from the first few pages only
                text = ""
                for i, page in enumerate(pdf_reader.pages[:3]):  # Only first 3 pages
                    page_text = page.extract_text()
                    if page_text:
                        # Simple cleaning
                        page_text = ' '.join(page_text.split())
                        if len(page_text) > 20:  # Only add if meaningful
                            text += page_text + "\n"
        
        return text.strip() if text else "Could not extract readable text from PDF", page_texts
    except Exception as e:
        print(f"PDF extraction error: {str(e)}")
        # Fallback to binary decode for non-PDF files
        return content.decode(errors='ignore'), []

@app.post("/upload")
async def upload_doc(user_id: str = Form(...), file: UploadFile = File(...)):
    # Limit to 3 docs per user
    docs = user_docs.get(user_id, [])
    if len(docs) >= 3:
        raise HTTPException(status_code=400, detail="Max 3 documents allowed per user.")
    
    # Read file content
    content = await file.read()
    
    # Extract text based on file type
    if file.filename.lower().endswith('.pdf'):
        text, page_texts = extract_text_from_pdf(content)
    else:
        text = content.decode(errors='ignore')
        page_texts = [text]
    
    # Save file to disk
    filename = f"uploads/{user_id}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(filename, "wb") as f:
        f.write(content)
    
    # Fast chunking and embedding (optimized for speed)
    chunks = chunk_document(text, chunk_size=400, chunk_overlap=50)  # Smaller chunks = faster
    embeddings = embed_chunks(chunks)

    # Print chunks and embeddings for debugging
    print("\n--- Document Chunks ---")
    for i, chunk in enumerate(chunks):
        print(f"Chunk {i+1}: {chunk[:100]}{'...' if len(chunk) > 100 else ''}")
    print("\n--- Vector Embeddings (first 5 values per chunk) ---")
    for i, emb in enumerate(embeddings):
        print(f"Embedding {i+1}: {emb[:5]} ... (len={len(emb)})")
    
    doc_id = f"{user_id}_{file.filename}"
    
    # Store embeddings in memory
    store_embeddings(user_id, doc_id, chunks, embeddings)
    
    # Add to user docs with extracted text
    docs.append({
        "filename": filename, 
        "name": file.filename, 
        "doc_id": doc_id,
        "extracted_text": text,
        "pages": page_texts
    })
    user_docs[user_id] = docs
    
    return {"message": "File uploaded", "doc": {"name": file.filename, "path": filename, "doc_id": doc_id}}

@app.get("/docs")
def list_docs(user_id: str):
    return {"docs": user_docs.get(user_id, [])}

@app.post("/summarize")
async def summarize(doc_id: str = Form(...), user_id: str = Form(...)):
    try:
        # Get all chunks for this doc
        docs = user_docs.get(user_id, [])
        doc = next((d for d in docs if d['doc_id'] == doc_id), None)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        
        # Use the extracted text directly for summary (not embeddings)
        text = doc.get('extracted_text', '')
        if not text:
            raise HTTPException(status_code=400, detail="No extracted text available for this document.")
        
        # Generate concise summary (max 5 lines)
        summary = await gemini_summarize(text)
        return {"summary": summary}
    except Exception as e:
        print(f"Error in summarize endpoint: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/chat")
async def chat(doc_id: str = Form(...), user_id: str = Form(...), question: str = Form(...)):
    # Retrieve top relevant chunks from memory using vector embeddings
    try:
        chunks = search_similar(user_id, doc_id, question, top_k=5)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    context = '\n'.join(chunks)
    answer = await gemini_qa(context, question)
    # Find page numbers for each chunk (if possible)
    docs = user_docs.get(user_id, [])
    doc = next((d for d in docs if d['doc_id'] == doc_id), None)
    matched_chunks = []
    if doc and 'pages' in doc:
        for chunk in chunks:
            page_num = None
            for i, page_text in enumerate(doc['pages']):
                if chunk.strip()[:20] in page_text:
                    page_num = i + 1
                    break
            matched_chunks.append({
                'text': chunk.strip(),
                'page': page_num or 1
            })
    else:
        for chunk in chunks:
            matched_chunks.append({'text': chunk.strip(), 'page': 1})
    return {"answer": answer, "matched_chunks": matched_chunks}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

minilm_model = SentenceTransformer('all-MiniLM-L6-v2')

# In-memory store: {user_id: {doc_id: [(chunk, embedding), ...]}}
EMBEDDINGS_STORE = {}

def chunk_document(text, chunk_size=800, chunk_overlap=100):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_text(text)

def embed_chunks(chunks):
    return minilm_model.encode(chunks).tolist()

def store_embeddings(user_id, doc_id, chunks, embeddings):
    if user_id not in EMBEDDINGS_STORE:
        EMBEDDINGS_STORE[user_id] = {}
    EMBEDDINGS_STORE[user_id][doc_id] = list(zip(chunks, embeddings))

def search_similar(user_id, doc_id, query, top_k=5):
    if user_id not in EMBEDDINGS_STORE or doc_id not in EMBEDDINGS_STORE[user_id]:
        return []
    doc_chunks = EMBEDDINGS_STORE[user_id][doc_id]
    query_emb = minilm_model.encode([query])[0]
    # Compute cosine similarity
    sims = [
        (chunk, float(np.dot(query_emb, emb) / (np.linalg.norm(query_emb) * np.linalg.norm(emb))))
        for chunk, emb in doc_chunks
    ]
    # Sort by similarity, descending
    sims.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, _ in sims[:top_k]]
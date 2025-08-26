// API utilities for Juris document processing

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Document {
  name: string;
  doc_id: string;
  filename: string;
  extracted_text: string;
  summary?: string;
}

export interface ChatResponse {
  answer: string;
  matched_chunks: Array<{
    text: string;
    page: number;
  }>;
}

export interface UploadResponse {
  message: string;
  doc: {
    name: string;
    path: string;
    doc_id: string;
  };
}

export interface SummaryResponse {
  summary: string;
}

export interface DocumentsResponse {
  docs: Document[];
}

class JurisAPI {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend is running.`);
      }
      throw error;
    }
  }

  async uploadDocument(file: File, userId: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<UploadResponse>(response);
  }

  async getDocuments(userId: string): Promise<DocumentsResponse> {
    return this.makeRequest<DocumentsResponse>(`${API_BASE_URL}/docs?user_id=${userId}`);
  }

  async generateSummary(docId: string, userId: string): Promise<SummaryResponse> {
    const formData = new FormData();
    formData.append("doc_id", docId);
    formData.append("user_id", userId);

    const response = await fetch(`${API_BASE_URL}/summarize`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<SummaryResponse>(response);
  }

  async chatWithDocument(
    docId: string,
    userId: string,
    question: string
  ): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append("doc_id", docId);
    formData.append("user_id", userId);
    formData.append("question", question);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<ChatResponse>(response);
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(`${API_BASE_URL}/health`);
  }
}

export const jurisAPI = new JurisAPI();

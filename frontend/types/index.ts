export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Document {
  id: string;
  name: string;
  summary: string;
  status: 'processing' | 'completed' | 'error';
  doc_id: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}
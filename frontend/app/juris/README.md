# Juris - AI Legal Document Assistant

## Overview

Juris is an AI-powered legal document assistant that allows users to:

1. **Upload PDF Documents** - Upload legal documents (max 3 per user, 10MB each)
2. **Generate AI Summaries** - Get concise summaries of document content using Gemini AI
3. **Chat with Documents** - Ask questions about document content with context-aware responses

## Features

### Document Management
- Drag & drop PDF upload interface
- Document list with status indicators
- Maximum 3 documents per user limit
- File size validation (10MB max)

### AI-Powered Analysis
- **Smart Summarization**: Generates concise 5-line summaries focusing on legal content
- **Contextual Chat**: Ask questions and get answers with referenced document sections
- **Page References**: AI responses include page numbers and text snippets from source material

### User Experience
- **Legal Theme**: Consistent with LegalEase branding and color scheme
- **Real-time Updates**: Live progress indicators for uploads and AI processing
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error messages and fallback states

## Technical Implementation

### Frontend Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom legal theme
- **Radix UI** components for accessibility
- **Sonner** for toast notifications

### Backend Integration
- **FastAPI** backend with CORS support
- **Gemini AI** for summarization and Q&A
- **LangChain** for document processing and embeddings
- **Vector Search** for relevant context retrieval

### API Endpoints
- `POST /upload` - Upload and process PDF documents
- `GET /docs` - Retrieve user's documents
- `POST /summarize` - Generate document summary
- `POST /chat` - Chat with document context

## File Structure

```
frontend/app/juris/
├── page.tsx              # Main Juris component
├── README.md             # This file
frontend/lib/
├── juris-api.ts          # API utility functions
```

## Usage Flow

1. **Authentication**: User must be logged in to access Juris
2. **Upload**: Select and upload PDF documents
3. **Summarize**: Generate AI summary of document content
4. **Chat**: Ask questions about the document and get contextual answers

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

## Error Handling

- File type validation (PDF only)
- File size limits (10MB max)
- Document count limits (3 per user)
- Network error handling with user-friendly messages
- API error responses with detailed feedback

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- High contrast legal color scheme
- Focus indicators and ARIA labels

## Future Enhancements

- Document deletion functionality
- Export chat conversations
- Multiple file format support
- Advanced search within documents
- Document comparison features

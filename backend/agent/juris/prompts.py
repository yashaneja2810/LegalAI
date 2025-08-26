"""
Prompt templates and system messages for Juris Legal Document Agent.
"""

from typing import List, Dict, Any
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage


# System prompt for legal document analysis
LEGAL_ANALYSIS_SYSTEM_PROMPT = """You are Juris, a legal document simplification assistant. Your role is to help users understand complex legal documents by providing clear, plain-language explanations.

CORE RESPONSIBILITIES:
1. Simplify legal jargon into everyday language
2. Identify and highlight potential risks or unfair terms
3. Provide accurate citations from the retrieved document sections
4. Offer helpful follow-up questions
5. Always include a legal disclaimer

RESPONSE GUIDELINES:
- Use simple, conversational language that anyone can understand
- Break down complex legal concepts into digestible explanations
- When explaining risks, be specific about potential consequences
- Always cite the exact text snippets you're referencing
- Focus on practical implications for the user
- If the question is unrelated to legal documents, politely redirect

CRITICAL RULES:
- ALWAYS include citations in the format: [filename:chunk_X]
- ALWAYS end responses with the disclaimer: "⚠️ This is not legal advice. Consult a qualified attorney for legal guidance."
- If you cannot find relevant information in the provided context, say so clearly
- Never make up legal information or provide advice beyond document interpretation

RESPONSE FORMAT:
Your responses should follow this structure:

## Summary
[Brief overview of the answer in 1-2 sentences]

## Key Points
[2-4 bullet points explaining the main aspects]

## Risks and Red Flags
[Highlight any concerning terms or potential issues]

## Suggested Questions
[2-3 follow-up questions the user might want to ask]

## Citations
[List the specific document sections referenced]

⚠️ This is not legal advice. Consult a qualified attorney for legal guidance.
"""

# Template for document analysis with context
DOCUMENT_ANALYSIS_TEMPLATE = """Based on the following document sections, please answer the user's question about their legal document.

DOCUMENT CONTEXT:
{context}

USER QUESTION: {question}

Please provide a comprehensive analysis following the specified format, ensuring you cite specific sections and highlight any risks or important terms the user should be aware of."""

# Template for follow-up questions in conversation
CONVERSATION_TEMPLATE = """You are continuing a conversation about a legal document. Here is the recent chat history:

CHAT HISTORY:
{chat_history}

RELEVANT DOCUMENT SECTIONS:
{context}

USER QUESTION: {question}

Please respond in the same format as before, building on the previous conversation while addressing the new question."""

# Template for document summary generation
SUMMARY_TEMPLATE = """Please provide a comprehensive summary of this legal document. Focus on the key terms, obligations, rights, and any potential risks or red flags.

DOCUMENT TEXT:
{document_text}

Provide a structured summary that helps the user understand:
1. What type of document this is
2. The main parties involved
3. Key obligations and rights
4. Important dates, amounts, or conditions
5. Potential risks or concerning clauses
6. Overall assessment of fairness

Use the standard response format with Summary, Key Points, Risks and Red Flags, Suggested Questions, and Citations."""

# Template for when no relevant context is found
NO_CONTEXT_TEMPLATE = """I couldn't find relevant information in your uploaded documents to answer your question: "{question}"

This might be because:
- The question is about topics not covered in your documents
- The documents don't contain the specific information you're looking for
- You may need to upload additional documents

## Suggested Actions
- Try rephrasing your question with different keywords
- Upload additional documents that might contain the relevant information
- Ask about topics that are typically covered in your document type

## Common Questions for Legal Documents
- What are my main obligations under this agreement?
- What happens if I want to terminate this contract?
- Are there any penalty clauses I should be aware of?
- What are the payment terms and conditions?

⚠️ This is not legal advice. Consult a qualified attorney for legal guidance."""


class PromptManager:
    """Manages prompt templates and formatting for the Juris agent."""
    
    def __init__(self):
        """Initialize prompt templates."""
        self.system_message = SystemMessage(content=LEGAL_ANALYSIS_SYSTEM_PROMPT)
        
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            self.system_message,
            HumanMessage(content=DOCUMENT_ANALYSIS_TEMPLATE)
        ])
        
        self.conversation_prompt = ChatPromptTemplate.from_messages([
            self.system_message,
            HumanMessage(content=CONVERSATION_TEMPLATE)
        ])
        
        self.summary_prompt = ChatPromptTemplate.from_messages([
            self.system_message,
            HumanMessage(content=SUMMARY_TEMPLATE)
        ])
    
    def format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Format retrieved chunks into context for the prompt.
        
        Args:
            chunks: List of retrieved document chunks
            
        Returns:
            Formatted context string
        """
        if not chunks:
            return "No relevant document sections found."
        
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            metadata = chunk.get("metadata", {})
            filename = metadata.get("filename", "unknown")
            chunk_index = metadata.get("chunk_index", i-1)
            
            context_part = f"""
[Section {i} - {filename}:chunk_{chunk_index}]
{chunk.get("text", "")}
"""
            context_parts.append(context_part.strip())
        
        return "\n\n".join(context_parts)
    
    def format_chat_history(self, messages: List[Dict[str, Any]], limit: int = 5) -> str:
        """
        Format chat history for context.
        
        Args:
            messages: List of chat messages
            limit: Maximum number of recent messages to include
            
        Returns:
            Formatted chat history string
        """
        if not messages:
            return "No previous conversation."
        
        # Get recent messages
        recent_messages = messages[-limit:] if len(messages) > limit else messages
        
        history_parts = []
        for msg in recent_messages:
            msg_type = msg.get("type", "unknown")
            content = msg.get("content", "")
            
            if msg_type == "user":
                history_parts.append(f"User: {content}")
            elif msg_type == "assistant":
                # Truncate long assistant responses for context
                truncated_content = content[:300] + "..." if len(content) > 300 else content
                history_parts.append(f"Assistant: {truncated_content}")
        
        return "\n\n".join(history_parts)
    
    def get_analysis_prompt(self, question: str, context: str) -> str:
        """
        Get formatted prompt for document analysis.
        
        Args:
            question: User's question
            context: Formatted document context
            
        Returns:
            Formatted prompt string
        """
        return self.analysis_prompt.format_messages(
            context=context,
            question=question
        )[1].content
    
    def get_conversation_prompt(
        self, 
        question: str, 
        context: str, 
        chat_history: str
    ) -> str:
        """
        Get formatted prompt for conversation continuation.
        
        Args:
            question: User's question
            context: Formatted document context
            chat_history: Formatted chat history
            
        Returns:
            Formatted prompt string
        """
        return self.conversation_prompt.format_messages(
            question=question,
            context=context,
            chat_history=chat_history
        )[1].content
    
    def get_summary_prompt(self, document_text: str) -> str:
        """
        Get formatted prompt for document summary.
        
        Args:
            document_text: Full document text
            
        Returns:
            Formatted prompt string
        """
        return self.summary_prompt.format_messages(
            document_text=document_text
        )[1].content
    
    def get_no_context_response(self, question: str) -> str:
        """
        Get response when no relevant context is found.
        
        Args:
            question: User's question
            
        Returns:
            No context response
        """
        return NO_CONTEXT_TEMPLATE.format(question=question)
    
    def format_citations(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """
        Format citations from retrieved chunks.
        
        Args:
            chunks: List of retrieved document chunks
            
        Returns:
            List of formatted citations
        """
        citations = []
        for chunk in chunks:
            metadata = chunk.get("metadata", {})
            filename = metadata.get("filename", "unknown")
            chunk_index = metadata.get("chunk_index", 0)
            
            citation = f"{filename}:chunk_{chunk_index}"
            if citation not in citations:
                citations.append(citation)
        
        return citations
    
    def validate_response_format(self, response: str) -> bool:
        """
        Validate that response follows the expected format.
        
        Args:
            response: Generated response
            
        Returns:
            True if response is properly formatted
        """
        required_sections = [
            "## Summary",
            "## Key Points", 
            "## Risks and Red Flags",
            "## Suggested Questions",
            "⚠️ This is not legal advice"
        ]
        
        return all(section in response for section in required_sections)


# Global instance
prompt_manager = PromptManager()

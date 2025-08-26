import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
import re

# Load environment variables first
load_dotenv()

GOOGLE_API_KEY = os.getenv('GEMINI_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

LLM_MODEL = "gemini-2.0-flash"
TEMPERATURE = 0.2

# Initialize the Gemini model with explicit API key
llm = ChatGoogleGenerativeAI(
    model=LLM_MODEL,
    google_api_key=GOOGLE_API_KEY,  # Try this parameter name
    temperature=TEMPERATURE,
    max_output_tokens=512
)

async def gemini_summarize(text: str) -> str:
    try:
        messages = [
            SystemMessage(content="You are a legal document expert. Provide a VERY CONCISE summary in maximum 5 lines. Focus ONLY on the legal content, terms, and key points. Ignore PDF structure, metadata, or technical details. Be direct and practical."),
            HumanMessage(content=f"Please summarize this legal document:\n\n{text}")
        ]
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Return a fallback summary if Gemini fails
        return f"This document appears to be a legal document. Key sections include terms, conditions, and obligations. Please ask specific questions about the content."

def format_gemini_answer(answer: str) -> str:
    # Remove repeated **
    answer = re.sub(r'(\*\*)+', '', answer)
    # Ensure headings start on a new line
    answer = re.sub(r'(?m)^([A-Z][^:]+):', r'\n\1:', answer)
    # Ensure bullet points start on a new line
    answer = re.sub(r'\s*([\-*•])\s+', r'\n\1 ', answer)
    # Collapse multiple newlines
    answer = re.sub(r'\n{2,}', '\n\n', answer)
    # Remove leading/trailing whitespace
    answer = answer.strip()
    return answer

async def gemini_qa(context: str, question: str) -> str:
    try:
        messages = [
            SystemMessage(content="You are a legal document expert. Answer questions about legal documents in simple, clear terms. Use clear headings and bullet points if needed. Avoid repeating markdown like **. Structure the answer for readability with spacing. Each heading and bullet point must start on a new line."),
            HumanMessage(content=f"Context from the legal document:\n{context}\n\nQuestion: {question}")
        ]
        response = await llm.ainvoke(messages)
        answer = response.content
        answer = format_gemini_answer(answer)
        return answer
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Return a fallback answer if Gemini fails
        return f"I'm having trouble processing your question right now. Please try again or ask a different question about the document."
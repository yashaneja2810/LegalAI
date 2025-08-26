"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle,
  Scale,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type Document as JurisDocument } from "../../lib/juris-api";

type Document = JurisDocument;

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  matched_chunks?: Array<{ text: string; page: number }>;
}

export default function JurisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Test backend connection first
      testBackendConnection();
      loadCurrentDocument();
    }
  }, [user]);

  const testBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const response = await fetch('http://localhost:8000/health');
      console.log("Health check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Backend connection successful:", data);
      } else {
        const text = await response.text();
        console.error("Health check failed:", text);
        toast.error(`Backend health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Backend connection failed:", error);
      toast.error("Cannot connect to backend. Please ensure the backend server is running on port 8000.");
    }
  };

  const loadCurrentDocument = async () => {
    if (!user) return;

    try {
      console.log('Loading current document for user:', user.id);
      const response = await fetch(`http://localhost:8000/docs?user_id=${user.id}`);
      console.log('Documents response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Documents data received:', data);
        const docs = data.docs || [];
        if (docs.length > 0) {
          // Load the most recent document
          const latestDoc = docs[docs.length - 1];
          setCurrentDoc(latestDoc);
          setSummary(latestDoc.summary || "");

          // Auto-generate summary if not present
          if (!latestDoc.summary) {
            generateSummary(latestDoc);
          }
        }
      } else {
        const text = await response.text();
        console.error('Documents error response:', text);
        toast.error(`Failed to load document: ${response.status}`);
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document - check if backend is running");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    // Check if user already has documents
    console.log('Checking existing documents before upload...');
    try {
      const response = await fetch(`http://localhost:8000/docs?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const existingDocs = data.docs || [];
        console.log('Existing documents:', existingDocs.length);

        if (existingDocs.length >= 3) {
          toast.error("Maximum 3 documents allowed per user. Please delete existing documents first.");
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing documents:', error);
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log('Uploading file:', file.name, 'for user:', user.id);
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Upload data received:', data);
        toast.success("Document uploaded successfully!");

        // Set the uploaded document as current and generate summary
        const newDoc: Document = {
          name: data.doc.name,
          doc_id: data.doc.doc_id,
          filename: data.doc.name,
          extracted_text: "",
          summary: ""
        };

        setCurrentDoc(newDoc);
        setChatMessages([]);
        setSummary("");

        // Auto-generate summary for new document
        setTimeout(() => {
          generateSummary(newDoc);
        }, 1000);
      } else {
        const text = await response.text();
        console.error('Upload error response:', text);

        // Try to parse as JSON to get the error detail
        try {
          const errorData = JSON.parse(text);
          toast.error(`Upload failed: ${errorData.detail || 'Unknown error'}`);
        } catch {
          toast.error(`Upload failed: ${response.status} - ${text}`);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = "";
    }
  };

  const generateSummary = async (doc: Document) => {
    if (!user) return;

    setIsSummarizing(true);
    try {
      // Use URLSearchParams for application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('user_id', user.id);
      params.append('doc_id', doc.doc_id);

      console.log('Sending summary request:', { user_id: user.id, doc_id: doc.doc_id });

      const response = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      console.log('Summary response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Summary error response:', text);
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      console.log('Summary data received:', data);

      // Update the current document with summary
      setSummary(data.summary);

      // Update current doc if it's the same
      if (currentDoc?.doc_id === doc.doc_id) {
        setCurrentDoc({ ...doc, summary: data.summary });
      }

      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error("Summary error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !currentDoc || !user || isChatting) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsChatting(true);

    try {
      // Use URLSearchParams for application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('user_id', user.id);
      params.append('doc_id', currentDoc.doc_id);
      params.append('question', currentMessage);

      console.log('Sending chat request:', { user_id: user.id, doc_id: currentDoc.doc_id, question: currentMessage });

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      console.log('Chat response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Chat error response:', text);
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      console.log('Chat data received:', data);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.answer,
        timestamp: new Date(),
        matched_chunks: data.matched_chunks,
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsChatting(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center legal-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-brown"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen legal-bg-primary flex flex-col overflow-hidden">
      <div className="w-full px-6 py-4 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 legal-icon-bg rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl legal-heading">AI Legal Document Assistant</h1>
              <p className="text-sm text-legal-secondary legal-text">
                Upload PDFs, get summaries, and chat with your documents
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-legal-border text-legal-accent">
            <Sparkles className="w-4 h-4 mr-1" />
            AI Powered
          </Badge>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Column - Document Upload & Summary */}
          <div className="flex flex-col space-y-4 min-h-0">
            {/* Document Upload */}
            <Card className="border-legal-border rounded-xl shadow-legal flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-legal-dark-text flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-legal-border rounded-lg p-4 text-center hover:border-legal-accent transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "cursor-pointer flex flex-col items-center space-y-2",
                      isUploading && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-legal-accent animate-spin" />
                        <p className="text-sm text-legal-secondary">
                          Uploading... {uploadProgress}%
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-legal-accent" />
                        <p className="text-sm text-legal-secondary">
                          Click to upload PDF (max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Current Document */}
                {currentDoc && (
                  <div className="mt-3 p-3 rounded-lg border border-legal-accent bg-legal-beige">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 legal-icon-bg rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-legal-dark-text truncate">
                          {currentDoc.name}
                        </p>
                        <p className="text-xs text-legal-secondary">
                          PDF Document • Ready for analysis
                        </p>
                      </div>
                      {summary && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Analyzed
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Summary */}
            {currentDoc && (
              <Card className="border-legal-border rounded-xl shadow-legal">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-legal-dark-text flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Summary
                    </CardTitle>
                    <Button
                      onClick={() => generateSummary(currentDoc)}
                      disabled={isSummarizing || !!summary}
                      className="btn-legal-primary"
                      size="sm"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : summary ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {summary ? (
                    <div className="bg-legal-beige rounded-xl p-4">
                      <h4 className="font-semibold text-legal-dark-text mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2 text-legal-accent" />
                        Document Analysis
                      </h4>
                      <div className="h-40 overflow-y-auto scrollbar-hide">
                        <p className="text-legal-secondary legal-text leading-relaxed whitespace-pre-wrap pr-2">
                          {summary}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-legal-secondary py-8">
                      <Bot className="w-10 h-10 mx-auto mb-3 text-legal-accent" />
                      <p className="mb-2">AI analysis will appear here</p>
                      <p className="text-sm">Upload a document to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div>
            {currentDoc ? (
              <Card className="border-legal-border rounded-xl shadow-legal">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-legal-dark-text flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with {currentDoc.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-legal-secondary">
                    Ask questions about the document content and get AI-powered answers
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Chat Messages */}
                  <div className="h-96 mb-3 border border-legal-border rounded-xl p-3 overflow-y-auto scrollbar-hide">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-legal-secondary h-full flex flex-col justify-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-legal-accent" />
                        <h3 className="text-lg font-semibold text-legal-dark-text mb-4">
                          Start a conversation
                        </h3>
                        <p className="mb-6">Ask me anything about this document</p>
                        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                          {[
                            'What are the key terms and conditions?',
                            'How can I terminate this agreement?',
                            'What are my main obligations?',
                            'What liability am I exposed to?',
                            'Are there any important deadlines?',
                            'What are the payment terms?'
                          ].map((question) => (
                            <button
                              key={question}
                              onClick={() => {
                                setCurrentMessage(question);
                                setTimeout(() => sendMessage(), 100);
                              }}
                              className="text-left text-sm text-legal-secondary hover:text-legal-dark-text bg-legal-beige/50 hover:bg-legal-beige border border-legal-border rounded-lg p-3 transition-all hover:shadow-sm hover:border-legal-accent"
                            >
                              <span className="text-legal-accent mr-2">•</span>
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-start space-x-3",
                              message.type === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {message.type === "ai" && (
                              <div className="w-8 h-8 legal-icon-bg rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[85%] rounded-xl p-4",
                                message.type === "user"
                                  ? "bg-legal-brown text-white"
                                  : "bg-legal-beige text-legal-dark-text border border-legal-border"
                              )}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              {message.matched_chunks && message.matched_chunks.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-legal-border/30">
                                  <p className="text-xs text-legal-secondary mb-3 font-medium flex items-center">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Referenced sections:
                                  </p>
                                  {message.matched_chunks.slice(0, 2).map((chunk, idx) => (
                                    <div key={idx} className="text-xs bg-white/50 rounded-lg p-3 mb-2 border border-legal-border/20">
                                      <Badge variant="outline" className="text-xs mb-2 border-legal-accent/50 text-legal-accent">
                                        Page {chunk.page || '?'}
                                      </Badge>
                                      <p className="text-legal-secondary leading-relaxed">
                                        {chunk.text.length > 150 ? chunk.text.substring(0, 150) + '...' : chunk.text}
                                      </p>
                                    </div>
                                  ))}
                                  {message.matched_chunks.length > 2 && (
                                    <p className="text-xs text-legal-secondary/60 italic">
                                      +{message.matched_chunks.length - 2} more references
                                    </p>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-legal-secondary/70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            {message.type === "user" && (
                              <div className="w-8 h-8 legal-icon-bg rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 legal-icon-bg rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-legal-beige rounded-xl p-4 border border-legal-border">
                              <div className="flex items-center space-x-2">
                                <Loader2 className="w-4 h-4 animate-spin text-legal-accent" />
                                <p className="text-sm text-legal-secondary">AI is analyzing your question...</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask a question about the document..."
                      className="flex-1 border-legal-border focus:border-legal-accent"
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      disabled={isChatting}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isChatting}
                      className="btn-legal-primary"
                    >
                      {isChatting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-legal-border rounded-xl shadow-legal">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 legal-icon-bg rounded-xl flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-legal-dark-text mb-3">
                      Ready to Chat
                    </h3>
                    <p className="text-legal-secondary max-w-sm mx-auto">
                      Upload a document to start an AI-powered conversation about its content
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { jurisAPI, type Document as JurisDocument } from "../../lib/juris-api";
import BackendConnectionTest from "../../components/BackendConnectionTest";

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Test backend connection first
      testBackendConnection();
      fetchDocuments();
    }
  }, [user]);

  const testBackendConnection = async () => {
    try {
      await jurisAPI.healthCheck();
      console.log("Backend connection successful");
    } catch (error) {
      console.error("Backend connection failed:", error);
      toast.error("Cannot connect to backend. Please ensure the backend server is running on port 8000.");
    }
  };

  const fetchDocuments = async () => {
    if (!user) return [];

    try {
      const response = await fetch(`http://localhost:8000/docs?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.docs || []);
        return data.docs || [];
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    }
    return [];
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const data = await jurisAPI.uploadDocument(file, user.id);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Document uploaded successfully!");
      await fetchDocuments();

      // Auto-select the uploaded document and generate summary
      setTimeout(async () => {
        await fetchDocuments();
        const newDoc = documents.find(doc => doc.doc_id === data.doc.doc_id);
        if (newDoc) {
          setSelectedDoc(newDoc);
          // Auto-generate summary for new document
          if (!newDoc.summary) {
            generateSummary(newDoc);
          }
        }
      }, 500);
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
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('doc_id', doc.doc_id);

      const response = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();

      // Update the document with summary
      setDocuments(prev =>
        prev.map(d =>
          d.doc_id === doc.doc_id
            ? { ...d, summary: data.summary }
            : d
        )
      );

      // Update selected doc if it's the same
      if (selectedDoc?.doc_id === doc.doc_id) {
        setSelectedDoc({ ...doc, summary: data.summary });
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
    if (!currentMessage.trim() || !selectedDoc || !user || isChatting) return;

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
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('doc_id', selectedDoc.doc_id);
      formData.append('question', currentMessage);

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();

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

  const selectDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setChatMessages([]);

    // Auto-generate summary if not present
    if (!doc.summary && doc.doc_id) {
      generateSummary(doc);
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
    <div className="min-h-screen legal-bg-primary">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 legal-icon-bg rounded-2xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl legal-heading">AI Legal Document Assistant</h1>
              <p className="text-legal-secondary legal-text">
                Upload PDFs, get summaries, and chat with your documents
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-legal-border text-legal-accent">
            <Sparkles className="w-4 h-4 mr-1" />
            AI Powered
          </Badge>
        </div>

        {/* Backend Connection Test - Remove in production */}
        <BackendConnectionTest />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Upload & List */}
          <div className="lg:col-span-1">
            <Card className="border-legal-border rounded-2xl shadow-legal">
              <CardHeader>
                <CardTitle className="text-legal-dark-text flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Documents ({documents.length}/3)
                </CardTitle>
                <CardDescription className="text-legal-secondary">
                  Upload and manage your legal documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-legal-border rounded-xl p-6 text-center hover:border-legal-accent transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading || documents.length >= 3}
                  />
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "cursor-pointer flex flex-col items-center space-y-2",
                      (isUploading || documents.length >= 3) && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-legal-accent animate-spin" />
                        <p className="text-sm text-legal-secondary">
                          Uploading... {uploadProgress}%
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-legal-accent" />
                        <p className="text-sm text-legal-secondary">
                          {documents.length >= 3 
                            ? "Maximum 3 documents allowed" 
                            : "Click to upload PDF (max 10MB)"
                          }
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Document List */}
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.doc_id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedDoc?.doc_id === doc.doc_id
                            ? "border-legal-accent bg-legal-beige"
                            : "border-legal-border hover:border-legal-accent hover:bg-legal-beige"
                        )}
                        onClick={() => selectDocument(doc)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-legal-dark-text truncate">
                              {doc.name}
                            </p>
                            {doc.summary && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Summarized
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {selectedDoc ? (
              <div className="space-y-6">
                {/* Document Summary */}
                <Card className="border-legal-border rounded-2xl shadow-legal">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-legal-dark-text flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        {selectedDoc.name}
                      </CardTitle>
                      <Button
                        onClick={() => generateSummary(selectedDoc)}
                        disabled={isSummarizing || !!selectedDoc.summary}
                        className="btn-legal-primary"
                        size="sm"
                      >
                        {isSummarizing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : selectedDoc.summary ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Summary Ready
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
                  <CardContent>
                    {selectedDoc.summary ? (
                      <div className="bg-legal-beige rounded-xl p-4">
                        <h4 className="font-semibold text-legal-dark-text mb-2">Document Summary:</h4>
                        <p className="text-legal-secondary legal-text whitespace-pre-wrap">
                          {selectedDoc.summary}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-legal-secondary">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-legal-accent" />
                        <p>Generate an AI summary to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chat Interface */}
                <Card className="border-legal-border rounded-2xl shadow-legal">
                  <CardHeader>
                    <CardTitle className="text-legal-dark-text flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chat with Document
                    </CardTitle>
                    <CardDescription className="text-legal-secondary">
                      Ask questions about the document content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Chat Messages */}
                    <ScrollArea className="h-96 mb-4 border border-legal-border rounded-xl p-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-6 text-legal-secondary">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-legal-accent" />
                          <p className="mb-4">Ask me anything about this document</p>
                          <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                            {[
                              'What are the payment terms?',
                              'How can I terminate this agreement?',
                              'What are my main obligations?',
                              'What liability am I exposed to?'
                            ].map((question) => (
                              <button
                                key={question}
                                onClick={() => {
                                  setCurrentMessage(question);
                                  setTimeout(() => sendMessage(), 100);
                                }}
                                className="text-left text-sm text-legal-secondary hover:text-legal-dark-text bg-legal-beige/50 hover:bg-legal-beige border border-legal-border rounded-lg p-3 transition-all hover:shadow-sm"
                              >
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
                                <div className="w-8 h-8 legal-icon-bg rounded-full flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-xl p-3",
                                  message.type === "user"
                                    ? "bg-legal-brown text-white"
                                    : "bg-legal-beige text-legal-dark-text"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                {message.matched_chunks && message.matched_chunks.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-legal-border/30">
                                    <p className="text-xs text-legal-secondary mb-2 font-medium">Referenced sections:</p>
                                    {message.matched_chunks.slice(0, 2).map((chunk, idx) => (
                                      <div key={idx} className="text-xs bg-white/10 rounded-lg p-2 mb-2 border border-legal-border/20">
                                        <Badge variant="outline" className="text-xs mb-1 border-legal-accent/50 text-legal-accent">
                                          Page {chunk.page || '?'}
                                        </Badge>
                                        <p className="text-legal-secondary/80 leading-relaxed">
                                          {chunk.text.length > 120 ? chunk.text.substring(0, 120) + '...' : chunk.text}
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
                                <p className="text-xs text-legal-secondary mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {message.type === "user" && (
                                <div className="w-8 h-8 legal-icon-bg rounded-full flex items-center justify-center">
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
                              <div className="bg-legal-beige rounded-xl p-3">
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-legal-accent" />
                                  <p className="text-sm text-legal-secondary">AI is thinking...</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Ask a question about the document..."
                        className="flex-1 border-legal-border focus:border-legal-accent"
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
              </div>
            ) : (
              <Card className="border-legal-border rounded-2xl shadow-legal h-full">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-legal-accent" />
                    <h3 className="text-xl font-semibold text-legal-dark-text mb-2">
                      Select a Document
                    </h3>
                    <p className="text-legal-secondary">
                      Choose a document from the left panel to start analyzing and chatting
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

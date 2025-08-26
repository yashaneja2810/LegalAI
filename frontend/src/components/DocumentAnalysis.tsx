import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { Send, FileText, MessageSquare, ArrowLeft, Sparkles, Move, Info } from 'lucide-react';
import { Document, ChatMessage } from '../types';
import { GlassCard } from './GlassCard';
import { AnimatedButton } from './AnimatedButton';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';
import Tooltip from '@mui/material/Tooltip';

// Add a type for matched chunk info
interface MatchedChunk {
  text: string;
  page?: number;
}

interface DocumentAnalysisProps {
  document: Document;
  documents: Document[];
  onBack: () => void;
  onDocumentSelect: (document: Document) => void;
  userId: string;
}

const API_URL = 'http://localhost:8000'; // Change to your backend URL

export const DocumentAnalysis = ({ document, documents, onBack, onDocumentSelect, userId }: DocumentAnalysisProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summary, setSummary] = useState(document.summary || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Add a new state to store matched chunks for each AI answer
  const [matchedChunks, setMatchedChunks] = useState<{ [msgId: string]: MatchedChunk[] }>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch summary if not present
  useEffect(() => {
    if (!summary && document.doc_id) {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('doc_id', document.doc_id);
      fetch(`${API_URL}/summarize`, {
        method: 'POST',
        body: formData,
      })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server error: ${res.status} - ${text}`);
          }
          return res.json();
        })
        .then(data => setSummary(data.summary))
        .catch(() => setSummary('Could not fetch summary.'));
    }
  }, [document, summary, userId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('doc_id', document.doc_id);
      formData.append('question', userMessage.content);
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} - ${text}`);
      }
      const data = await res.json();
      // Assume backend returns { answer, matched_chunks: [{ text, page }] }
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      if (data.matched_chunks) {
        setMatchedChunks(prev => ({ ...prev, [aiMessage.id]: data.matched_chunks }));
      }
    } catch (err: any) {
      toast.error('Failed to get answer from AI: ' + err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    'What are the payment terms?',
    'How can I terminate this agreement?',
    'What are my main obligations?',
    'What liability am I exposed to?',
  ];

  // Chatbox position and size state - positioned on the right side by default
  const [chatBox, setChatBox] = useState({
    x: window.innerWidth > 1400 ? 750 : 600, // Responsive positioning
    y: 120,
    width: 420,
    height: 520,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-900/40 flex relative overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-gradient-to-b from-slate-900 via-blue-950/80 to-slate-900/60 backdrop-blur-2xl border-r border-blue-900/40 p-6 overflow-y-auto shadow-xl z-10"
      >
        <div className="mb-6">
          <AnimatedButton
            onClick={onBack}
            variant="ghost"
            icon={ArrowLeft}
            size="sm"
          >
            Back to Dashboard
          </AnimatedButton>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 tracking-wide">Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  doc.id === document.id
                    ? 'bg-gradient-to-r from-blue-800/60 to-slate-800/60 border border-blue-500/40 shadow-lg'
                    : 'bg-slate-900/40 hover:bg-blue-950/40 border border-transparent'
                }`}
                onClick={() => doc.status === 'completed' && onDocumentSelect(doc)}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white truncate">{doc.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900/80 via-blue-950/60 to-slate-900/60 backdrop-blur-2xl border-b border-blue-900/40 p-6 shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-3 rounded-lg shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow">{document.name}</h1>
              <p className="text-blue-300">AI Analysis Complete</p>
            </div>
          </div>
        </motion.div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glassy shadow-2xl rounded-3xl border border-blue-900/30"
          >
            <GlassCard>
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                <h2 className="text-xl font-semibold text-white tracking-wide">Document Summary</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-blue-100 leading-relaxed text-lg">
                  {summary || <LoadingSpinner size="sm" />}
                </p>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Key Sections Identified</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Payment Terms', 'Termination', 'Obligations', 'Liability'].map((section) => (
                    <div key={section} className="bg-gradient-to-r from-blue-950/40 to-slate-900/40 border border-blue-900/30 rounded-lg p-3">
                      <span className="text-blue-200 font-medium text-sm">{section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
          {/* Animated floating chat box (draggable, resizable) */}
          <Rnd
            size={{ width: chatBox.width, height: chatBox.height }}
            position={{ x: chatBox.x, y: chatBox.y }}
            minWidth={340}
            minHeight={320}
            bounds="parent"
            onDragStop={(_, d) => setChatBox((prev) => ({ ...prev, x: d.x, y: d.y }))}
            onResizeStop={(_, __, ref, ___, pos) => setChatBox({
              x: pos.x,
              y: pos.y,
              width: parseInt(ref.style.width, 10),
              height: parseInt(ref.style.height, 10),
            })}
            dragHandleClassName="chatbox-drag-handle"
            className="z-30"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="h-full w-full flex flex-col glassy border border-blue-900/40 rounded-2xl shadow-2xl backdrop-blur-xl bg-gradient-to-br from-blue-950/80 via-slate-900/80 to-blue-900/60"
              style={{ boxShadow: '0 8px 32px 0 rgba(30, 64, 175, 0.25)' }}
            >
              {/* Drag handle */}
              <div className="chatbox-drag-handle flex items-center gap-2 cursor-move px-4 py-2 bg-gradient-to-r from-blue-900/80 to-blue-800/60 rounded-t-2xl border-b border-blue-900/30">
                <Move className="w-4 h-4 text-blue-300 animate-bounce" />
                <span className="text-blue-200 font-semibold tracking-wide">Ask AI</span>
              </div>
              <div className="flex items-center space-x-3 mb-4 px-4 pt-2">
                <MessageSquare className="w-6 h-6 text-blue-400 animate-pulse" />
                <h2 className="text-lg font-semibold text-white">Chat with Document</h2>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96 px-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-blue-300 mb-4">Ask me anything about this document</p>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestedQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setInputValue(question);
                            setTimeout(handleSendMessage, 100);
                          }}
                          className="text-left text-sm text-blue-200 hover:text-white bg-blue-950/30 hover:bg-blue-900/40 border border-blue-900/30 rounded-lg p-2 transition-all"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl whitespace-pre-line ${
                        message.type === 'user'
                          ? 'bg-blue-800 text-white'
                          : 'bg-gradient-to-br from-blue-950/80 to-slate-900/80 text-blue-100 border border-blue-900/30'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {/* Show info button for AI answers with matched chunks */}
                      {message.type === 'ai' && matchedChunks[message.id] && matchedChunks[message.id].length > 0 && (
                        <div className="flex justify-end mt-2">
                          <Tooltip
                            title={
                              <div style={{ maxWidth: 320, maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-line' }} className="text-xs text-blue-100">
                                {matchedChunks[message.id].map((chunk, idx) => (
                                  <div key={idx} className="mb-2">
                                    <span className="font-semibold text-blue-300">Page {chunk.page ?? '?'}:</span>
                                    <br />
                                    <span className="italic">{chunk.text.length > 200 ? chunk.text.slice(0, 200) + '...' : chunk.text}</span>
                                  </div>
                                ))}
                              </div>
                            }
                            placement="top"
                            arrow
                          >
                            <button className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-900/70 hover:bg-blue-700/80 border border-blue-400/40 shadow ml-2">
                              <Info className="w-4 h-4 text-blue-200" />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-blue-950/80 text-blue-200 border border-blue-900/30 px-4 py-3 rounded-2xl">
                      <LoadingSpinner size="sm" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div className="flex space-x-2 px-4 pb-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Me!"
                  className="flex-1 bg-blue-950/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                />
                <AnimatedButton
                  onClick={handleSendMessage}
                  icon={Send}
                  size="md"
                  disabled={!inputValue.trim() || isTyping}
                >
                  Send
                </AnimatedButton>
              </div>
            </motion.div>
          </Rnd>
        </div>
      </div>
    </div>
  );
};

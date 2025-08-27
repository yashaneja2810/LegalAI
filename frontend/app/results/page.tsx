'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Send, User, Bot, Download, Share, Scale } from 'lucide-react';

export default function ResultsPage() {
  const [fileName, setFileName] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Welcome! Ask any question about your document, or select a suggested question below."
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summary, setSummary] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSummary = async () => {
    const docId = localStorage.getItem('lm_doc_id');
    const userId = localStorage.getItem('lm_user_id');
    if (docId && userId) {
      try {
        const params = new URLSearchParams();
        params.append('doc_id', docId);
        params.append('user_id', userId);
        const res = await fetch('http://localhost:8000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('lm_summary', data.summary || '');
          setSummary(data.summary || '');
          setSummaryError('');
        } else {
          const errText = await res.text();
          setSummaryError(errText || 'Summary generation failed.');
        }
      } catch (e) {
        setSummaryError('Summary fetch failed: ' + (e instanceof Error ? e.message : String(e)));
      }
    }
  };

  const fetchSuggestedQuestions = async () => {
    const docId = localStorage.getItem('lm_doc_id');
    const userId = localStorage.getItem('lm_user_id');
    if (docId && userId) {
      try {
        const params = new URLSearchParams();
        params.append('doc_id', docId);
        params.append('user_id', userId);
        const res = await fetch('http://localhost:8000/suggest_questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestedQuestions(data.questions || []);
        }
      } catch (e) {
        setSuggestedQuestions([]);
      }
    }
  };

  useEffect(() => {
    const storedFileName = localStorage.getItem('lm_doc_name') || localStorage.getItem('uploadedFile');
    if (storedFileName) {
      setFileName(storedFileName);
    }
    // Load summary if present
    const storedSummary = localStorage.getItem('lm_summary');
    if (storedSummary) {
      setSummary(storedSummary);
    } else {
      fetchSummary();
    }
    fetchSuggestedQuestions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (question?: string) => {
    const msg = question || inputMessage;
    if (!msg.trim()) return;
    const userMessage = { type: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    const docId = localStorage.getItem('lm_doc_id');
    const userId = localStorage.getItem('lm_user_id');
    try {
      const params = new URLSearchParams();
      params.append('doc_id', docId || '');
      params.append('user_id', userId || '');
      params.append('question', msg);
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Chat failed: ${res.status}`);
      }
      const data = await res.json();
      const botMessage = { type: 'bot', content: data.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I could not reach the server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/upload" className="flex items-center space-x-2 group">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-golden-600 transition-colors" />
              <span className="text-gray-600 group-hover:text-golden-600 transition-colors">Upload New Document</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Scale className="h-8 w-8 text-golden-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-golden-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-golden-700 to-golden-500 bg-clip-text text-transparent">
                  LexisMind
                </span>
                <div className="text-xs text-golden-600 font-medium tracking-wider">LEGAL INTELLIGENCE</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-golden-600 transition-colors">
                <Download className="h-5 w-5" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-golden-600 transition-colors">
                <Share className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Document Analysis Panel */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-golden-600 to-golden-500 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">Document Analysis</h1>
              <p className="text-golden-100">{fileName || 'document.pdf'}</p>
            </div>
            <div className="p-6 overflow-y-auto h-full">
              {/* Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                {summaryError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-center">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Summary Error</h3>
                    <p className="text-red-600 mb-4">{summaryError}</p>
                    <button
                      onClick={fetchSummary}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Retry Summary
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-800 whitespace-pre-line">{summary}</p>
                )}
              </div>

              {/* Document Overview */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Overview</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Rental Agreement Analysis</h3>
                  <p className="text-gray-600 mb-3">Type: Residential Lease Agreement</p>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">12-month lease term starting January 1, 2024</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Monthly rent: $2,500 due on the 1st of each month</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Security deposit: $2,500 (refundable)</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Pet policy: No pets allowed without written consent</span>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Maintenance responsibilities clearly defined</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    'High' === 'High' 
                      ? 'bg-red-50 border-red-400' 
                      : 'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`h-5 w-5 mr-2 mt-0.5 ${
                        'High' === 'High' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <div className={`text-xs font-semibold mb-1 ${
                          'High' === 'High' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {'High'.toUpperCase()} RISK
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Automatic lease renewal clause with 60-day notice requirement</h3>
                        <p className="text-gray-700 text-sm">Could result in unintended lease extension if notice is not given on time</p>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border-l-4 ${
                    'Medium' === 'High' 
                      ? 'bg-red-50 border-red-400' 
                      : 'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`h-5 w-5 mr-2 mt-0.5 ${
                        'Medium' === 'High' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <div className={`text-xs font-semibold mb-1 ${
                          'Medium' === 'High' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {'Medium'.toUpperCase()} RISK
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Landlord has broad discretion for property inspections</h3>
                        <p className="text-gray-700 text-sm">May allow for frequent property access with minimal notice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <span className="text-gray-700">Set a calendar reminder 90 days before lease expiration</span>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <span className="text-gray-700">Request clarification on inspection notice periods</span>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <span className="text-gray-700">Review pet policy if you plan to get a pet</span>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      4
                    </div>
                    <span className="text-gray-700">Understand maintenance request procedures</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-white rounded-xl shadow-lg flex flex-col">
            <div className="bg-gradient-to-r from-golden-600 to-golden-500 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">AI Assistant Chat</h2>
              <p className="text-golden-100 text-sm">Ask questions about your document</p>
            </div>
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="bg-golden-100 text-golden-800 px-4 py-2 rounded-lg hover:bg-golden-200 transition-colors text-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-golden-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-golden-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Ask about your document..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-golden-600 to-golden-500 text-white p-2 rounded-lg hover:from-golden-700 hover:to-golden-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
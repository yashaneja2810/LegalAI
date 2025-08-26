import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, UploadCloud } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  name: string;
  summary: string;
  status: 'completed';
  doc_id: string;
}

interface DashboardProps {
  onDocumentSelect: (doc: Document) => void;
  userId: string;
}

const API_URL = 'http://localhost:8000'; // Change to your backend URL

export const Dashboard: React.FC<DashboardProps> = ({ onDocumentSelect, userId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Fetch docs on mount
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/docs?user_id=${userId}`)
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} - ${text}`);
        }
        return res.json();
      })
      .then(data => {
        setDocuments(
          (data.docs || []).map((doc: any, idx: number) => ({
            id: doc.doc_id || idx.toString(),
            name: doc.name,
            summary: '',
            status: 'completed',
            doc_id: doc.doc_id,
          }))
        );
      })
      .catch(err => {
        toast.error(`Failed to load documents: ${err.message}`);
      });
  }, [userId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('file', file);
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Server error: ${uploadRes.status} - ${text}`);
      }
      const uploadData = await uploadRes.json();
      // Fetch summary
      const summaryForm = new FormData();
      summaryForm.append('user_id', userId);
      summaryForm.append('doc_id', uploadData.doc.doc_id);
      const summaryRes = await fetch(`${API_URL}/summarize`, {
        method: 'POST',
        body: summaryForm,
      });
      if (!summaryRes.ok) {
        const text = await summaryRes.text();
        throw new Error(`Server error: ${summaryRes.status} - ${text}`);
      }
      const summaryData = await summaryRes.json();
      const newDoc: Document = {
        id: uploadData.doc.doc_id,
        name: uploadData.doc.name,
        summary: summaryData.summary,
        status: 'completed',
        doc_id: uploadData.doc.doc_id,
      };
      setDocuments(prev => [...prev, newDoc]);
      setTimeout(() => {
        onDocumentSelect(newDoc);
      }, 500);
    } catch (err: any) {
      toast.error(`Failed to upload or summarize document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-blue-900/40 to-gray-900/20">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 bg-black/60 backdrop-blur-xl border-r border-blue-800/30 p-6 flex flex-col"
      >
        <h2 className="text-lg font-bold text-white mb-6 tracking-wide">Your Documents</h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          {documents.length === 0 && (
            <div className="text-gray-400 text-sm">No documents uploaded yet.</div>
          )}
          {documents.map(doc => (
            <motion.div
              key={doc.id}
              whileHover={{ scale: 1.03 }}
              className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-gray-800/30 border border-blue-800/20 cursor-pointer transition-all hover:shadow-lg"
              onClick={() => onDocumentSelect(doc)}
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm truncate">{doc.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 rounded-3xl p-12 shadow-2xl border border-blue-900/30 backdrop-blur-xl flex flex-col items-center"
        >
          <UploadCloud className="w-16 h-16 text-blue-400 mb-6 animate-bounce" />
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Upload Legal Documents</h1>
          <p className="text-gray-300 mb-8 text-center max-w-md">Upload your rental agreements, loan contracts, or terms of service. We'll help you understand them in simple language.</p>
          <AnimatedButton
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            icon={UploadCloud}
            className="mb-2"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Document'}
          </AnimatedButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <span className="text-xs text-gray-500 mt-2">Supported: PDF, DOC, DOCX, TXT</span>
        </motion.div>
      </div>
    </div>
  );
};

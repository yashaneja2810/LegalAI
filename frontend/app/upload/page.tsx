'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileText, ArrowLeft, CheckCircle, AlertCircle, Scale } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getUserId = () => {
    let id = localStorage.getItem('lm_user_id');
    if (!id) {
      id = `user_${Date.now()}`;
      localStorage.setItem('lm_user_id', id);
    }
    return id;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.type.includes('document')) {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF or document file.');
      }
    }
  }, []);

  // Auto-upload when a file is selected
  useEffect(() => {
    if (file) {
      // small delay to allow UI to update before starting network work
      const t = setTimeout(() => {
        handleUpload();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const userId = getUserId();
    let docId = '';
    let fileName = file.name;
    let summaryDone = false;

    try {
      console.log('Uploading with user_id:', userId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      docId = data?.doc?.doc_id;
      fileName = data?.doc?.name || file.name;
      console.log('Upload response doc_id:', docId);

      localStorage.setItem('lm_doc_id', docId);
      localStorage.setItem('lm_doc_name', fileName);
      localStorage.setItem('lm_user_id', userId);

      // Request summary immediately
      const params = new URLSearchParams();
      params.append('doc_id', docId);
      params.append('user_id', userId);
      console.log('Summarize request doc_id:', docId, 'user_id:', userId);

      const sumRes = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        localStorage.setItem('lm_summary', sumData.summary || '');
        summaryDone = true;
      } else {
        // Log error but continue
        console.warn('Summary generation failed:', await sumRes.text());
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Always redirect to results, even if summary failed
      setTimeout(() => {
        router.push('/results');
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-blue-700 transition-colors" />
              <span className="text-gray-600 group-hover:text-golden-600 transition-colors">Back to Home</span>
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
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Legal Document</h1>
          <p className="text-xl text-gray-600">
            Upload your contract, agreement, or legal document for professional AI-powered analysis
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-golden-500 bg-golden-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className={`h-16 w-16 mx-auto mb-6 ${isDragging ? 'text-golden-500' : 'text-gray-400'}`} />
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drag and drop your document here
              </h3>
              <p className="text-gray-600 mb-6">
                Supports PDF, DOC, DOCX and other document files (max 10MB)
              </p>
              
              <label className="bg-gradient-to-r from-golden-600 to-golden-500 text-white px-6 py-3 rounded-lg hover:from-golden-700 hover:to-golden-600 transition-colors cursor-pointer inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Upload className="h-5 w-5 mr-2" />
                Browse Files
                <input
                  type="file"
                  accept="*/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">File Selected</h3>
                <p className="text-gray-600 mb-2">{file.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isUploading ? (
                  <div className="flex items-center justify-center bg-gradient-to-r from-golden-600 to-golden-500 text-white px-8 py-3 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Uploading & analyzing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center bg-gray-100 text-gray-700 px-8 py-3 rounded-lg">
                    Ready to upload...
                  </div>
                )}

                <button
                  onClick={() => setFile(null)}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-golden-50 border border-golden-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-golden-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-golden-900 mb-2">Your Privacy is Protected</h3>
              <p className="text-golden-800 text-sm leading-relaxed">
                Your documents are processed securely and are not stored on our servers. 
                All analysis is performed using advanced encryption and your data remains private.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Documents */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Document Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Contracts</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Agreements</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Terms of Service</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Legal Forms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
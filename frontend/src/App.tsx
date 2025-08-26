import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { DocumentAnalysis } from './components/DocumentAnalysis';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Document } from './types';

type AppState = 'dashboard' | 'analysis';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppState>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setCurrentView('analysis');
    
    // Add to documents list if not already there
    setDocuments(prev => {
      const exists = prev.find(d => d.id === document.id);
      return exists ? prev : [...prev, document];
    });
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900/30 to-gray-800/20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} />
      
      {currentView === 'dashboard' && (
        <Dashboard onDocumentSelect={handleDocumentSelect} userId={user.id} />
      )}
      
      {currentView === 'analysis' && selectedDocument && (
        <DocumentAnalysis
          document={selectedDocument}
          documents={documents}
          onBack={handleBackToDashboard}
          onDocumentSelect={handleDocumentSelect}
          userId={user.id}
        />
      )}
      
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-gray-800 text-white border border-gray-700',
          duration: 3000,
        }}
      />
    </div>
  );
}

export default App;

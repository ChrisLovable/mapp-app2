import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import { MicManagerProvider } from './contexts/MicManagerContext';
import AuthModal from './components/AuthModal';
import SupabaseErrorModal from './components/SupabaseErrorModal';
import MicStatusIndicator from './components/MicStatusIndicator';
import MicConcurrencyTest from './components/MicConcurrencyTest';
import ErrorBoundary from './components/ErrorBoundary';
import { isSupabaseAvailable } from './lib/supabase';
import './App.css';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupabaseError, setShowSupabaseError] = useState(false);

  useEffect(() => {
    // Show error modal if Supabase is not configured
    if (!isSupabaseAvailable) {
      setShowSupabaseError(true);
    }
  }, []);

  const handleAuthSuccess = (user: any) => {
    console.log('User authenticated:', user);
    setShowAuthModal(false);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MicManagerProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home onShowAuth={() => setShowAuthModal(true)} />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
            </Routes>
            <MicStatusIndicator />
            <MicConcurrencyTest />
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onAuthSuccess={handleAuthSuccess}
            />
            <SupabaseErrorModal
              isOpen={showSupabaseError}
              onClose={() => setShowSupabaseError(false)}
            />
          </div>
        </MicManagerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

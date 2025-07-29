import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import SupabaseErrorModal from './components/SupabaseErrorModal';
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
    <AuthProvider>
      <div className="App">
        <Home onShowAuth={() => setShowAuthModal(true)} />
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
    </AuthProvider>
  );
}

export default App;

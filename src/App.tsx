import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import SupabaseErrorModal from './components/SupabaseErrorModal';
import { isSupabaseAvailable } from './lib/supabase';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupabaseError, setShowSupabaseError] = useState(false);

  useEffect(() => {
    // Show error modal if Supabase is not configured
    if (!isSupabaseAvailable) {
      setShowSupabaseError(true);
    }

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        console.log('User session:', session);
        setShowAuthModal(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (user: any) => {
    console.log('User authenticated:', user);
    setShowAuthModal(false);
  };

  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home onShowAuth={() => setShowAuthModal(true)} />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
        </Routes>
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

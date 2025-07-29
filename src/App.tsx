import React, { useState } from 'react';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import './App.css';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      </div>
    </AuthProvider>
  );
}

export default App;

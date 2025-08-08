import React from 'react';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Home onShowAuth={() => {}} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
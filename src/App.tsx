import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import MessageBox from './components/MessageBox';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [step, setStep] = useState<'landing' | 'auth' | 'main'>('landing');
  const [user, setUser] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Listen for Supabase session changes (auto-persisted)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUser(session.user);
        setStep('main');
      } else {
        setUser(null);
        setStep('auth');
      }
    });
    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && data.session.user) {
        setUser(data.session.user);
        setStep('main');
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  // 1. Landing page
  if (step === 'landing') {
    return (
      <Landing
        onSelectPlan={plan => {
          if (plan === 'free') {
            setStep('auth');
          }
        }}
      />
    );
  }

  // 2. Auth (sign up/in)
  if (step === 'auth') {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => setStep('landing')}
        onAuthSuccess={async (user: any) => {
          setUser(user);
          // Upsert user in DB with free plan
          await supabase.from('users').upsert({ id: user.id, email: user.email, plan: 'free', tokens: 50000 });
          setStep('main');
        }}
      />
    );
  }

  // 3. Main app UI
  if (step === 'main' && user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <Header onDashboardClick={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <MessageBox value={''} onChange={() => {}} uploadedImage={null} setUploadedImage={() => {}} />
        </div>
        {/* PWA Install Prompt */}
        {showInstallPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md">
            <div className="relative w-full mx-auto bg-black border-2 border-blue-500 rounded-2xl shadow-lg shadow-blue-500/50 overflow-y-auto flex flex-col items-center"
              style={{ width: '85vw', maxWidth: '600px', minHeight: '300px' }}>
              <img src="/Gabby.jpg" alt="Gabby" className="w-32 h-32 rounded-full mb-6 shadow-lg" />
              <h2 className="text-2xl font-bold mb-4">Install Gabby App</h2>
              <p className="mb-4">Tap below to install Gabby as a PWA and get started!</p>
              <button
                className="glassy-btn neon-grid-btn px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-lg mb-4"
                style={{ background: 'linear-gradient(135deg, #2563eb 60%, #1e293b 100%)', border: '2px solid #fff', boxShadow: '0 8px 30px rgba(30, 58, 138, 0.4)' }}
                disabled={installing}
                onClick={async () => {
                  setInstalling(true);
                  if ((window as any).deferredPrompt) {
                    const promptEvent = (window as any).deferredPrompt;
                    promptEvent.prompt();
                    promptEvent.userChoice.then(() => {
                      setInstalling(false);
                      setShowInstallPrompt(false);
                    }).catch(() => {
                      setInstalling(false);
                      setShowInstallPrompt(false);
                    });
                  } else {
                    alert('If you see an install button in your browser, tap it to add Gabby to your home screen!');
                    setInstalling(false);
                    setShowInstallPrompt(false);
                  }
                }}
              >
                {installing ? 'Installing...' : 'Install Gabby App'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
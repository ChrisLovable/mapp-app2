import React, { useEffect, useState } from 'react';
// import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
// import PayFastSandboxMock from './components/PayFastSandboxMock'; // If you have a separate component, otherwise use inline
import { supabase } from './lib/supabase';

const PayFastSandboxMock = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
  <div className="w-full flex flex-col items-center justify-center mt-6 p-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 text-yellow-900 shadow-lg" style={{ minHeight: 120 }}>
    <div className="text-2xl font-bold mb-2">PayFast Sandbox</div>
    <div className="mb-2">[This is a mockup of the PayFast payment screen]</div>
    <div className="flex gap-2 mt-2">
      <button className="px-6 py-2 rounded-lg bg-green-500 text-white font-bold" onClick={onSuccess}>Pay R299</button>
      <button className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold" onClick={onCancel}>Cancel</button>
    </div>
  </div>
);

function App() {
  const [step, setStep] = useState<'auth' | 'main'>('auth');
  // Simplified flow: no plan selection upfront

  // Ensure we resume into the main UI after install or refresh if user is authenticated
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const stored = localStorage.getItem('onboardingComplete') === '1';
        const { data: { session } } = await supabase.auth.getSession();
        if (stored || session) {
          setStep('main');
        }
      } catch {
        // ignore
      }
    };
    bootstrap();

    const handleAppInstalled = () => {
      localStorage.setItem('onboardingComplete', '1');
      setStep('main');
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  // Simplified onboarding: go straight to Auth

  // 3. Auth (sign up/in)
  if (step === 'auth') {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => setStep('auth')}
        onAuthSuccess={async (user: any) => {
          setUserEmail(user.email);
          // Minimal DB upsert; pricing handled later in-app
          try {
            await supabase.from('users').upsert({ id: user.id, email: user.email });
          } catch {}
          // Trigger install immediately
          try {
            // show installing overlay while prompting install
            (window as any).showInstallingOverlay?.();
            if ((window as any).deferredPrompt) {
              const promptEvent = (window as any).deferredPrompt;
              await promptEvent.prompt();
            }
          } catch {}
          localStorage.setItem('onboardingComplete', '1');
          setStep('main');
        }}
      />
    );
  }

  // 4. Main UI after authentication
  if (step === 'main') {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <Home onShowAuth={() => setStep('auth')} />
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  return null;
}

export default App;
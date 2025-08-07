import React, { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
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
  const [step, setStep] = useState<'landing' | 'payfast' | 'auth' | 'main'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

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

  // 1. Landing page
  if (step === 'landing') {
    return (
      <Landing
        onSelectPlan={plan => {
          setSelectedPlan(plan);
          if (plan === 'free') {
            setStep('auth');
          } else {
            setStep('payfast');
          }
        }}
      />
    );
  }

  // 2. PayFast payment (for paid plan)
  if (step === 'payfast') {
    return (
      <PayFastSandboxMock
        onSuccess={() => setStep('auth')}
        onCancel={() => setStep('landing')}
      />
    );
  }

  // 3. Auth (sign up/in)
  if (step === 'auth') {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => setStep('landing')}
        onAuthSuccess={async (user: any) => {
          setUserEmail(user.email);
          // Set tokens/plan/email in DB
          if (selectedPlan === 'free') {
            await supabase.from('users').upsert({ id: user.id, email: user.email, plan: 'free', tokens: 50000 });
          } else if (selectedPlan === 'paid') {
            await supabase.from('users').upsert({ id: user.id, email: user.email, plan: 'paid', tokens: 300000 });
          }
          // After successful auth, show main UI
          localStorage.setItem('onboardingComplete', '1');
          setStep('main');
        }}
      />
    );
  }

  // 4. Main UI after authentication
  if (step === 'main') {
    return (
      <AuthProvider>
        <Home onShowAuth={() => setStep('auth')} />
      </AuthProvider>
    );
  }

  return null;
}

export default App;
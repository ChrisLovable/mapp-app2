import React, { useState } from 'react';
import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
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
  const [step, setStep] = useState<'landing' | 'payfast' | 'auth' | 'done'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

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
          setStep('done');
        }}
      />
    );
  }

  // 4. PWA install prompt (done) - FORCE DEPLOY 1234
  if (step === 'done') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-8${installing ? ' cursor-wait' : ''}`}
        style={installing ? { cursor: 'wait' } : {}}>
        <img src="/Gabby.jpg" alt="Gabby" className="w-32 h-32 rounded-full mb-6 shadow-lg" />
        <h2 className="text-2xl font-bold mb-4">Welcome to Gabby!</h2>
        <p className="mb-4">Thank you for signing up. Tap below to install Gabby as a PWA and get started!</p>
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
              }).catch(() => {
                setInstalling(false);
              });
            } else {
              alert('If you see an install button in your browser, tap it to add Gabby to your home screen!');
              setInstalling(false);
            }
          }}
        >
          {installing ? 'Installing...' : 'Install Gabby App'}
        </button>
        <p className="text-sm opacity-70">You will stay logged in forever unless you log out.</p>
      </div>
    );
  }

  return null;
}

export default App;
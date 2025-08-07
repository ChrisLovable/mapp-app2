// FORCE UPDATE NOW!!!
import React, { useState } from 'react';
import './Landing.css';

interface LandingProps {
  onSelectPlan: (plan: 'free' | 'paid') => void;
}

const plans = [
  {
    type: 'free',
    title: 'Free Plan',
    description: '7 Day Trial Period',
    price: 'R0',
    highlight: false,
  },
  {
    type: 'paid',
    title: 'Pro Plan',
    description: '300,000 tokens per month',
    price: 'R299/month',
    highlight: true,
  },
];

const PayFastSandboxMock: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center mt-6 p-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 text-yellow-900 shadow-lg" style={{ minHeight: 120 }}>
    <div className="text-2xl font-bold mb-2">PayFast Sandbox</div>
    <div className="mb-2">[This is a mockup of the PayFast payment screen]</div>
    <div className="flex gap-2 mt-2">
      <button className="px-6 py-2 rounded-lg bg-green-500 text-white font-bold">Pay R299</button>
      <button className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold">Cancel</button>
    </div>
  </div>
);

const Landing: React.FC<LandingProps> = ({ onSelectPlan }) => {
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<null | 'free' | 'paid'>(null);

  return (
    <div className="gabby-landing-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-8">
        <img src="/Gabby.jpg" alt="Gabby" className="w-48 h-48 rounded-full shadow-lg mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2 text-center drop-shadow-lg">Download Gabby App</h1>
        <p className="text-white text-center mb-6 opacity-80">Your AI-powered assistant for productivity, creativity, and more.</p>
        {!showPlans ? (
          <button
            className="glassy-btn neon-grid-btn px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-lg mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb 60%, #1e293b 100%)', border: '2px solid #fff', boxShadow: '0 8px 30px rgba(30, 58, 138, 0.4)' }}
            onClick={() => setShowPlans(true)}
          >
            Get Started
          </button>
        ) : (
          <div className="w-full flex flex-col gap-6 mt-2">
            {plans.map(plan => (
              <button
                key={plan.type}
                className={`w-full rounded-2xl p-2 flex flex-col items-center justify-center shadow-xl border-2 border-blue-400 glassy-btn neon-grid-btn transition-transform active:scale-95`}
                style={{ height: 60, minHeight: 60 }}
                onClick={() => {
                  setSelectedPlan(plan.type as 'free' | 'paid');
                  onSelectPlan(plan.type as 'free' | 'paid');
                }}
              >
                <span className="text-sm font-bold text-white">{plan.title}</span>
                <span className="text-xs text-blue-200">{plan.description}</span>
                <span className="text-sm font-bold text-blue-300">{plan.price}</span>
              </button>
            ))}
            {selectedPlan === 'paid' && <PayFastSandboxMock />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;

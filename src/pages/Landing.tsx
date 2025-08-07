import React, { useState } from 'react';
import './Landing.css';

interface LandingProps {
  onSelectPlan: (plan: 'free' | 'paid') => void;
}

const plans = [
  {
    type: 'free',
    title: 'Free Plan',
    description: '50,000 tokens per month',
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

const Landing: React.FC<LandingProps> = ({ onSelectPlan }) => {
  const [showPlans, setShowPlans] = useState(false);

  return (
    <div className="gabby-landing-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-8">
        <img src="/Gabby.jpg" alt="Gabby" className="w-24 h-24 rounded-full shadow-lg mb-4" />
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
                className={`w-full rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl border-2 ${plan.highlight ? 'border-blue-400 bg-blue-900/60' : 'border-gray-400 bg-gray-800/60'} glassy-btn neon-grid-btn transition-transform active:scale-95`}
                style={{ minHeight: 120 }}
                onClick={() => onSelectPlan(plan.type as 'free' | 'paid')}
              >
                <span className="text-2xl font-bold text-white mb-1">{plan.title}</span>
                <span className="text-lg text-blue-200 mb-2">{plan.description}</span>
                <span className="text-xl font-bold text-blue-300">{plan.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;

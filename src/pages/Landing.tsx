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

  return null;
};

export default Landing;

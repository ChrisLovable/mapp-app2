import React from 'react';
import Landing from './pages/Landing';

function App() {
  const handleSelectPlan = (plan: 'free' | 'paid') => {
    alert(`Selected ${plan} plan - this will be wired up next!`);
  };

  return <Landing onSelectPlan={handleSelectPlan} />;
}

export default App;
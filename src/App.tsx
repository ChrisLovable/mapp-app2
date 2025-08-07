import React from 'react';
import Landing from './pages/Landing';

// SIMPLE APP - JUST SHOW LANDING PAGE
function App() {
  return (
    <div>
      <Landing onSelectPlan={(plan) => alert(`You selected ${plan} plan!`)} />
    </div>
  );
}

export default App;
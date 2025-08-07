import React from 'react';
import Landing from './pages/Landing';

function App() {
  return <Landing onSelectPlan={plan => { console.log('Selected plan:', plan); }} />;
}

export default App;

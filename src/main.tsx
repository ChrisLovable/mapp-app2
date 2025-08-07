import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import WrappedApp from './App'
import './index.css'
import { registerServiceWorker } from './lib/pwa'

// Add CSS to hide browser UI
const addUIStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @media screen and (display-mode: standalone) {
      body { height: 100vh; overflow: hidden; }
    }
    
    /* Hide browser UI elements */
    body { 
      margin: 0; 
      padding: 0; 
      height: 100vh; 
      overflow: hidden; 
    }
    
    /* Force full viewport */
    #root { 
      height: 100vh; 
      width: 100vw; 
      margin: 0; 
      padding: 0; 
    }
  `;
  document.head.appendChild(style);
};

// Execute on load
addUIStyles();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WrappedApp />
    </BrowserRouter>
  </React.StrictMode>
)

// Register PWA service worker
registerServiceWorker();

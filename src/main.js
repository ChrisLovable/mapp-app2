import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerServiceWorker } from './lib/pwa';
// Force fullscreen and hide browser UI
const hideBrowserUI = () => {
    // Hide address bar on mobile
    if ('standalone' in window.navigator && window.navigator.standalone) {
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
    }
    // Add CSS to hide browser UI
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
hideBrowserUI();
// Capture the PWA install prompt globally once
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // @ts-ignore
    window.deferredPrompt = e;
});
// Create root and render app
const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
}
// Register PWA service worker
registerServiceWorker();

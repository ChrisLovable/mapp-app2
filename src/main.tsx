import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerServiceWorker } from './lib/pwa'

// Force fullscreen and hide browser UI
const hideBrowserUI = () => {
  // Hide address bar on mobile
  if ('standalone' in window.navigator && window.navigator.standalone) {
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
  }
  
  // Request fullscreen if supported
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err);
    });
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Aggressively remove all service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length) {
      console.log(`Found ${registrations.length} service worker(s). Unregistering...`);
      const unregisterPromises = registrations.map(reg => reg.unregister());
      
      Promise.all(unregisterPromises).then(() => {
        console.log('All service workers unregistered.');
        
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            if (cacheNames.length) {
              console.log(`Found ${cacheNames.length} cache(s). Deleting...`);
              const deletePromises = cacheNames.map(name => caches.delete(name));
              Promise.all(deletePromises).then(() => {
                console.log('All caches cleared. Reloading page for a fresh start.');
                window.location.reload();
              });
            } else {
              console.log('No caches found. Reloading page for a fresh start.');
              window.location.reload();
            }
          });
        } else {
          console.log('Caches API not supported. Reloading page for a fresh start.');
          window.location.reload();
        }
      });
    } else {
      console.log('No service workers found.');
    }
  });
}

// Register PWA service worker
registerServiceWorker();

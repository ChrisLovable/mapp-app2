import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerServiceWorker } from './lib/pwa'

// Force fullscreen and hide browser UI
const hideBrowserUI = () => {
  // Hide address bar on mobile
  if (window.navigator.standalone) {
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

// Aggressively remove all service workers during development
if ('serviceWorker' in navigator) {
  let hasServiceWorkers = false;
  
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('Found', registrations.length, 'service worker registrations');
    hasServiceWorkers = registrations.length > 0;
    
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('Service worker unregistered:', boolean);
      });
    }

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        console.log('Found', cacheNames.length, 'caches to clear');
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('All caches cleared');
      });
    }

    // Force refresh after cleanup if we had service workers
    if (hasServiceWorkers) {
      setTimeout(() => {
        console.log('Service workers removed, reloading page...');
        window.location.reload();
      }, 1000);
    }
  });
}

// Register PWA service worker (disabled for development)
// registerServiceWorker() // Temporarily disabled for development

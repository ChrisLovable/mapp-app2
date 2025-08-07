// PWA Service Worker Registration
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          
          // Handle updates properly
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New version available
                    console.log('🔄 New version available');
                    // Let the user know an update is available
                    const updateConfirmed = window.confirm(
                      'A new version of Gabby is available! Would you like to update now?'
                    );
                    if (updateConfirmed) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  } else {
                    // First time install
                    console.log('✨ Gabby App is now available offline!');
                  }
                }
              });
            }
          });

          // Handle service worker updates
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (document.visibilityState === 'visible') {
              window.location.reload();
            }
          });
        })
        .catch((error: Error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

// Add type for PWA install prompt event
declare global {
  interface Window {
    deferredPrompt: any; // PWA install prompt event
  }
}
// PWA Service Worker Registration
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available - force update
                                console.log('🔄 New version available - forcing update...');
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                // Reload the page to use the new version
                                window.location.reload();
                            }
                        });
                    }
                });
            })
                .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
        });
    }
}
// Force update function for manual refresh
export function forceUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.update();
            });
        });
    }
}

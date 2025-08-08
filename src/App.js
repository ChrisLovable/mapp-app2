import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
// import Landing from './pages/Landing';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
// import PayFastSandboxMock from './components/PayFastSandboxMock'; // If you have a separate component, otherwise use inline
import { supabase } from './lib/supabase';
const PayFastSandboxMock = ({ onSuccess, onCancel }) => (_jsxs("div", { className: "w-full flex flex-col items-center justify-center mt-6 p-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 text-yellow-900 shadow-lg", style: { minHeight: 120 }, children: [_jsx("div", { className: "text-2xl font-bold mb-2", children: "PayFast Sandbox" }), _jsx("div", { className: "mb-2", children: "[This is a mockup of the PayFast payment screen]" }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx("button", { className: "px-6 py-2 rounded-lg bg-green-500 text-white font-bold", onClick: onSuccess, children: "Pay R299" }), _jsx("button", { className: "px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold", onClick: onCancel, children: "Cancel" })] })] }));
function App() {
    const [step, setStep] = useState('auth');
    // Simplified flow: no plan selection upfront
    // Ensure we resume into the main UI after install or refresh if user is authenticated
    useEffect(() => {
        const bootstrap = async () => {
            try {
                const stored = localStorage.getItem('onboardingComplete') === '1';
                const { data: { session } } = await supabase.auth.getSession();
                if (stored || session) {
                    setStep('main');
                }
            }
            catch {
                // ignore
            }
        };
        bootstrap();
        const handleAppInstalled = () => {
            localStorage.setItem('onboardingComplete', '1');
            setStep('main');
        };
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => window.removeEventListener('appinstalled', handleAppInstalled);
    }, []);
    // Simplified onboarding: go straight to Auth
    // 3. Auth (sign up/in)
    if (step === 'auth') {
        return (_jsx(AuthModal, { isOpen: true, onClose: () => setStep('auth'), onAuthSuccess: async (user) => {
                setUserEmail(user.email);
                // Minimal DB upsert; pricing handled later in-app
                try {
                    await supabase.from('users').upsert({ id: user.id, email: user.email });
                }
                catch { }
                // Trigger install immediately
                try {
                    // show installing overlay while prompting install
                    window.showInstallingOverlay?.();
                    if (window.deferredPrompt) {
                        const promptEvent = window.deferredPrompt;
                        await promptEvent.prompt();
                    }
                }
                catch { }
                localStorage.setItem('onboardingComplete', '1');
                setStep('main');
            } }));
    }
    // 4. Main UI after authentication
    if (step === 'main') {
        return (_jsx(ErrorBoundary, { children: _jsx(AuthProvider, { children: _jsx(Home, { onShowAuth: () => setStep('auth') }) }) }));
    }
    return null;
}
export default App;

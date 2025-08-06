import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import SupabaseErrorModal from './components/SupabaseErrorModal';
import { isSupabaseAvailable } from './lib/supabase';
import { supabase } from './lib/supabase';
import './App.css';
function App() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSupabaseError, setShowSupabaseError] = useState(false);
    useEffect(() => {
        // Show error modal if Supabase is not configured
        if (!isSupabaseAvailable) {
            setShowSupabaseError(true);
        }
        // Handle auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                console.log('User session:', session);
                setShowAuthModal(false);
            }
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, []);
    const handleAuthSuccess = (user) => {
        console.log('User authenticated:', user);
        setShowAuthModal(false);
    };
    return (_jsx(AuthProvider, { children: _jsxs("div", { className: "App", children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, { onShowAuth: () => setShowAuthModal(true) }) }), _jsx(Route, { path: "/auth/reset-password", element: _jsx(ResetPassword, {}) })] }), _jsx(AuthModal, { isOpen: showAuthModal, onClose: () => setShowAuthModal(false), onAuthSuccess: handleAuthSuccess }), _jsx(SupabaseErrorModal, { isOpen: showSupabaseError, onClose: () => setShowSupabaseError(false) }), _jsxs("div", { className: "fixed bottom-2 right-2 text-xs text-gray-500", children: ["Build: ", __BUILD_TIMESTAMP__] })] }) }));
}
export default App;

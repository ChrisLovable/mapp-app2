import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setMessage('');
            setMessageType('');
            setShowVerificationMessage(false);
        }
    }, [isOpen]);
    useEffect(() => {
        if (isOpen) {
            setIsPlaying(true);
        }
    }, [isOpen]);
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');
        if (!email || !password) {
            setMessage('Please fill in all fields');
            setMessageType('error');
            setLoading(false);
            return;
        }
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                });
                if (error) {
                    setMessage(error.message);
                    setMessageType('error');
                }
                else if (data.user) {
                    setShowVerificationMessage(true);
                    setMessage('Please check your email for a verification link.');
                    setMessageType('success');
                    // Immediately proceed to onboarding flow (install inside onAuthSuccess)
                    onAuthSuccess(data.user);
                }
            }
            else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });
                if (error) {
                    setMessage(error.message);
                    setMessageType('error');
                }
                else if (data.user) {
                    onAuthSuccess(data.user);
                    onClose();
                }
            }
        }
        catch (error) {
            setMessage('An unexpected error occurred. Please try again.');
            setMessageType('error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleForgotPassword = async () => {
        if (!email) {
            setMessage('Please enter your email address first.');
            setMessageType('error');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) {
            setMessage(error.message);
            setMessageType('error');
        }
        else {
            setMessage('Password reset link sent. Please check your email.');
            setMessageType('success');
        }
        setLoading(false);
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md", children: _jsxs("div", { className: "relative w-full mx-auto bg-black border-2 border-blue-500 rounded-2xl shadow-lg shadow-blue-500/50 overflow-y-auto", style: { width: '85vw', maxWidth: '600px', height: '90vh', minHeight: '500px' }, children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white hover:text-gray-300", "aria-label": "Close modal", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "flex flex-col items-center mb-2", children: [_jsx("div", { className: "relative w-64 h-48 rounded-lg mb-2 overflow-hidden shadow-lg", children: isPlaying ? (_jsxs(_Fragment, { children: [_jsx("video", { src: "/GabbyFinalFull.mp4", autoPlay: true, playsInline: true, onEnded: () => setIsPlaying(false), className: "w-full h-full object-contain" }), _jsx("button", { onClick: () => setIsPlaying(false), className: "absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-75", children: "Stop" })] })) : (_jsx("img", { src: "/Gabby.jpg", alt: "Gabby Logo", className: "w-full h-full object-cover cursor-pointer", onClick: () => setIsPlaying(true) })) }), _jsx("p", { className: "text-xl font-bold", style: {
                                        fontFamily: "'Brush Script MT', cursive",
                                        background: 'linear-gradient(to right, #39FF14, #FFD700, #FF007F, #00FFFF, #FF00FF)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }, children: "The world's first AI super app!" }), _jsx("div", { className: "mt-2", children: _jsx("img", { src: "/logoimage.jpg", alt: "My AI Partner Logo", className: "h-20 w-48" }) })] }), showVerificationMessage ? (_jsxs("div", { className: "text-center text-white", children: [_jsx("h3", { className: "text-xl font-bold mb-2", children: "Check Your Email" }), _jsx("p", { children: message })] })) : (_jsxs("form", { onSubmit: handleAuth, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true }), _jsx("input", { type: "password", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true }), message && (_jsx("div", { className: `p-3 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`, children: message })), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 glassy-btn neon-grid-btn", children: loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In') }), _jsx("div", { className: "text-center mt-4", children: _jsx("button", { type: "button", onClick: handleForgotPassword, className: "text-sm text-blue-400 hover:underline", children: "Forgot Password?" }) }), _jsx("div", { className: "text-center mt-2", children: _jsxs("p", { className: "text-sm text-gray-400", children: [isSignUp ? 'Already have an account?' : "Don't have an account?", _jsx("button", { type: "button", onClick: () => setIsSignUp(!isSignUp), className: "ml-1 text-blue-400 hover:underline font-bold", children: isSignUp ? 'Sign In' : 'Sign Up' })] }) })] }))] })] }) }));
}

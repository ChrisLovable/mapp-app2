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
    const handleGoogleSignIn = async () => {
        setLoading(true);
        // @ts-ignore
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setMessage(error.message);
            setMessageType('error');
        }
        setLoading(false);
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
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md", children: _jsxs("div", { className: "relative w-full mx-auto bg-black border-2 border-blue-500 rounded-2xl shadow-lg shadow-blue-500/50 overflow-y-auto", style: { width: '85vw', maxWidth: '600px', height: '70vh', minHeight: '500px' }, children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white hover:text-gray-300", "aria-label": "Close modal", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "flex flex-col items-center mb-2", children: [_jsx("div", { className: "relative w-64 h-48 rounded-lg mb-2 overflow-hidden shadow-lg", children: isPlaying ? (_jsxs(_Fragment, { children: [_jsx("video", { src: "/introvideo.mp4", autoPlay: true, playsInline: true, onEnded: () => setIsPlaying(false), className: "w-full h-full object-contain" }), _jsx("button", { onClick: () => setIsPlaying(false), className: "absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-75", children: "Stop" })] })) : (_jsx("img", { src: "/Gabby.jpg", alt: "Gabby Logo", className: "w-full h-full object-cover cursor-pointer", onClick: () => setIsPlaying(true) })) }), _jsx("p", { className: "text-xl font-bold", style: {
                                        fontFamily: "'Brush Script MT', cursive",
                                        background: 'linear-gradient(to right, #39FF14, #FFD700, #FF007F, #00FFFF, #FF00FF)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }, children: "The world's first AI super app!" }), _jsx("div", { className: "mt-2", children: _jsx("img", { src: "/logoimage.jpg", alt: "My AI Partner Logo", className: "h-20 w-48" }) })] }), showVerificationMessage ? (_jsxs("div", { className: "text-center text-white", children: [_jsx("h3", { className: "text-xl font-bold mb-2", children: "Check Your Email" }), _jsx("p", { children: message })] })) : (_jsxs("form", { onSubmit: handleAuth, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true }), _jsx("input", { type: "password", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true }), message && (_jsx("div", { className: `p-3 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`, children: message })), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 glassy-btn neon-grid-btn", children: loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In') }), _jsx("div", { className: "text-center text-gray-500 my-4", children: "OR" }), _jsxs("button", { type: "button", onClick: handleGoogleSignIn, disabled: loading, className: "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 glassy-btn neon-grid-btn", style: { marginTop: '-20px' }, children: [_jsx("svg", { version: "1.1", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 48 48", className: "w-5 h-5", children: _jsxs("g", { children: [_jsx("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }), _jsx("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }), _jsx("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }), _jsx("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" }), _jsx("path", { fill: "none", d: "M0 0h48v48H0z" })] }) }), "Sign In with Google"] }), _jsx("div", { className: "text-center mt-4", children: _jsx("button", { type: "button", onClick: handleForgotPassword, className: "text-sm text-blue-400 hover:underline", children: "Forgot Password?" }) }), _jsx("div", { className: "text-center mt-2", children: _jsxs("p", { className: "text-sm text-gray-400", children: [isSignUp ? 'Already have an account?' : "Don't have an account?", _jsx("button", { type: "button", onClick: () => setIsSignUp(!isSignUp), className: "ml-1 text-blue-400 hover:underline font-bold", children: isSignUp ? 'Sign In' : 'Sign Up' })] }) })] }))] })] }) }));
}

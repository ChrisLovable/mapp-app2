import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setMessage('');
      setMessageType('');
      setShowVerificationMessage(false);
    }
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          setMessage(error.message);
          setMessageType('error');
        } else {
          setShowVerificationMessage(true);
          setMessage('Please check your email for verification link!');
          setMessageType('success');
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setMessage(error.message);
          setMessageType('error');
        } else if (data.user) {
          onAuthSuccess(data.user);
          onClose();
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Please enter your email address first');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('Password reset email sent!');
        setMessageType('success');
      }
    } catch (error) {
      setMessage('Failed to send reset email');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/signupbackground.jpg') no-repeat center center / cover`,
        height: '100vh'
      }}
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showVerificationMessage ? (
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-white/80 mb-4">
                We've sent a verification link to <strong className="text-white">{email}</strong>
              </p>
              <p className="text-sm text-white/60">
                Click the link in your email to verify your account and start using the app.
              </p>
            </div>
            <button
              onClick={() => {
                setShowVerificationMessage(false);
                setIsSignUp(false);
              }}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm backdrop-blur-sm border ${
                messageType === 'success' 
                  ? 'bg-green-500/20 text-green-200 border-green-400/30' 
                  : 'bg-red-500/20 text-red-200 border-red-400/30'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            {!isSignUp && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading || !email}
                className="w-full text-white/70 hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot Password?
              </button>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
                setMessageType('');
              }}
              className="ml-1 text-white/70 hover:text-white transition-colors font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 
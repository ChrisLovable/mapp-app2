import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';

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

  const handleAuth = async (e: React.FormEvent) => {
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
        } else if (data.user) {
          setShowVerificationMessage(true);
          setMessage('Please check your email for a verification link.');
          setMessageType('success');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
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
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
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
    } else {
      setMessage('Password reset link sent. Please check your email.');
      setMessageType('success');
    }
    setLoading(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md">
      <div 
        className="relative w-full mx-auto bg-black border-2 border-blue-500 rounded-2xl shadow-lg shadow-blue-500/50 overflow-y-auto"
        style={{ width: '85vw', maxWidth: '600px', height: '90vh', minHeight: '500px' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center mb-2">
            <div className="relative w-64 h-48 rounded-lg mb-2 overflow-hidden shadow-lg">
              {isPlaying ? (
                <>
                  <video
                    src="/introvideo.mp4"
                    autoPlay
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-75"
                  >
                    Stop
                  </button>
                </>
              ) : (
                <img
                  src="/Gabby.jpg"
                  alt="Gabby Logo"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsPlaying(true)}
                />
              )}
            </div>
            <p 
              className="text-xl font-bold" 
              style={{
                fontFamily: "'Brush Script MT', cursive",
                background: 'linear-gradient(to right, #39FF14, #FFD700, #FF007F, #00FFFF, #FF00FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The world's first AI super app!
            </p>
            <div className="mt-2">
              <img src="/logoimage.jpg" alt="My AI Partner Logo" className="h-20 w-48" />
            </div>
          </div>

          {showVerificationMessage ? (
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">Check Your Email</h3>
              <p>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              
              {message && (
                <div className={`p-3 rounded-lg text-center text-sm ${messageType === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 glassy-btn neon-grid-btn"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>

              <div className="text-center mt-4">
                <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-400 hover:underline">
                  Forgot Password?
                </button>
              </div>

              <div className="text-center mt-2">
                <p className="text-sm text-gray-400">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-blue-400 hover:underline font-bold">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

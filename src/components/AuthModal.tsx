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

    // Validate inputs
    if (!email || !password) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Check if email already exists before attempting sign-up
        console.log('Checking if email already exists...');
        const emailExists = await checkEmailExists(email);
        
        if (emailExists) {
          setMessage('An account with this email already exists. Please sign in instead or use a different email address.');
          setMessageType('error');
          // Automatically switch to sign in mode after 3 seconds
          setTimeout(() => {
            setIsSignUp(false);
            setMessage('');
            setMessageType('');
          }, 3000);
          setLoading(false);
          return;
        }
        
        // Sign up with proper email verification
        console.log('Signing up with:', email.trim(), password.length > 0 ? '[PASSWORD_PROVIDED]' : '[NO_PASSWORD]');
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              email_confirm: true
            }
          }
        });

        console.log('Sign up response:', { data, error });

        if (error) {
          console.error('Sign up error:', error);
          
          // Handle specific error cases
          if (error.message.includes('User already registered') || 
              error.message.includes('already been registered') ||
              error.message.includes('already exists')) {
            setMessage('An account with this email already exists. Please sign in instead or use a different email address.');
            setMessageType('error');
            // Automatically switch to sign in mode
            setTimeout(() => {
              setIsSignUp(false);
            }, 3000);
          } else if (error.message.includes('Invalid email')) {
            setMessage('Please enter a valid email address.');
            setMessageType('error');
          } else if (error.message.includes('Password')) {
            setMessage('Password must be at least 6 characters long.');
            setMessageType('error');
          } else {
            setMessage(error.message || 'Failed to create account. Please try again.');
            setMessageType('error');
          }
        } else if (data.user && !data.session) {
          // Email confirmation required
          console.log('Email confirmation required for user:', data.user.email);
          setShowVerificationMessage(true);
          setMessage('Please check your email for verification link! Check your spam folder if you don\'t see it.');
          setMessageType('success');
        } else if (data.session && data.user) {
          // Auto-confirmed (if email confirmation is disabled)
          console.log('User auto-confirmed:', data.user.email);
          onAuthSuccess(data.user);
          onClose();
        } else {
          console.log('Unexpected sign up response:', data);
          setMessage('Account created but verification status unclear. Please check your email.');
          setMessageType('success');
        }
      } else {
        // Sign in with proper error handling
        console.log('Signing in with:', email.trim(), password.length > 0 ? '[PASSWORD_PROVIDED]' : '[NO_PASSWORD]');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        console.log('Sign in response:', { data, error });

        if (error) {
          console.error('Sign in error:', error);
          if (error.message.includes('Email not confirmed')) {
            setMessage('Please verify your email address first. Check your inbox and spam folder.');
            setMessageType('error');
          } else {
            setMessage(error.message || 'Failed to sign in');
            setMessageType('error');
          }
        } else if (data.user) {
          console.log('User signed in successfully:', data.user.email);
          onAuthSuccess(data.user);
          onClose();
        } else {
          console.log('Unexpected sign in response:', data);
          setMessage('Sign in completed but user data is missing.');
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if email is already registered
  const checkEmailExists = async (email: string) => {
    try {
      // Try to sign in with a dummy password to check if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: 'dummy-password-for-check'
      });
      
      // If we get a specific error, the user exists but password is wrong
      if (error && (error.message.includes('Invalid login credentials') || 
                    error.message.includes('Invalid email or password'))) {
        return true; // User exists
      }
      
      return false; // User doesn't exist or other error
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        setMessage(error.message || 'Failed to send reset email');
        setMessageType('error');
      } else {
        setMessage('Password reset email sent! Check your inbox and spam folder.');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage('Failed to send reset email. Please try again.');
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
        <div className="relative mb-6 px-4 py-3 rounded-xl simple-double-border" style={{ background: 'linear-gradient(135deg, #000000 0%, #666666 100%)', border: '4px double rgba(255, 255, 255, 0.9)' }}>
          <h2 className="text-white font-bold text-base text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#000000', fontSize: '15px' }}
            aria-label="Close modal"
          >
            ×
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
            {!isSupabaseAvailable && (
              <div className="p-4 rounded-xl text-sm backdrop-blur-sm border bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                <p className="font-medium mb-2">⚠️ Supabase Not Configured</p>
                <p className="text-xs">
                  Authentication is in demo mode. To enable real authentication, add your Supabase credentials to the environment variables.
                </p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                autoComplete={isSignUp ? "new-password" : "current-password"}
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
                <div className="flex flex-col space-y-2">
                  <div>{message}</div>
                  {messageType === 'error' && message.includes('already exists') && (
                    <button
                      onClick={() => {
                        setIsSignUp(false);
                        setMessage('');
                        setMessageType('');
                      }}
                      className="text-xs text-blue-300 hover:text-blue-200 underline mt-1"
                    >
                      Switch to Sign In
                    </button>
                  )}
                </div>
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
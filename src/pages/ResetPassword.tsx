import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    const access_token = searchParams.get("access_token");

    console.log('Reset password params:', { type, access_token });

    if (type === "recovery" && access_token) {
      // Set the session with the recovery token
      supabase.auth.setSession({
        access_token,
        refresh_token: access_token,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Session error:', error);
          setMessage('Invalid or expired reset link. Please request a new password reset.');
          setMessageType('error');
        } else {
          console.log('Session set successfully');
          setIsValidToken(true);
        }
      });
    } else {
      setMessage('Invalid reset link. Please check your email for the correct link.');
      setMessageType('error');
    }
  }, [searchParams]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error('Password update error:', error);
        setMessage(error.message || 'Failed to update password');
        setMessageType('error');
      } else {
        console.log('Password updated successfully');
        setPasswordUpdated(true);
        setMessage('Password updated successfully! You can now sign in with your new password.');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Password Updated!</h2>
            <div className="bg-green-500/20 text-green-200 border border-green-400/30 rounded-xl p-4 mb-6">
              <p className="text-sm">Your password has been successfully updated.</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-white/80">Enter your new password below</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm backdrop-blur-sm border mb-6 ${
            messageType === 'success' 
              ? 'bg-green-500/20 text-green-200 border-green-400/30' 
              : 'bg-red-500/20 text-red-200 border-red-400/30'
          }`}>
            {message}
          </div>
        )}

        {isValidToken ? (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-white/90 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-white/60 mb-4">Invalid or expired reset link.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
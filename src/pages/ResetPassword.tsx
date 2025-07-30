import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError('Error updating password: ' + error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError('Unexpected error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Success!</h2>
            <div className="bg-green-500/20 text-green-200 border border-green-400/30 rounded-xl p-4 mb-6">
              <p className="text-sm">Password updated! You can now log in.</p>
            </div>
            <button
              onClick={() => navigate('/')}
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

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-white/90 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-200 border border-red-400/30 rounded-xl p-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
} 
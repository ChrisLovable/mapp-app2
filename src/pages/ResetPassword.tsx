import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const accessToken = new URLSearchParams(hash).get("access_token");
    const type = new URLSearchParams(hash).get("type");

    if (type === "recovery" && accessToken) {
      setToken(accessToken);
    } else {
      setError("Invalid or expired link.");
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (!token) {
      setError("No valid token found.");
      return;
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Error</h2>
          <div className="bg-red-500/20 text-red-200 border border-red-400/30 rounded-xl p-4 mb-6">
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Success!</h2>
          <div className="bg-green-500/20 text-green-200 border border-green-400/30 rounded-xl p-4 mb-6">
            <p className="text-sm">Password updated! You can now log in.</p>
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

  return token ? (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-white/80">Enter your new password below</p>
        </div>

        <div className="space-y-6">
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

          <button
            onClick={handleUpdatePassword}
            className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Loading</h2>
          <p className="text-white/80">Loading reset form...</p>
        </div>
      </div>
    </div>
  );
} 
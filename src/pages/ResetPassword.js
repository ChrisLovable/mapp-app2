import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) {
                setError('Error updating password: ' + error.message);
            }
            else {
                setSuccess(true);
            }
        }
        catch (err) {
            setError('Unexpected error: ' + err.message);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (success) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900", children: _jsx("div", { className: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-6", children: "Success!" }), _jsx("div", { className: "bg-green-500/20 text-green-200 border border-green-400/30 rounded-xl p-4 mb-6", children: _jsx("p", { className: "text-sm", children: "Password updated! You can now log in." }) }), _jsx("button", { onClick: () => navigate('/'), className: "w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30", children: "Go to Sign In" })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900", children: _jsxs("div", { className: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Reset Password" }), _jsx("p", { className: "text-white/80", children: "Enter your new password below" })] }), _jsxs("form", { onSubmit: handleReset, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-medium text-white/90 mb-2", children: "New Password" }), _jsx("input", { id: "newPassword", type: "password", placeholder: "Enter new password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), autoComplete: "new-password", required: true, minLength: 6, className: "w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300" })] }), error && (_jsx("div", { className: "bg-red-500/20 text-red-200 border border-red-400/30 rounded-xl p-4", children: _jsx("p", { className: "text-sm", children: error }) })), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? "Updating..." : "Reset Password" })] })] }) }));
}

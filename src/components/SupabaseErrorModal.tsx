import React from 'react';

interface SupabaseErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseErrorModal({ isOpen, onClose }: SupabaseErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Configuration Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This app requires Supabase configuration to function properly. Please ensure the following environment variables are set:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-red-600 mb-2">Missing variables:</p>
            <code className="text-xs text-gray-800">
              VITE_SUPABASE_URL<br/>
              VITE_SUPABASE_ANON_KEY
            </code>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-blue-800 font-medium mb-1">Troubleshooting:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Check browser console for debug logs</li>
              <li>• Verify environment variables in Vercel dashboard</li>
              <li>• Ensure variables start with VITE_ prefix</li>
              <li>• Redeploy after adding variables</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            If you're deploying to Vercel, add these variables in your project settings under Environment Variables.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
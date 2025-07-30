import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // 🛡️ Show error toast
    const showErrorToast = () => {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full bg-red-600 text-white border border-red-700';
      
      toast.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">🚨</div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold">Application Error</h4>
            <p class="text-sm mt-1 opacity-90">Something went wrong. Please refresh the page.</p>
          </div>
          <button class="flex-shrink-0 ml-2 text-white opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
      }, 10);
      
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 8000);
    };
    
    showErrorToast();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 border border-red-500">
            <div className="text-center">
              <div className="text-4xl mb-4">🚨</div>
              <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
              <p className="text-gray-400 mb-4">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {this.state.error && (
                <details className="text-left text-sm text-gray-500 mb-4">
                  <summary className="cursor-pointer hover:text-gray-400">Error Details</summary>
                  <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    state = {
        hasError: false
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // In production, you would send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-900 text-white p-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-300 mb-4", children: "We're sorry, but something unexpected happened. Please try refreshing the page." }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors", children: "Refresh Page" })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;

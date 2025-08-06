import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function LoadingSpinner({ size = 'md', color = 'white', text }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    const colorClasses = {
        white: 'text-white',
        blue: 'text-blue-600',
        gray: 'text-gray-600'
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx("div", { className: `animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}` }), text && (_jsx("p", { className: `mt-2 text-sm ${colorClasses[color]}`, children: text }))] }));
}

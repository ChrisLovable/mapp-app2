import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/StyledNotification.tsx
import React from 'react';
const StyledNotification = ({ message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };
    const getColors = () => {
        switch (type) {
            case 'success': return { ring: 'ring-green-400', bg: 'rgba(34, 197, 94, 0.2)' };
            case 'error': return { ring: 'ring-red-400', bg: 'rgba(239, 68, 68, 0.2)' };
            case 'info': return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
            default: return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
        }
    };
    const colors = getColors();
    // Auto-close after 3 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (_jsx("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsx("div", { className: `glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ${colors.ring} ring-opacity-60`, style: {
                background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), ${colors.bg})`,
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                filter: `drop-shadow(0 0 10px ${colors.ring.includes('green') ? 'rgba(34, 197, 94, 0.5)' : colors.ring.includes('red') ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'})`,
                transform: 'translateZ(30px) perspective(1000px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-3xl", style: {
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                            textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                            transform: 'translateZ(10px)'
                        }, children: getIcon() }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-white font-bold text-lg", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(5px)'
                            }, children: message }) }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button", style: {
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(10px)'
                        }, children: "\u00D7" })] }) }) }));
};
export default StyledNotification;

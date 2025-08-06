import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 max-w-sm w-full mx-4 flex flex-col", style: { boxSizing: 'border-box', border: '2px solid white' }, children: [_jsx("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px)'
                    }, children: _jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                            transform: 'translateZ(3px)'
                        }, children: title }) }), _jsxs("div", { className: "px-4 pb-4", children: [_jsx("p", { className: "mb-6 text-white text-center", children: message }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: onCancel, className: "glassy-btn neon-grid-btn px-6 py-2 rounded-xl text-white font-bold transition-colors border-0", style: { background: '#111' }, children: cancelText }), _jsx("button", { onClick: onConfirm, className: "glassy-btn neon-grid-btn px-6 py-2 rounded-xl text-white font-bold transition-colors border-0", style: { background: '#111' }, children: confirmText })] })] })] }) }));
};
export default ConfirmationModal;

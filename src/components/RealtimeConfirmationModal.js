import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default function RealtimeConfirmationModal({ isOpen, onConfirm, onCancel, matchedTriggers = [] }) {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsxs("div", { className: "glassy-btn neon-grid-btn rounded-2xl border-0 p-0 w-full max-w-md mx-4 flex flex-col ring-2 ring-blue-400 ring-opacity-60", style: {
                boxSizing: 'border-box',
                maxHeight: '90vh',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                transform: 'translateZ(30px) perspective(1000px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px)'
                    }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(3px)'
                            }, children: "Real-time Question Detected" }), _jsx("button", { onClick: onCancel, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 px-4 pb-4 overflow-y-auto", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "text-6xl", style: {
                                        filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.6)) drop-shadow(0 0 16px rgba(255, 165, 0, 0.4))',
                                        textShadow: '0 0 10px rgba(255, 165, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.6)',
                                    }, children: "\u26A0\uFE0F" }) }), _jsxs("div", { className: "text-white text-center space-y-3", children: [_jsx("p", { className: "font-bold text-lg", style: {
                                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                            transform: 'translateZ(5px)'
                                        }, children: "This question may require real-time or up-to-date information." }), _jsx("p", { className: "text-gray-300", style: {
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                                            filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.3))',
                                            transform: 'translateZ(3px)'
                                        }, children: "To ensure accuracy, we recommend checking an online source for the most current data." }), _jsx("p", { className: "text-gray-400", style: {
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                                            filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.2))',
                                            transform: 'translateZ(2px)'
                                        }, children: "I can provide a general answer, but please note it might not reflect the latest information." }), _jsx("p", { className: "font-semibold text-white", style: {
                                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                            transform: 'translateZ(4px)'
                                        }, children: "Would you like to continue with a general answer?" })] }), matchedTriggers.length > 0 && (_jsxs("div", { className: "mt-4 p-3 rounded-lg border", style: {
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(59, 130, 246, 0.1))',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }, children: [_jsx("p", { className: "text-xs text-gray-300 mb-2", style: {
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                                            filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.2))'
                                        }, children: "Detected keywords:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: matchedTriggers.map((trigger, index) => (_jsx("span", { className: "px-2 py-1 text-xs text-white rounded", style: {
                                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                                filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))'
                                            }, children: trigger }, index))) })] })), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: onCancel, className: "flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 glassy-btn", style: {
                                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                                            border: '2px solid rgba(255, 255, 255, 0.4)',
                                            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                            backdropFilter: 'blur(10px)',
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                            filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
                                            transform: 'translateZ(5px)'
                                        }, children: "Cancel" }), _jsx("button", { onClick: onConfirm, className: "flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 glassy-btn", style: {
                                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                                            border: '2px solid rgba(255, 255, 255, 0.4)',
                                            boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                            backdropFilter: 'blur(10px)',
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                            filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))',
                                            transform: 'translateZ(5px)'
                                        }, children: "Continue Anyway" })] })] }) })] }) }));
}

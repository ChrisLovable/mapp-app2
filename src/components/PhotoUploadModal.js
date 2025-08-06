import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef } from 'react';
const PhotoUploadModal = ({ isOpen, onClose, onPhotoUpload }) => {
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4", children: [_jsx("div", { className: "w-full flex items-center justify-center", children: _jsx("div", { className: "rounded-2xl bg-black p-4 w-full flex flex-col border-0 transition-all duration-300 relative", style: { boxSizing: 'border-box', border: '2px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)', maxWidth: '400px' }, children: _jsxs("div", { className: "overflow-y-auto", children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl glassy-btn", style: {
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
                                        }, children: "Choose Photo Source" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-4 px-4", children: [_jsx("button", { className: "w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border", style: { background: '#111', fontSize: '1rem' }, onClick: () => {
                                            console.log('Camera button clicked');
                                            setTimeout(() => {
                                                console.log('Triggering camera input');
                                                cameraInputRef.current?.click();
                                            }, 0);
                                        }, children: "Use Camera" }), _jsx("button", { className: "w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border", style: { background: '#111', fontSize: '1rem' }, onClick: () => {
                                            console.log('Gallery button clicked');
                                            setTimeout(() => {
                                                console.log('Triggering gallery input');
                                                galleryInputRef.current?.click();
                                            }, 0);
                                        }, children: "Select from Gallery" })] })] }) }) }), _jsx("input", { ref: cameraInputRef, type: "file", multiple: true, accept: "image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif", capture: "environment", onChange: (event) => {
                    console.log('Camera input changed:', event.target.files);
                    if (event.target.files) {
                        onPhotoUpload(event.target.files);
                        onClose();
                    }
                }, style: { display: 'none' } }), _jsx("input", { ref: galleryInputRef, type: "file", multiple: true, accept: "image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif", onChange: (event) => {
                    console.log('Gallery input changed:', event.target.files);
                    if (event.target.files) {
                        onPhotoUpload(event.target.files);
                        onClose();
                    }
                }, style: { display: 'none' } })] }));
};
export default PhotoUploadModal;

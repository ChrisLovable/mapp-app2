import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
export default function ImageModal({ onClose, onImageUpload }) {
    const [imageUrls, setImageUrls] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const fileInputRef = useRef(null);
    const handleAddUrl = () => {
        if (newUrl.trim()) {
            setImageUrls([...imageUrls, newUrl.trim()]);
            setNewUrl('');
        }
    };
    const handleFileUpload = (event) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        setImageUrls([...imageUrls, e.target.result]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };
    const handleRemoveImage = (index) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };
    const handleSave = () => {
        onImageUpload(imageUrls);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\uD83D\uDCF7 Add Photos" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white text-2xl", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "\uD83D\uDD17 Add Image URL" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "url", value: newUrl, onChange: (e) => setNewUrl(e.target.value), placeholder: "https://example.com/image.jpg", className: "flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-white", onKeyPress: (e) => e.key === 'Enter' && handleAddUrl() }), _jsx("button", { onClick: handleAddUrl, className: "px-4 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm", style: {
                                                background: `linear-gradient(to bottom, var(--primary-color), var(--accent-color))`,
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-color)',
                                            }, children: "Add" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "\uD83D\uDCC1 Upload Images" }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/*", onChange: handleFileUpload, className: "hidden" }), _jsx("button", { onClick: () => fileInputRef.current?.click(), className: "w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors", children: "\uD83D\uDCC1 Click to select images or drag and drop" })] }), imageUrls.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold mb-3", children: ["\uFFFD\uFFFD Selected Images (", imageUrls.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: imageUrls.map((url, index) => (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: url, alt: `Preview ${index + 1}`, className: "w-full h-32 object-cover rounded-lg", onError: (e) => {
                                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                                                } }), _jsx("button", { onClick: () => handleRemoveImage(index), className: "absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity", children: "\u00D7" })] }, index))) })] })), _jsxs("div", { className: "flex justify-end gap-4 pt-4 border-t border-gray-700", children: [_jsx("button", { onClick: onClose, className: "px-6 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm border border-gray-600 text-gray-300 hover:bg-gray-700", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: imageUrls.length === 0, className: "px-6 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed", style: {
                                        background: `linear-gradient(to bottom, var(--primary-color), var(--accent-color))`,
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)',
                                    }, children: "\uD83D\uDCBE Save Images" })] })] })] }) }));
}

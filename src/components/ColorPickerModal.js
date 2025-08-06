import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const ColorPickerModal = ({ isOpen, onClose, color, onChange }) => {
    if (!isOpen) {
        return null;
    }
    const commonColors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#000000', '#FFFFFF', '#808080', '#800000', '#008000', '#000080'
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75", children: _jsxs("div", { className: "relative w-full max-w-md p-4 bg-gray-800 rounded-lg", children: [_jsx("h3", { className: "text-white text-lg mb-4", children: "Pick a Color" }), _jsx("input", { type: "color", value: color, onChange: (e) => onChange({ hex: e.target.value }), className: "w-full h-12 mb-4 rounded cursor-pointer" }), _jsx("div", { className: "grid grid-cols-6 gap-2 mb-4", children: commonColors.map((c) => (_jsx("button", { onClick: () => onChange({ hex: c }), className: "w-8 h-8 rounded border-2 border-gray-600 hover:border-white", style: { backgroundColor: c } }, c))) }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold hover:bg-gray-600", children: "\u00D7" })] }) }));
};
export default ColorPickerModal;

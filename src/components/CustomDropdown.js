import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
const CustomDropdown = ({ options, selectedValue, onChange, placeholder = "Select an option" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const handleOptionClick = (value) => {
        onChange(value);
        setIsOpen(false);
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const selectedOption = options.find(option => option.value === selectedValue);
    return (_jsxs("div", { className: "relative w-full", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "w-full p-2 text-sm text-white bg-gradient-to-r from-black to-blue-600 rounded-md flex items-center justify-between", children: [_jsx("span", { style: selectedOption?.style, children: selectedOption?.name || placeholder }), isOpen ? _jsx(FaChevronUp, {}) : _jsx(FaChevronDown, {})] }), isOpen && (_jsx("div", { className: "absolute z-10 w-full mt-1 bg-gradient-to-r from-black to-blue-800 border border-blue-500 rounded-md shadow-lg", children: _jsx("ul", { className: "max-h-48 overflow-y-auto", children: options.map((option) => (_jsx("li", { onClick: () => handleOptionClick(option.value), className: "p-2 text-sm text-white hover:bg-blue-700 cursor-pointer", style: option.style, children: option.name }, option.value))) }) }))] }));
};
export default CustomDropdown;

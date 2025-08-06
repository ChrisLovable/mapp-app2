import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
const menuOptions = [
    { label: 'Personalize', icon: '🎨', hasSubmenu: true },
    { label: 'Dashboard', icon: '📊', action: 'dashboard' },
    { label: 'Instruction videos', icon: '🎥' },
];
const themeOptions = [
    { label: 'Dark Mode', value: 'dark', icon: '🌙' },
    { label: 'Light Mode', value: 'light', icon: '☀️' },
    { label: 'Pink Theme', value: 'pink', icon: '🌸' },
    { label: 'Red Theme', value: 'red', icon: '🔴' },
    { label: 'Blue Theme', value: 'blue', icon: '🔵' },
    { label: 'Green Theme', value: 'green', icon: '🟢' },
];
export default function HeaderTest({ onDashboardClick }) {
    const [open, setOpen] = useState(false);
    const [personalizeOpen, setPersonalizeOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('blue');
    const menuRef = useRef(null);
    // Initialize theme on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'blue';
        setCurrentTheme(savedTheme);
        document.documentElement.className = `theme-${savedTheme}`;
    }, []);
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
                setPersonalizeOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);
    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
        setPersonalizeOpen(false);
        setOpen(false);
        // Apply theme to document
        document.documentElement.className = `theme-${theme}`;
        // Store theme preference
        localStorage.setItem('theme', theme);
    };
    const handlePersonalizeClick = () => {
        setPersonalizeOpen(!personalizeOpen);
    };
    return (_jsxs("div", { className: "relative flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center", ref: menuRef, children: [_jsxs("button", { className: "p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400", onClick: () => setOpen((v) => !v), "aria-label": "Open menu", children: [_jsx("span", { className: "block w-6 h-0.5 bg-white mb-1 rounded" }), _jsx("span", { className: "block w-6 h-0.5 bg-white mb-1 rounded" }), _jsx("span", { className: "block w-6 h-0.5 bg-white rounded" })] }), open && (_jsx("div", { className: "absolute left-0 top-16 w-48 bg-black/90 border border-white rounded-xl shadow-lg z-50", children: menuOptions.map((opt) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between gap-2 px-4 py-3 hover:bg-blue-600/30 cursor-pointer text-white text-base rounded-xl transition-all", onClick: () => {
                                        if (opt.hasSubmenu) {
                                            handlePersonalizeClick();
                                        }
                                        else if (opt.action === 'dashboard' && onDashboardClick) {
                                            onDashboardClick();
                                            setOpen(false);
                                        }
                                        else {
                                            setOpen(false);
                                        }
                                    }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: opt.icon }), _jsx("span", { children: opt.label })] }), opt.hasSubmenu && (_jsx("span", { className: "text-sm", children: "\u25B6" }))] }), opt.hasSubmenu && personalizeOpen && (_jsx("div", { className: "ml-4 mt-1 bg-black/80 border border-white/50 rounded-lg", children: themeOptions.map((theme) => (_jsxs("div", { className: `flex items-center gap-2 px-3 py-2 hover:bg-blue-600/30 cursor-pointer text-white text-sm transition-all ${currentTheme === theme.value ? 'bg-blue-600/50' : ''}`, onClick: () => handleThemeChange(theme.value), children: [_jsx("span", { className: "text-lg", children: theme.icon }), _jsx("span", { children: theme.label }), currentTheme === theme.value && (_jsx("span", { className: "ml-auto text-blue-400", children: "\u2713" }))] }, theme.value))) }))] }, opt.label))) }))] }), _jsx("div", { className: "w-10" })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ThreeDComponent from './ThreeDComponent';
const ThreeDTest = () => {
    return (_jsxs("div", { style: { padding: '20px', background: '#000', minHeight: '100vh' }, children: [_jsx("h1", { style: { color: 'white', marginBottom: '20px' }, children: "3D Component Test" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsx(ThreeDComponent, { depth: "xs", backgroundColor: "#333333", width: "300px", height: "60px", children: _jsx("h2", { style: { color: 'white', margin: 0 }, children: "XS Depth Test" }) }), _jsx(ThreeDComponent, { depth: "sm", backgroundColor: "#444444", width: "300px", height: "60px", children: _jsx("h2", { style: { color: 'white', margin: 0 }, children: "SM Depth Test" }) }), _jsx(ThreeDComponent, { depth: "md", backgroundColor: "#555555", width: "300px", height: "60px", children: _jsx("h2", { style: { color: 'white', margin: 0 }, children: "MD Depth Test" }) }), _jsx(ThreeDComponent, { depth: "lg", backgroundColor: "#666666", width: "300px", height: "60px", children: _jsx("h2", { style: { color: 'white', margin: 0 }, children: "LG Depth Test" }) })] })] }));
};
export default ThreeDTest;

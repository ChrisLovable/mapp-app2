import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const ThreeDComponent = ({ children, className = '', style = {}, backgroundColor = '#333333', borderColor = 'rgba(255, 255, 255, 0.9)', borderRadius = '30px', width = '100%', height = '50px', onClick }) => {
    const simpleStyles = {
        backgroundColor,
        borderRadius,
        width,
        height,
        border: `4px double ${borderColor}`,
        position: 'relative',
        zIndex: 1,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
    };
    return (_jsx("div", { className: `simple-double-border ${className}`, style: simpleStyles, onClick: onClick, children: children }));
};
export default ThreeDComponent;

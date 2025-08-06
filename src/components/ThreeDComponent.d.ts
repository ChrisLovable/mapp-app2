import React from 'react';
interface ThreeDComponentProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    depth?: string;
    onClick?: () => void;
}
declare const ThreeDComponent: React.FC<ThreeDComponentProps>;
export default ThreeDComponent;

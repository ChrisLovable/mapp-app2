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
  onClick?: () => void;
}

const ThreeDComponent: React.FC<ThreeDComponentProps> = ({
  children,
  className = '',
  style = {},
  backgroundColor = '#333333',
  borderColor = 'rgba(255, 255, 255, 0.9)',
  borderRadius = '30px',
  width = '100%',
  height = '50px',
  onClick
}) => {
  const simpleStyles: React.CSSProperties = {
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

  return (
    <div
      className={`simple-double-border ${className}`}
      style={simpleStyles}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ThreeDComponent; 
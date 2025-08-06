import React from 'react';
interface Option {
    name: string;
    value: string;
    style?: React.CSSProperties;
}
interface CustomDropdownProps {
    options: Option[];
    selectedValue: string;
    onChange: (value: string) => void;
    placeholder?: string;
}
declare const CustomDropdown: React.FC<CustomDropdownProps>;
export default CustomDropdown;

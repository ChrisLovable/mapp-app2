import React from 'react';
interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    color: string;
    onChange: (color: {
        hex: string;
    }) => void;
}
declare const ColorPickerModal: React.FC<ColorPickerModalProps>;
export default ColorPickerModal;

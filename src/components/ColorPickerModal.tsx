import React from 'react';
import { SketchPicker } from 'react-color';
import type { ColorResult } from 'react-color';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  onChange: (color: ColorResult) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, color, onChange }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative w-full max-w-md p-4">
        <SketchPicker
          color={color}
          onChange={onChange}
          width="100%"
          styles={{
            default: {
              picker: {
                background: '#1a1a1a',
                border: '1px solid #333',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
              }
            }
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-2 mr-2 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-2xl font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ColorPickerModal;

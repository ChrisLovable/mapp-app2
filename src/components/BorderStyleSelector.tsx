import React from 'react';

interface BorderStyleSelectorProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

const borderStyles = [
  { id: 'rainbow', name: 'Rainbow', class: 'animated-rainbow-border' },
  { id: 'neon-blue', name: 'Neon Blue', class: 'animated-neon-blue-border' },
  { id: 'neon-green', name: 'Neon Green', class: 'animated-neon-green-border' },
  { id: 'neon-purple', name: 'Neon Purple', class: 'animated-neon-purple-border' },
  { id: 'neon-yellow', name: 'Neon Yellow', class: 'animated-neon-yellow-border' },
];

export default function BorderStyleSelector({ currentStyle, onStyleChange }: BorderStyleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">Border Style</label>
      <div className="grid grid-cols-2 gap-2">
        {borderStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.class)}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              currentStyle === style.class
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
} 
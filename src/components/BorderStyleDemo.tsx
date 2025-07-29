import React, { useState } from 'react';
import BorderStyleSelector from './BorderStyleSelector';

export default function BorderStyleDemo() {
  const [borderStyle, setBorderStyle] = useState('animated-rainbow-border');

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Border Style Demo</h2>
      
      {/* Border Style Selector */}
      <BorderStyleSelector 
        currentStyle={borderStyle} 
        onStyleChange={setBorderStyle} 
      />
      
      {/* Demo Elements */}
      <div className="space-y-4">
        <div className={`p-4 ${borderStyle} bg-white text-black`}>
          <h3 className="font-bold mb-2">Text Area Demo</h3>
          <p>This is a sample text area with the selected border style: {borderStyle}</p>
        </div>
        
        <div className={`p-4 ${borderStyle} bg-white text-black`}>
          <h3 className="font-bold mb-2">Card Demo</h3>
          <p>This is a sample card with the selected border style.</p>
        </div>
        
        <div className={`p-4 ${borderStyle} bg-white text-black`}>
          <h3 className="font-bold mb-2">Modal Demo</h3>
          <p>This simulates how a modal would look with the selected border style.</p>
        </div>
      </div>
      
      <div className="text-white text-sm">
        <p><strong>Current Style:</strong> {borderStyle}</p>
        <p><strong>Available Styles:</strong></p>
        <ul className="list-disc list-inside ml-4">
          <li>animated-rainbow-border</li>
          <li>animated-neon-blue-border</li>
          <li>animated-neon-green-border</li>
          <li>animated-neon-purple-border</li>
          <li>animated-neon-yellow-border</li>
        </ul>
      </div>
    </div>
  );
} 
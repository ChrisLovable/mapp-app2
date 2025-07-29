import React, { useEffect, useState } from 'react';

interface AlarmPopupProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
}

export default function AlarmPopup({ isOpen, onClose, description }: AlarmPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-red-900 rounded-lg p-8 w-full max-w-md transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⏰</div>
          <h2 className="text-2xl font-bold text-white">ALARM!</h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Description */}
          <div className="text-center">
            <label className="block text-sm font-medium text-red-200 mb-2">Reminder:</label>
            <div className="p-4 rounded-lg bg-red-800 border border-red-600">
              <span className="text-white text-lg font-medium">{description}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3 mt-6">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
} 
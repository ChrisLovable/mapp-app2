import React from 'react';

interface RealtimeConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  matchedTriggers?: string[];
}

export default function RealtimeConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  matchedTriggers = [] 
}: RealtimeConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <div 
        className="glassy-btn neon-grid-btn rounded-2xl border-0 p-0 w-full max-w-md mx-4 flex flex-col ring-2 ring-blue-400 ring-opacity-60"
        style={{ 
          boxSizing: 'border-box', 
          maxHeight: '90vh', 
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
          filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
          transform: 'translateZ(30px) perspective(1000px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                          filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
            transform: 'translateZ(5px)'
          }}
        >
          <h2 
            className="text-white font-bold text-base text-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
              transform: 'translateZ(3px)'
            }}
          >
            Real-time Question Detected
          </h2>
          <button
            onClick={onCancel}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#000000', fontSize: '15px' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div 
                className="text-6xl"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.6)) drop-shadow(0 0 16px rgba(255, 165, 0, 0.4))',
                  textShadow: '0 0 10px rgba(255, 165, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.6)',
                }}
              >
                ⚠️
              </div>
            </div>

            {/* Message */}
            <div className="text-white text-center space-y-3">
              <p 
                className="font-bold text-lg"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                  transform: 'translateZ(5px)'
                }}
              >
                This question may require real-time or up-to-date information.
              </p>
              <p 
                className="text-gray-300"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                  filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.3))',
                  transform: 'translateZ(3px)'
                }}
              >
                To ensure accuracy, we recommend checking an online source for the most current data.
              </p>
              <p 
                className="text-gray-400"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                  filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.2))',
                  transform: 'translateZ(2px)'
                }}
              >
                I can provide a general answer, but please note it might not reflect the latest information.
              </p>
              <p 
                className="font-semibold text-white"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                  transform: 'translateZ(4px)'
                }}
              >
                Would you like to continue with a general answer?
              </p>
            </div>

            {/* Detected Triggers (if any) */}
            {matchedTriggers.length > 0 && (
              <div 
                className="mt-4 p-3 rounded-lg border"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(59, 130, 246, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <p 
                  className="text-xs text-gray-300 mb-2"
                  style={{
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                    filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.2))'
                  }}
                >
                  Detected keywords:
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchedTriggers.map((trigger, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs text-white rounded"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))'
                      }}
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 glassy-btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                  filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
                  transform: 'translateZ(5px)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 glassy-btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                  filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))',
                  transform: 'translateZ(5px)'
                }}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
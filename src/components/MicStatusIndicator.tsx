import React from 'react';
import { useMicManager } from '../contexts/MicManagerContext';

const MicStatusIndicator: React.FC = () => {
  const { isListening, micBusy, currentOwner, isSupported } = useMicManager();

  if (!isSupported) {
    return (
      <div className="fixed top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold z-[9999]">
        🎤 Mic Not Supported
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm font-bold z-[9999] border border-blue-500">
      <div className="flex items-center space-x-2">
        <span className={isListening ? 'text-green-400' : 'text-gray-400'}>
          {isListening ? '🎤' : '🔇'}
        </span>
        <span>
          {isListening ? 'Listening' : 'Idle'}
        </span>
        {micBusy && currentOwner && (
          <span className="text-blue-400 text-xs">
            ({currentOwner})
          </span>
        )}
      </div>
      {micBusy && !isListening && (
        <div className="text-yellow-400 text-xs mt-1">
          Mic Busy by {currentOwner}
        </div>
      )}
    </div>
  );
};

export default MicStatusIndicator; 
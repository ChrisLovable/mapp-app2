import React, { useState } from 'react';
import { useMicManager } from '../contexts/MicManagerContext';

const MicConcurrencyTest: React.FC = () => {
  const { micBusy, currentOwner, requestMicAccess, releaseMicAccess, forceStopMic } = useMicManager();
  const [testOwner, setTestOwner] = useState('TestComponent');
  const [hasAccess, setHasAccess] = useState(false);

  const handleRequestAccess = () => {
    const granted = requestMicAccess(testOwner);
    setHasAccess(granted);
    if (granted) {
      alert(`✅ Mic access granted to ${testOwner}`);
    } else {
      alert(`❌ Mic access denied. Currently busy by: ${currentOwner}`);
    }
  };

  const handleReleaseAccess = () => {
    releaseMicAccess(testOwner);
    setHasAccess(false);
    alert(`🔓 Mic access released by ${testOwner}`);
  };

  const handleForceStop = () => {
    forceStopMic();
    setHasAccess(false);
    alert('🛑 Mic force stopped');
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg border border-blue-500 z-[9999] max-w-sm">
      <h3 className="text-lg font-bold mb-3">🎤 Mic Concurrency Test</h3>
      
      <div className="space-y-3">
        <div className="text-sm">
          <div>Status: {micBusy ? '🔒 Busy' : '🔓 Available'}</div>
          <div>Owner: {currentOwner || 'None'}</div>
          <div>Test Access: {hasAccess ? '✅ Granted' : '❌ Denied'}</div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={testOwner}
            onChange={(e) => setTestOwner(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
            placeholder="Component name"
          />
          
          <div className="flex space-x-2">
            <button
              onClick={handleRequestAccess}
              disabled={micBusy && currentOwner !== testOwner}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              Request Access
            </button>
            
            <button
              onClick={handleReleaseAccess}
              disabled={!hasAccess}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              Release Access
            </button>
          </div>
          
          <button
            onClick={handleForceStop}
            className="w-full px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Force Stop Mic
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicConcurrencyTest; 
import { useContinuousSpeechToText } from '../hooks/useSpeechToText';
import { useState, useEffect } from 'react';

interface Props {
  language: string;
  onResult: (text: string) => void;
}

export default function VoiceInput({ language, onResult }: Props) {
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useContinuousSpeechToText({
    language,
    onResult
  });

  // Add mobile duplication protection
  const [locked, setLocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Debug logging for mobile detection
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('🎤 VoiceInput mounted on device:', navigator.userAgent);
    console.log('🎤 Is mobile device:', isMobile);
    
    // Log debug info on mount
    if (process.env.NODE_ENV === 'development') {
      console.log('🎤 VoiceInput debug info:', {
        isSupported,
        isMobile,
        userAgent: navigator.userAgent
      });
    }
  }, [isSupported]);

  const handleMicClick = () => {
    // 🛡️ MOBILE-PROOF: Early exit if locked
    if (locked) {
      console.log('🎤 Mic click blocked - cooldown active');
      return;
    }

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    console.log('🎤 Mic clicked - isListening:', isListening, 'click #:', newClickCount);
    
    // 🛡️ MOBILE-PROOF: Set lock to prevent rapid successive clicks
    setLocked(true);
    setTimeout(() => setLocked(false), 300);

    // 🛡️ MOBILE-PROOF: Wrap in requestAnimationFrame for Chrome timing
    requestAnimationFrame(() => {
      if (isListening) {
        console.log('🎤 Stopping listening...');
        stopListening();
      } else {
        console.log('🎤 Starting listening...');
        startListening();
      }
    });
  };

  // Additional mobile event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log('🎤 Pointer down event');
    e.preventDefault(); // Prevent default to avoid ghost taps
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('🎤 Touch start event');
    e.preventDefault(); // Prevent default touch behavior
  };

  // Debug helper for testing
  const handleDebugClick = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎤 Debug: Current state:', {
        isListening,
        clickCount,
        locked,
        isSupported
      });
    }
  };

  return (
    <div className="relative">
      <button
        className={`glassy-btn neon-grid-btn p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border-0 active:scale-95 relative overflow-visible
          ${isListening ? 'scale-125 animate-pulse ring-4 ring-red-500 ring-opacity-80 bg-red-600' : ''}
          ${locked && !isListening ? 'opacity-70' : ''}
        `}
        style={{
          background: isListening ? '#dc2626' : '#111',
          color: isListening ? 'white' : 'var(--text-color)',
          boxShadow: isListening
            ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
            : '0 1px 6px 1px #00fff7, 0 2px 8px 0 #000, 0 1px 4px 0 #00fff766, 0 1.5px 3px rgba(30, 64, 175, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 1,
          touchAction: 'manipulation', // Optimize for touch
        }}
        onClick={handleMicClick}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDebugClick} // Debug helper
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
        type="button"
        disabled={!isSupported}
      >
        <span className={`text-4xl transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`}>🎤</span>
        {/* Debug indicator for mobile */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {clickCount}
          </div>
        )}
      </button>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-8 left-0 text-xs text-gray-400 whitespace-nowrap">
          {isListening ? '🔴 Recording' : '⚪ Idle'} | Clicks: {clickCount}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSmartSpeechToText } from '../hooks/useSmartSpeechToText';

interface SpeechToTextProps {
  onTranscriptChange: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  language?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscriptChange,
  onListeningChange,
  language = 'en-US',
  className = '',
  children
}) => {
  // 🛡️ MOBILE-PROOF: Use the global mic manager
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    isSupported
  } = useSmartSpeechToText({
    language,
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        onTranscriptChange?.(text);
      }
    },
    onError: (error) => {
      console.error('❌ SpeechToText error:', error);
    }
  });
  
  // 🔧 FIX: Add visual state that updates immediately
  const [isVisuallyListening, setIsVisuallyListening] = useState(false);
  // 🛡️ MOBILE-PROOF: Add locked flag to prevent duplication
  const [locked, setLocked] = useState(false);

  // 🛡️ MOBILE-PROOF: Handle microphone toggle with protected hook
  const handleMicToggle = () => {
    console.log('🎤 SpeechToText mic toggle:', isListening ? 'stop' : 'start');
    if (isListening) {
      stopListening();
    } else {
      // 🛡️ MOBILE-PROOF: Wrap in requestAnimationFrame to avoid flicker/duplication
      requestAnimationFrame(() => {
        startListening();
      });
    }
  };

  const toggleListening = useCallback(() => {
    // 🛡️ MOBILE-PROOF: Early exit if locked
    if (locked) {
      console.log('🎤 Mic click blocked - cooldown active');
      return;
    }

    // 🛡️ MOBILE-PROOF: Set locked flag with debounce
    setLocked(true);
    setTimeout(() => setLocked(false), 300);

    // 🛡️ MOBILE-PROOF: Wrap in requestAnimationFrame for Chrome timing
    requestAnimationFrame(() => {
      if (isVisuallyListening) {
        console.log('🎤 Stopping listening...');
        setIsVisuallyListening(false);
        stopListening();
      } else {
        console.log('🎤 Starting listening...');
        // 🔧 FIX: Update visual state immediately
        setIsVisuallyListening(true);
        startListening();
      }
    });
  }, [isVisuallyListening, startListening, stopListening, locked]);

  const clearTranscript = useCallback(() => {
    // Transcript is now managed by the global mic manager
    console.log('🎤 SpeechToText: Transcript clear requested');
    onTranscriptChange('');
  }, [onTranscriptChange]);

  // Cleanup on unmount - no longer needed as mic manager handles cleanup
  useEffect(() => {
    return () => {
      // Cleanup is handled by the global mic manager
    };
  }, []);

  if (!isSupported) {
    return (
      <div className={`speech-to-text-not-supported ${className}`}>
        Speech recognition is not supported in this browser.
      </div>
    );
  }

  return (
    <div className={`speech-to-text ${className}`}>
      {children ? (
        React.cloneElement(children as React.ReactElement<any>, {
          onClick: toggleListening,
          onPointerDown: (e: React.PointerEvent) => e.preventDefault(), // 🛡️ MOBILE-PROOF: Prevent ghost tap
          onTouchStart: (e: React.TouchEvent) => e.preventDefault(), // 🛡️ MOBILE-PROOF: Redundant but safe
          className: `w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg ${isVisuallyListening ? 'bg-red-600 border-red-400 hover:bg-red-700 text-white' : 'bg-white border-gray-400 hover:bg-gray-100 text-gray-700'}`,
          style: {
            // 🔧 FIX: Use visual state for styling
            background: isVisuallyListening ? '#dc2626' : '#ffffff',
            color: isVisuallyListening ? '#ffffff' : '#374151',
            border: isVisuallyListening ? '2px solid #dc2626' : '1px solid #9ca3af',
            boxShadow: isVisuallyListening ? '0 0 10px #dc2626' : 'none'
          }
        })
      ) : (
        <button
          onClick={toggleListening}
          onPointerDown={(e) => e.preventDefault()} // 🛡️ MOBILE-PROOF: Prevent ghost tap
          onTouchStart={(e) => e.preventDefault()} // 🛡️ MOBILE-PROOF: Redundant but safe
          className={`mic-button ${isVisuallyListening ? 'listening' : ''}`}
          style={{
            // 🔧 FIX: Use visual state for styling
            background: isVisuallyListening ? '#dc2626' : '#ffffff',
            color: isVisuallyListening ? '#ffffff' : '#374151'
          }}
        >
          {isVisuallyListening ? '🛑 Stop' : '🎤 Start'}
        </button>
      )}
    </div>
  );
};

export default SpeechToText; 
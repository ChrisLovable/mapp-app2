import React, { useState, useRef, useCallback, useEffect } from 'react';

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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  // 🔧 FIX: Add visual state that updates immediately
  const [isVisuallyListening, setIsVisuallyListening] = useState(false);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.error('Speech recognition not supported');
      return;
    }

    // 🔧 FIX: Check if we're on HTTP and show warning
    if (window.location.protocol === 'http:' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // 🔧 TEMPORARY: Allow HTTP for testing
      console.log('🎤 Mobile HTTP detected - attempting speech recognition anyway');
      // alert('🎤 Mobile browsers require HTTPS for microphone access.\n\nPlease try:\n1. Use Chrome on Android\n2. Use Safari on iOS\n3. Or access via HTTPS if available');
      // return;
    }

    // 🔧 FIX: Remove the isListening check to allow restarting
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
        console.log('🎤 Speech recognition result:', event.results);
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results.item(i);
          const transcript = result.item(0).transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Combine final and interim results
        const combinedTranscript = (finalTranscript + interimTranscript).trim();
        
        console.log('🎤 Combined transcript:', combinedTranscript);
        
        // Update local state and notify parent
        setTranscript(combinedTranscript);
        onTranscriptChange(combinedTranscript);
      };

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
        onListeningChange?.(false);
        // 🔧 FIX: Don't reset visual state immediately - let user control it
        // setIsVisuallyListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        // 🔧 FIX: Don't reset visual state on error - let user control it
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('🎤 Error starting speech recognition:', error);
      // 🔧 FIX: Don't reset visual state on error - let user control it
      // setIsVisuallyListening(false);
    }
  }, [isSupported, language, onListeningChange, onTranscriptChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onListeningChange?.(false);
    }
  }, [onListeningChange]);

  const toggleListening = useCallback(() => {
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
  }, [isVisuallyListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    onTranscriptChange('');
  }, [onTranscriptChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
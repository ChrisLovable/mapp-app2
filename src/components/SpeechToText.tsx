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

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
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
        
        // Update local state and notify parent
        setTranscript(combinedTranscript);
        onTranscriptChange(combinedTranscript);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, [isSupported, isListening, language, onListeningChange, onTranscriptChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onListeningChange?.(false);
    }
  }, [onListeningChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

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
          className: `w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg ${isListening ? 'bg-red-600 border-red-400 hover:bg-red-700 text-white' : 'bg-white border-gray-400 hover:bg-gray-100 text-gray-700'}`
        })
      ) : (
        <button
          onClick={toggleListening}
          className={`mic-button ${isListening ? 'listening' : ''}`}
        >
          {isListening ? '🛑 Stop' : '🎤 Start'}
        </button>
      )}
    </div>
  );
};

export default SpeechToText; 
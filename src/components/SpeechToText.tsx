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
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Diagnostic logging
  useEffect(() => {
    console.log('=== SPEECH RECOGNITION DIAGNOSTICS ===');
    console.log('Browser support:', {
      SpeechRecognition: !!window.SpeechRecognition,
      webkitSpeechRecognition: !!window.webkitSpeechRecognition,
      isSupported
    });
    console.log('HTTPS required:', window.location.protocol === 'https:');
    console.log('User agent:', navigator.userAgent);
    console.log('Language:', language);
  }, [language]);

  const startListening = useCallback(() => {
    console.log('=== STARTING SPEECH RECOGNITION ===');
    
    if (!isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      const errorMsg = 'Speech recognition requires HTTPS (except on localhost)';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Check microphone permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        console.log('🎤 Microphone permission status:', result.state);
        if (result.state === 'denied') {
          const errorMsg = 'Microphone access denied. Please allow microphone access in your browser settings.';
          console.error(errorMsg);
          setError(errorMsg);
          return;
        }
      }).catch((error) => {
        console.log('Could not check microphone permissions:', error);
      });
    }

    if (isListening) {
      console.log('Already listening, ignoring start request');
      return; // Already listening
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('✅ Speech recognition started successfully');
        setIsListening(true);
        setError(null);
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
        console.log('🎤 Speech recognition result received:', event.results);
        
        // Handle incremental results properly
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results incrementally
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results.item(i);
          const transcript = result.item(0).transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript = transcript; // Only keep the latest interim
          }
        }

        // Combine final and latest interim results
        const combinedTranscript = (finalTranscript + interimTranscript).trim();
        
        console.log('📝 Transcript updated:', combinedTranscript);

        // Update local state and notify parent
        setTranscript(combinedTranscript);
        onTranscriptChange(combinedTranscript);
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
        onListeningChange?.(false);
        
        // IMPORTANT: When recognition ends, ensure the final transcript is committed.
        // This can help prevent the loss of the last spoken words if 'onend' fires
        // before the last 'onresult' is fully processed.
        if (recognitionRef.current && transcript) {
          onTranscriptChange(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        console.error('Error details:', event);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current = recognition;
      console.log('🚀 Starting speech recognition...');
      recognition.start();
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      setError(`Failed to start speech recognition: ${error}`);
    }
  }, [isSupported, isListening, language, onListeningChange, onTranscriptChange]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping speech recognition...');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onListeningChange?.(false);
    }
  }, [onListeningChange]);

  const toggleListening = useCallback(() => {
    console.log('🔄 Toggling speech recognition, current state:', isListening);
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
      {error && (
        <div className="text-red-500 text-xs mb-1">
          {error}
        </div>
      )}
             {children ? (
         React.cloneElement(children as React.ReactElement<any>, {
           onClick: toggleListening,
           className: `w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg ${isListening ? 'bg-white border-gray-400 hover:bg-gray-100 text-gray-700' : 'bg-white border-gray-400 hover:bg-gray-100 text-gray-700'}`
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
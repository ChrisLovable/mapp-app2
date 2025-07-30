import { useState, useCallback, useEffect, useRef } from 'react';
import { useMicManager } from '../contexts/MicManagerContext';

interface UseSmartSpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

interface UseSmartSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useSmartSpeechToText(options: UseSmartSpeechToTextOptions = {}): UseSmartSpeechToTextReturn {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
    onEnd
  } = options;

  const micManager = useMicManager();
  
  // 🛡️ MOBILE-PROOF: Prevent duplicate requests
  const isRequestingRef = useRef(false);
  const [localTranscript, setLocalTranscript] = useState('');

  // Register event handlers
  useEffect(() => {
    const resultHandler = (text: string, isFinal: boolean) => {
      console.log('🎤 SmartSpeechToText: Result received:', { text, isFinal });
      
      if (isFinal) {
        setLocalTranscript(prev => prev + text);
      }
      
      // Call user's onResult callback
      if (onResult) {
        try {
          onResult(text, isFinal);
        } catch (error) {
          console.error('🎤 SmartSpeechToText: Error in onResult callback:', error);
        }
      }
    };

    const errorHandler = (error: string) => {
      console.error('🎤 SmartSpeechToText: Error received:', error);
      
      // Call user's onError callback
      if (onError) {
        try {
          onError(error);
        } catch (callbackError) {
          console.error('🎤 SmartSpeechToText: Error in onError callback:', callbackError);
        }
      }
    };

    const endHandler = () => {
      console.log('🎤 SmartSpeechToText: Recognition ended');
      
      // Call user's onEnd callback
      if (onEnd) {
        try {
          onEnd();
        } catch (error) {
          console.error('🎤 SmartSpeechToText: Error in onEnd callback:', error);
        }
      }
    };

    // Register handlers with mic manager
    micManager.addResultHandler(resultHandler);
    micManager.addErrorHandler(errorHandler);
    micManager.addEndHandler(endHandler);

    // Cleanup handlers on unmount
    return () => {
      micManager.removeResultHandler(resultHandler);
      micManager.removeErrorHandler(errorHandler);
      micManager.removeEndHandler(endHandler);
    };
  }, [micManager, onResult, onError, onEnd]);

  // Start listening with mobile-proof protection
  const startListening = useCallback(async () => {
    // 🛡️ MOBILE-PROOF: Prevent duplicate requests
    if (isRequestingRef.current) {
      console.log('🎤 SmartSpeechToText: Request already in progress, ignoring');
      return;
    }

    if (!micManager.isSupported) {
      throw new Error('Speech recognition is not supported on this device');
    }

    console.log('🎤 SmartSpeechToText: Starting listening...');
    isRequestingRef.current = true;

    try {
      await micManager.startListening({
        language,
        continuous,
        interimResults
      });
    } catch (error) {
      console.error('🎤 SmartSpeechToText: Error starting listening:', error);
      throw error;
    } finally {
      isRequestingRef.current = false;
    }
  }, [micManager, language, continuous, interimResults]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🎤 SmartSpeechToText: Stopping listening...');
    micManager.stopListening();
  }, [micManager]);

  // Clear local transcript
  const clearTranscript = useCallback(() => {
    setLocalTranscript('');
    micManager.clearTranscript();
  }, [micManager]);

  return {
    isListening: micManager.isListening,
    transcript: localTranscript || micManager.transcript,
    interimTranscript: micManager.interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
    isSupported: micManager.isSupported
  };
} 
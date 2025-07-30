import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface MicManagerContextType {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: (options?: { language?: string; continuous?: boolean; interimResults?: boolean }) => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  addResultHandler: (handler: (text: string, isFinal: boolean) => void) => void;
  removeResultHandler: (handler: (text: string, isFinal: boolean) => void) => void;
  addErrorHandler: (handler: (error: string) => void) => void;
  removeErrorHandler: (handler: (error: string) => void) => void;
  addEndHandler: (handler: () => void) => void;
  removeEndHandler: (handler: () => void) => void;
}

const MicManagerContext = createContext<MicManagerContextType | null>(null);

interface MicManagerProviderProps {
  children: React.ReactNode;
}

export function MicManagerProvider({ children }: MicManagerProviderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  
  // 🛡️ MOBILE-PROOF: Prevent duplicate instances
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isLockedRef = useRef(false);
  const isInitializedRef = useRef(false);
  
  // Event handlers registry
  const resultHandlersRef = useRef<Set<(text: string, isFinal: boolean) => void>>(new Set());
  const errorHandlersRef = useRef<Set<(error: string) => void>>(new Set());
  const endHandlersRef = useRef<Set<() => void>>(new Set());

  // Initialize SpeechRecognition
  const initializeRecognition = useCallback(() => {
    if (isInitializedRef.current || !isSupported) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 MicManager: Speech recognition started');
        setIsListening(true);
        isLockedRef.current = true;
      };

      recognition.onresult = (event) => {
        console.log('🎤 MicManager: Speech result received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update global transcript
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimTranscript);
        }

        // Notify all result handlers
        resultHandlersRef.current.forEach(handler => {
          try {
            handler(finalTranscript || interimTranscript, !!finalTranscript);
          } catch (error) {
            console.error('🎤 MicManager: Error in result handler:', error);
          }
        });
      };

      recognition.onerror = (event) => {
        console.error('🎤 MicManager: Speech recognition error:', event.error);
        setIsListening(false);
        isLockedRef.current = false;
        
        // Notify all error handlers
        errorHandlersRef.current.forEach(handler => {
          try {
            handler(event.error);
          } catch (error) {
            console.error('🎤 MicManager: Error in error handler:', error);
          }
        });
      };

      recognition.onend = () => {
        console.log('🎤 MicManager: Speech recognition ended');
        setIsListening(false);
        isLockedRef.current = false;
        
        // Notify all end handlers
        endHandlersRef.current.forEach(handler => {
          try {
            handler();
          } catch (error) {
            console.error('🎤 MicManager: Error in end handler:', error);
          }
        });
      };

      recognitionRef.current = recognition;
      isInitializedRef.current = true;
      console.log('🎤 MicManager: SpeechRecognition initialized');
    } catch (error) {
      console.error('🎤 MicManager: Failed to initialize SpeechRecognition:', error);
    }
  }, [isSupported]);

  // Start listening with locking
  const startListening = useCallback(async (options?: { language?: string; continuous?: boolean; interimResults?: boolean }) => {
    if (!isSupported) {
      throw new Error('Speech recognition is not supported on this device');
    }

    // 🛡️ MOBILE-PROOF: Prevent duplicate starts
    if (isLockedRef.current || isListening) {
      console.log('🎤 MicManager: Already listening, ignoring start request');
      return;
    }

    try {
      // Initialize if needed
      if (!isInitializedRef.current) {
        initializeRecognition();
      }

      if (!recognitionRef.current) {
        throw new Error('SpeechRecognition not initialized');
      }

      // Apply options if provided
      if (options) {
        if (options.language) recognitionRef.current.lang = options.language;
        if (options.continuous !== undefined) recognitionRef.current.continuous = options.continuous;
        if (options.interimResults !== undefined) recognitionRef.current.interimResults = options.interimResults;
      }

      console.log('🎤 MicManager: Starting speech recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('🎤 MicManager: Error starting speech recognition:', error);
      throw error;
    }
  }, [isSupported, isListening, initializeRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      console.log('🎤 MicManager: Not listening, ignoring stop request');
      return;
    }

    try {
      console.log('🎤 MicManager: Stopping speech recognition...');
      recognitionRef.current.stop();
    } catch (error) {
      console.error('🎤 MicManager: Error stopping speech recognition:', error);
    }
  }, [isListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Event handler management
  const addResultHandler = useCallback((handler: (text: string, isFinal: boolean) => void) => {
    resultHandlersRef.current.add(handler);
  }, []);

  const removeResultHandler = useCallback((handler: (text: string, isFinal: boolean) => void) => {
    resultHandlersRef.current.delete(handler);
  }, []);

  const addErrorHandler = useCallback((handler: (error: string) => void) => {
    errorHandlersRef.current.add(handler);
  }, []);

  const removeErrorHandler = useCallback((handler: (error: string) => void) => {
    errorHandlersRef.current.delete(handler);
  }, []);

  const addEndHandler = useCallback((handler: () => void) => {
    endHandlersRef.current.add(handler);
  }, []);

  const removeEndHandler = useCallback((handler: () => void) => {
    endHandlersRef.current.delete(handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[speech] MicManager cleanup on unmount');
      if (recognitionRef.current) {
        // Clear all event listeners
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        
        // Stop recognition
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('[speech] stop() failed, trying abort()');
          try {
            recognitionRef.current.abort();
          } catch (abortError) {
            console.log('[speech] abort() also failed:', abortError);
          }
        }
        
        recognitionRef.current = null;
        setIsListening(false);
        isLockedRef.current = false;
      }
    };
  }, []);

  const value: MicManagerContextType = {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    addResultHandler,
    removeResultHandler,
    addErrorHandler,
    removeErrorHandler,
    addEndHandler,
    removeEndHandler
  };

  return (
    <MicManagerContext.Provider value={value}>
      {children}
    </MicManagerContext.Provider>
  );
}

export function useMicManager() {
  const context = useContext(MicManagerContext);
  if (!context) {
    throw new Error('useMicManager must be used within a MicManagerProvider');
  }
  return context;
} 
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useErrorToast } from '../hooks/useErrorToast';

interface MicManagerContextType {
  isListening: boolean;
  micBusy: boolean; // 🛡️ NEW: Global mic busy state
  currentOwner: string | null; // 🛡️ NEW: Track which component owns the mic
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: (options?: { language?: string; continuous?: boolean; interimResults?: boolean; owner?: string }) => Promise<void>;
  stopListening: (owner?: string) => void;
  clearTranscript: () => void;
  getRecognition: () => SpeechRecognition | null;
  addResultHandler: (handler: (text: string, isFinal: boolean) => void) => void;
  removeResultHandler: (handler: (text: string, isFinal: boolean) => void) => void;
  addErrorHandler: (handler: (error: string) => void) => void;
  removeErrorHandler: (handler: (error: string) => void) => void;
  addEndHandler: (handler: () => void) => void;
  removeEndHandler: (handler: () => void) => void;
  // 🛡️ NEW: Mic concurrency control methods
  requestMicAccess: (owner: string) => boolean;
  releaseMicAccess: (owner: string) => void;
  forceStopMic: () => void;
}

const MicManagerContext = createContext<MicManagerContextType | null>(null);

interface MicManagerProviderProps {
  children: React.ReactNode;
}

export function MicManagerProvider({ children }: MicManagerProviderProps) {
  const { showError, showWarning } = useErrorToast();
  const [isListening, setIsListening] = useState(false);
  const [micBusy, setMicBusy] = useState(false); // 🛡️ NEW: Global mic busy state
  const [currentOwner, setCurrentOwner] = useState<string | null>(null); // 🛡️ NEW: Track current mic owner
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
        
        // 🛡️ NEW: Show error toast for mic errors
        const errorMessages = {
          'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
          'no-speech': 'No speech detected. Please try speaking again.',
          'audio-capture': 'Audio capture failed. Please check your microphone.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition was cancelled.',
          'service-not-allowed': 'Speech recognition service not allowed.',
          'bad-grammar': 'Speech recognition grammar error.',
          'language-not-supported': 'Language not supported.'
        };
        
        const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        showError('Microphone Error', errorMessage);
        
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
        
        // 🛡️ NEW: Release mic access when recognition ends
        setMicBusy(false);
        setCurrentOwner(null);
        
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

  // 🛡️ NEW: Mic concurrency control methods
  const requestMicAccess = useCallback((owner: string): boolean => {
    if (micBusy && currentOwner !== owner) {
      console.log(`🎤 MicManager: Mic busy by ${currentOwner}, ${owner} access denied`);
      return false;
    }
    
    if (!micBusy) {
      setMicBusy(true);
      setCurrentOwner(owner);
      console.log(`🎤 MicManager: Mic access granted to ${owner}`);
    }
    
    return true;
  }, [micBusy, currentOwner]);

  const releaseMicAccess = useCallback((owner: string) => {
    if (currentOwner === owner) {
      setMicBusy(false);
      setCurrentOwner(null);
      console.log(`🎤 MicManager: Mic access released by ${owner}`);
    }
  }, [currentOwner]);

  const forceStopMic = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('🎤 MicManager: Mic force stopped');
      } catch (error) {
        console.error('🎤 MicManager: Error force stopping mic:', error);
      }
    }
    setMicBusy(false);
    setCurrentOwner(null);
    setIsListening(false);
  }, [isListening]);

  // Start listening with locking
  const startListening = useCallback(async (options?: { language?: string; continuous?: boolean; interimResults?: boolean; owner?: string }) => {
    if (!isSupported) {
      throw new Error('Speech recognition is not supported on this device');
    }

    const owner = options?.owner || 'unknown';
    
    // 🛡️ NEW: Check mic access before starting
    if (!requestMicAccess(owner)) {
      const errorMsg = `Microphone is currently busy by ${currentOwner}. Please wait or try again.`;
      showWarning('Microphone Busy', errorMsg);
      throw new Error(errorMsg);
    }

    // 🛡️ MOBILE-PROOF: Prevent duplicate starts
    if (isLockedRef.current || isListening) {
      console.log('🎤 MicManager: Already listening, ignoring start request');
      releaseMicAccess(owner);
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
      showError('Microphone Error', error instanceof Error ? error.message : 'Failed to start microphone');
      throw error;
    }
  }, [isSupported, isListening, initializeRecognition]);

  // Stop listening
  const stopListening = useCallback((owner?: string) => {
    if (!recognitionRef.current || !isListening) {
      console.log('🎤 MicManager: Not listening, ignoring stop request');
      return;
    }

    try {
      console.log('🎤 MicManager: Stopping speech recognition...');
      recognitionRef.current.stop();
      
      // 🛡️ NEW: Release mic access if owner provided
      if (owner) {
        releaseMicAccess(owner);
      }
    } catch (error) {
      console.error('🎤 MicManager: Error stopping speech recognition:', error);
    }
  }, [isListening, releaseMicAccess]);

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
    micBusy,
    currentOwner,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    getRecognition: () => recognitionRef.current,
    addResultHandler,
    removeResultHandler,
    addErrorHandler,
    removeErrorHandler,
    addEndHandler,
    removeEndHandler,
    requestMicAccess,
    releaseMicAccess,
    forceStopMic
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
import { useState, useRef, useCallback, useEffect } from 'react';

// Global mic cooldown to prevent multiple streams across components
declare global {
  interface Window {
    __micCooldown?: boolean;
    __activeRecognition?: any;
    __micClickCount?: number;
    __lastMicClickTime?: number;
  }
}

// Global microphone state manager
class MicrophoneManager {
  private static instance: MicrophoneManager;
  private activeRecognition: any = null;
  private isListening: boolean = false;
  private clickCount: number = 0;
  private lastClickTime: number = 0;

  static getInstance(): MicrophoneManager {
    if (!MicrophoneManager.instance) {
      MicrophoneManager.instance = new MicrophoneManager();
    }
    return MicrophoneManager.instance;
  }

  canStartListening(): boolean {
    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;
    
    // Prevent rapid successive clicks (less than 300ms apart)
    if (timeSinceLastClick < 300) {
      console.log('🎤 MicrophoneManager: Click too rapid, blocking');
      return false;
    }

    // Check if already listening
    if (this.isListening) {
      console.log('🎤 MicrophoneManager: Already listening, blocking');
      return false;
    }

    return true;
  }

  startListening(recognition: any): void {
    this.activeRecognition = recognition;
    this.isListening = true;
    this.lastClickTime = Date.now();
    this.clickCount++;
    
    console.log('🎤 MicrophoneManager: Started listening, click #:', this.clickCount);
  }

  stopListening(): void {
    this.activeRecognition = null;
    this.isListening = false;
    console.log('🎤 MicrophoneManager: Stopped listening');
  }

  getActiveRecognition(): any {
    return this.activeRecognition;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getClickCount(): number {
    return this.clickCount;
  }

  // Debug method to get current state
  getDebugInfo(): object {
    return {
      isListening: this.isListening,
      clickCount: this.clickCount,
      lastClickTime: this.lastClickTime,
      hasActiveRecognition: !!this.activeRecognition,
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }

  // Method to force reset (useful for debugging)
  forceReset(): void {
    console.log('🎤 MicrophoneManager: Force reset called');
    this.activeRecognition = null;
    this.isListening = false;
    this.clickCount = 0;
    this.lastClickTime = 0;
  }
}

// Global microphone manager instance
const micManager = MicrophoneManager.getInstance();

interface UseSpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechToText = (options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn => {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
    onStart,
    onStop
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const shouldContinueRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const cleanupRef = useRef<(() => void) | null>(null);

  // Check if speech recognition is supported
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ✅ CLEANUP: Add cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('[speech] useSpeechToText cleanup on unmount');
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
        shouldContinueRef.current = false;
        micManager.stopListening();
      }
    };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    accumulatedTextRef.current = '';
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // Use global microphone manager to prevent conflicts
    if (!micManager.canStartListening()) {
      console.log('🎤 Mic start blocked by global manager');
      return;
    }

    console.log('🎤 Starting speech recognition...');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    // ✅ CLEANUP: Store cleanup function for this recognition instance
    const cleanupRecognition = () => {
      console.log('[speech] Cleaning up recognition instance');
      if (recognition) {
        // Clear all event listeners
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onstart = null;
        recognition.onend = null;
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (error) {
          console.log('[speech] stop() failed, trying abort()');
          try {
            recognition.abort();
          } catch (abortError) {
            console.log('[speech] abort() also failed:', abortError);
          }
        }
      }
    };

    // Store cleanup function for unmount
    cleanupRef.current = cleanupRecognition;

    // Handle recognition results
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
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
      
      // Add only new final results to accumulated text
      if (finalTranscript) {
        accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + finalTranscript).trim();
      }
      
      // For real-time display: show accumulated final text + current interim text
      // But don't include accumulated text in interim results to prevent loops
      const realTimeTranscript = interimTranscript 
        ? (accumulatedTextRef.current + ' ' + interimTranscript).trim()
        : accumulatedTextRef.current;
      
      // Update transcript
      setTranscript(realTimeTranscript);
      
      // Call onResult callback if provided (for both interim and final results)
      if (onResult) {
        onResult(realTimeTranscript);
      }
    };

    // Handle recognition start
    recognition.onstart = () => {
      console.log('🎤 Recognition started! Setting isListening to true');
      setIsListening(true);
      shouldContinueRef.current = true;
      micManager.startListening(recognition);
      onStart?.();
    };

    // Handle recognition end
    recognition.onend = () => {
      console.log('🎤 Recognition ended');
      setIsListening(false);
      shouldContinueRef.current = false;
      micManager.stopListening();
      onStop?.();
    };

    // Handle recognition errors
    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      setIsListening(false);
      shouldContinueRef.current = false;
      micManager.stopListening();
      onError?.(event.error);
    };

    // Store reference and start
    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, continuous, interimResults, language, onResult, onError, onStart, onStop]);

  const stopListening = useCallback(() => {
    console.log('🎤 Stopping speech recognition...');
    if (recognitionRef.current) {
      shouldContinueRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      micManager.stopListening();
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};

// Enhanced version with accumulated text (like VoiceInput)
export const useContinuousSpeechToText = (options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn => {
  const {
    language = 'en-US',
    onResult,
    onError,
    onStart,
    onStop
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const shouldContinueRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const lastResultIndexRef = useRef(0); // Track the last processed result index
  const cleanupRef = useRef<(() => void) | null>(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ✅ CLEANUP: Add cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('[speech] useContinuousSpeechToText cleanup on unmount');
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
        shouldContinueRef.current = false;
        micManager.stopListening();
      }
    };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    accumulatedTextRef.current = '';
    lastResultIndexRef.current = 0; // ✅ Only reset here manually
  }, []);

  const startRecognition = useCallback(() => {
    if (!isSupported) {
      console.error('🎤 Speech recognition is not supported in this browser.');
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // Use global microphone manager to prevent conflicts
    if (!micManager.canStartListening()) {
      console.log('🎤 Continuous recognition blocked by global manager');
      return;
    }

    console.log('🎤 Starting continuous recognition on device:', navigator.userAgent);
    console.log('🎤 SpeechRecognition available:', !!window.SpeechRecognition);
    console.log('🎤 webkitSpeechRecognition available:', !!window.webkitSpeechRecognition);
    console.log('🎤 Current lastResultIndex:', lastResultIndexRef.current);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;

    // ✅ CLEANUP: Store cleanup function for this recognition instance
    const cleanupRecognition = () => {
      console.log('[speech] Cleaning up continuous recognition instance');
      if (recognition) {
        // Clear all event listeners
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onstart = null;
        recognition.onend = null;
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (error) {
          console.log('[speech] stop() failed, trying abort()');
          try {
            recognition.abort();
          } catch (abortError) {
            console.log('[speech] abort() also failed:', abortError);
          }
        }
      }
    };

    // Store cleanup function for unmount
    cleanupRef.current = cleanupRecognition;

    recognition.onresult = (event: any) => {
      console.log('🎤 Recognition result received:', event.results.length, 'results, lastIndex:', lastResultIndexRef.current);
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Only process new results to prevent duplication
      for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
        const result = event.results.item(i);
        const transcript = result.item(0).transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the last processed index
      lastResultIndexRef.current = event.results.length;
      
      // Add only new final results to accumulated text
      if (finalTranscript) {
        accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + finalTranscript).trim();
      }
      
      // For real-time display: show accumulated final text + current interim text
      const realTimeTranscript = interimTranscript 
        ? (accumulatedTextRef.current + ' ' + interimTranscript).trim()
        : accumulatedTextRef.current;
      
      // Update state and call callback
      setTranscript(realTimeTranscript);
      if (onResult) {
        onResult(realTimeTranscript);
      }
    };

    recognition.onstart = () => {
      console.log('🎤 Continuous recognition started! Setting isListening to true');
      console.log('🎤 Preserving lastResultIndex:', lastResultIndexRef.current); // ✅ Don't reset here
      setIsListening(true);
      micManager.startListening(recognition);
      onStart?.();
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended, shouldContinueRef.current:', shouldContinueRef.current);
      console.log('🎤 Final lastResultIndex:', lastResultIndexRef.current);
      // Only restart if the user hasn't explicitly stopped recording
      if (shouldContinueRef.current) {
        console.log('🎤 Recognition ended, restarting...');
        setTimeout(() => {
          if (shouldContinueRef.current) {
            startRecognition(); // accumulatedTextRef.current is preserved
          }
        }, 100); // Small delay to prevent rapid restarts
      } else {
        setIsListening(false);
        micManager.stopListening();
        onStop?.();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error, event);
      // Only restart on certain errors, not on user cancellation
      if (shouldContinueRef.current && event.error !== 'not-allowed') {
        console.log('🎤 Restarting after error:', event.error);
        setTimeout(() => {
          if (shouldContinueRef.current) {
            startRecognition();
          }
        }, 1000); // Longer delay for errors
      } else {
        setIsListening(false);
        micManager.stopListening();
        onError?.(event.error);
      }
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      console.log('🎤 Recognition.start() called successfully');
    } catch (error) {
      console.error('🎤 Error starting recognition:', error);
      onError?.(`Failed to start recognition: ${error}`);
    }
  }, [isSupported, language, onResult, onError, onStart, onStop]);

  const startListening = useCallback(() => {
    console.log('🎤 startListening called, isListening:', isListening);
    if (isListening) {
      console.log('🎤 Already listening, returning');
      return; // Already listening
    }
    
    console.log('🎤 Starting recognition...');
    shouldContinueRef.current = true;
    accumulatedTextRef.current = ''; // Reset accumulated text for new session
    // ✅ Don't reset lastResultIndexRef.current here - preserve across sessions
    startRecognition();
  }, [startRecognition]); // Removed isListening dependency to fix circular dependency

  const stopListening = useCallback(() => {
    console.log('🎤 stopListening called');
    shouldContinueRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    micManager.stopListening();
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
}; 

// Mobile-optimized speech recognition hook
export const useMobileSpeechToText = (options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn => {
  const {
    language = 'en-US',
    onResult,
    onError,
    onStart,
    onStop
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const shouldContinueRef = useRef(false);
  const accumulatedTextRef = useRef('');
  const lastResultIndexRef = useRef(0); // Track the last processed result index
  const cleanupRef = useRef<(() => void) | null>(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ✅ CLEANUP: Add cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('[speech] useMobileSpeechToText cleanup on unmount');
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
        shouldContinueRef.current = false;
        micManager.stopListening();
      }
    };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    accumulatedTextRef.current = '';
    lastResultIndexRef.current = 0; // ✅ Only reset here manually
  }, []);

  const startRecognition = useCallback(() => {
    if (!isSupported) {
      console.error(' Speech recognition not supported on mobile');
      onError?.('Speech recognition is not supported on this mobile device.');
      return;
    }

    // Use global microphone manager to prevent conflicts
    if (!micManager.canStartListening()) {
      console.log('🎤 Mobile recognition blocked by global manager');
      return;
    }

    console.log('🎤 Starting mobile speech recognition...');
    console.log('🎤 User Agent:', navigator.userAgent);
    console.log('🎤 Current lastResultIndex:', lastResultIndexRef.current);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Mobile-optimized settings
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;

    // ✅ CLEANUP: Store cleanup function for this recognition instance
    const cleanupRecognition = () => {
      console.log('[speech] Cleaning up mobile recognition instance');
      if (recognition) {
        // Clear all event listeners
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onstart = null;
        recognition.onend = null;
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (error) {
          console.log('[speech] stop() failed, trying abort()');
          try {
            recognition.abort();
          } catch (abortError) {
            console.log('[speech] abort() also failed:', abortError);
          }
        }
      }
    };

    // Store cleanup function for unmount
    cleanupRef.current = cleanupRecognition;

    recognition.onresult = (event: any) => {
      console.log('🎤 Mobile recognition result:', event.results.length, 'results, lastIndex:', lastResultIndexRef.current);
      
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Only process new results to prevent duplication
      for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
        const result = event.results.item(i);
        const transcript = result.item(0).transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the last processed index
      lastResultIndexRef.current = event.results.length;
      
      // Add only new final results to accumulated text
      if (finalTranscript) {
        accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + finalTranscript).trim();
      }
      
      // For real-time display: show accumulated final text + current interim text
      const realTimeTranscript = interimTranscript 
        ? (accumulatedTextRef.current + ' ' + interimTranscript).trim()
        : accumulatedTextRef.current;
      
      setTranscript(realTimeTranscript);
      if (onResult) {
        onResult(realTimeTranscript);
      }
    };

    recognition.onstart = () => {
      console.log('🎤 Mobile recognition started!');
      console.log('🎤 Preserving lastResultIndex:', lastResultIndexRef.current); // ✅ Don't reset here
      setIsListening(true);
      micManager.startListening(recognition);
      onStart?.();
    };

    recognition.onend = () => {
      console.log('🎤 Mobile recognition ended, shouldContinueRef.current:', shouldContinueRef.current);
      console.log('🎤 Final lastResultIndex:', lastResultIndexRef.current);
      // Only restart if the user hasn't explicitly stopped recording
      if (shouldContinueRef.current) {
        console.log('🎤 Mobile recognition ended, restarting...');
        setTimeout(() => {
          if (shouldContinueRef.current) {
            startRecognition(); // accumulatedTextRef.current is preserved
          }
        }, 100); // Small delay to prevent rapid restarts
      } else {
        setIsListening(false);
        micManager.stopListening();
        onStop?.();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Mobile speech recognition error:', event.error);
      // Only restart on certain errors, not on user cancellation
      if (shouldContinueRef.current && event.error !== 'not-allowed') {
        console.log('🎤 Mobile restarting after error:', event.error);
        setTimeout(() => {
          if (shouldContinueRef.current) {
            startRecognition();
          }
        }, 1000); // Longer delay for errors
      } else {
        setIsListening(false);
        micManager.stopListening();
        onError?.(event.error);
      }
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      console.log('🎤 Mobile recognition.start() called');
    } catch (error) {
      console.error('🎤 Error starting mobile recognition:', error);
      onError?.(`Failed to start recognition: ${error}`);
    }
  }, [isSupported, language, onResult, onError, onStart, onStop]);

  const startListening = useCallback(() => {
    console.log('🎤 Mobile startListening called');
    if (isListening) {
      console.log('🎤 Already listening on mobile');
      return;
    }
    
    shouldContinueRef.current = true;
    accumulatedTextRef.current = ''; // Reset accumulated text for new session
    // ✅ Don't reset lastResultIndexRef.current here - preserve across sessions
    startRecognition();
  }, [isListening, startRecognition]);

  const stopListening = useCallback(() => {
    console.log('🎤 Mobile stopListening called');
    shouldContinueRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    micManager.stopListening();
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
}; 
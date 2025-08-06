import { useState, useRef, useCallback } from 'react';
export const useSpeechToText = (options = {}) => {
    const { language = 'en-US', continuous = true, interimResults = true, onResult, onError, onStart, onStop } = options;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const shouldContinueRef = useRef(false);
    const accumulatedTextRef = useRef('');
    // Check if speech recognition is supported
    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const resetTranscript = useCallback(() => {
        setTranscript('');
        accumulatedTextRef.current = '';
    }, []);
    const startListening = useCallback(() => {
        if (!isSupported) {
            onError?.('Speech recognition is not supported in this browser.');
            return;
        }
        if (isListening) {
            return; // Already listening
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        // Configure recognition
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;
        // Handle recognition results
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            // Process all results
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results.item(i);
                const transcript = result.item(0).transcript;
                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                }
                else {
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
            console.log('Recognition started! Setting isListening to true');
            setIsListening(true);
            shouldContinueRef.current = true;
            onStart?.();
        };
        // Handle recognition end
        recognition.onend = () => {
            setIsListening(false);
            shouldContinueRef.current = false;
            onStop?.();
        };
        // Handle recognition errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            shouldContinueRef.current = false;
            onError?.(event.error);
        };
        // Store reference and start
        recognitionRef.current = recognition;
        recognition.start();
    }, [isSupported, isListening, continuous, interimResults, language, onResult, onError, onStart, onStop]);
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            shouldContinueRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
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
export const useContinuousSpeechToText = (options = {}) => {
    const { language = 'en-US', onResult, onError, onStart, onStop } = options;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const shouldContinueRef = useRef(false);
    const accumulatedTextRef = useRef('');
    const lastResultIndexRef = useRef(0); // Track the last processed result index
    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const resetTranscript = useCallback(() => {
        setTranscript('');
        accumulatedTextRef.current = '';
        lastResultIndexRef.current = 0;
    }, []);
    const startRecognition = useCallback(() => {
        if (!isSupported) {
            console.error('Speech recognition is not supported in this browser.');
            onError?.('Speech recognition is not supported in this browser.');
            return;
        }
        console.log('Starting recognition on device:', navigator.userAgent);
        console.log('SpeechRecognition available:', !!window.SpeechRecognition);
        console.log('webkitSpeechRecognition available:', !!window.webkitSpeechRecognition);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event) => {
            console.log('Recognition result received:', event.results.length, 'results, lastIndex:', lastResultIndexRef.current);
            let interimTranscript = '';
            let finalTranscript = '';
            // Only process new results to prevent duplication
            for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
                const result = event.results.item(i);
                const transcript = result.item(0).transcript;
                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                }
                else {
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
            console.log('Continuous recognition started! Setting isListening to true');
            setIsListening(true);
            lastResultIndexRef.current = 0; // Reset index when starting
            onStart?.();
        };
        recognition.onend = () => {
            console.log('Recognition ended, shouldContinueRef.current:', shouldContinueRef.current);
            // Only restart if the user hasn't explicitly stopped recording
            if (shouldContinueRef.current) {
                console.log('Recognition ended, restarting...');
                setTimeout(() => {
                    if (shouldContinueRef.current) {
                        startRecognition(); // accumulatedTextRef.current is preserved
                    }
                }, 100); // Small delay to prevent rapid restarts
            }
            else {
                setIsListening(false);
                onStop?.();
            }
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error, event);
            // Only restart on certain errors, not on user cancellation
            if (shouldContinueRef.current && event.error !== 'not-allowed') {
                console.log('Restarting after error:', event.error);
                setTimeout(() => {
                    if (shouldContinueRef.current) {
                        startRecognition();
                    }
                }, 1000); // Longer delay for errors
            }
            else {
                setIsListening(false);
                onError?.(event.error);
            }
        };
        try {
            recognitionRef.current = recognition;
            recognition.start();
            console.log('Recognition.start() called successfully');
        }
        catch (error) {
            console.error('Error starting recognition:', error);
            onError?.(`Failed to start recognition: ${error}`);
        }
    }, [isSupported, language, onResult, onError, onStart, onStop]);
    const startListening = useCallback(() => {
        console.log('startListening called, isListening:', isListening);
        if (isListening) {
            console.log('Already listening, returning');
            return; // Already listening
        }
        console.log('Starting recognition...');
        shouldContinueRef.current = true;
        accumulatedTextRef.current = ''; // Reset accumulated text for new session
        lastResultIndexRef.current = 0; // Reset result index
        startRecognition();
    }, [startRecognition]); // Removed isListening dependency to fix circular dependency
    const stopListening = useCallback(() => {
        console.log('stopListening called');
        shouldContinueRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
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
export const useMobileSpeechToText = (options = {}) => {
    const { language = 'en-US', onResult, onError, onStart, onStop } = options;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const shouldContinueRef = useRef(false);
    const accumulatedTextRef = useRef('');
    const lastResultIndexRef = useRef(0); // Track the last processed result index
    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const resetTranscript = useCallback(() => {
        setTranscript('');
        accumulatedTextRef.current = '';
        lastResultIndexRef.current = 0;
    }, []);
    const startRecognition = useCallback(() => {
        if (!isSupported) {
            console.error('Speech recognition not supported on mobile');
            onError?.('Speech recognition is not supported on this mobile device.');
            return;
        }
        console.log('Starting mobile speech recognition...');
        console.log('User Agent:', navigator.userAgent);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        // Mobile-optimized settings
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event) => {
            console.log('Mobile recognition result:', event.results.length, 'results, lastIndex:', lastResultIndexRef.current);
            let interimTranscript = '';
            let finalTranscript = '';
            // Only process new results to prevent duplication
            for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
                const result = event.results.item(i);
                const transcript = result.item(0).transcript;
                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                }
                else {
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
            console.log('Mobile recognition started!');
            setIsListening(true);
            lastResultIndexRef.current = 0; // Reset index when starting
            onStart?.();
        };
        recognition.onend = () => {
            console.log('Mobile recognition ended, shouldContinueRef.current:', shouldContinueRef.current);
            // Only restart if the user hasn't explicitly stopped recording
            if (shouldContinueRef.current) {
                console.log('Mobile recognition ended, restarting...');
                setTimeout(() => {
                    if (shouldContinueRef.current) {
                        startRecognition(); // accumulatedTextRef.current is preserved
                    }
                }, 100); // Small delay to prevent rapid restarts
            }
            else {
                setIsListening(false);
                onStop?.();
            }
        };
        recognition.onerror = (event) => {
            console.error('Mobile speech recognition error:', event.error);
            // Only restart on certain errors, not on user cancellation
            if (shouldContinueRef.current && event.error !== 'not-allowed') {
                console.log('Mobile restarting after error:', event.error);
                setTimeout(() => {
                    if (shouldContinueRef.current) {
                        startRecognition();
                    }
                }, 1000); // Longer delay for errors
            }
            else {
                setIsListening(false);
                onError?.(event.error);
            }
        };
        try {
            recognitionRef.current = recognition;
            recognition.start();
            console.log('Mobile recognition.start() called');
        }
        catch (error) {
            console.error('Error starting mobile recognition:', error);
            onError?.(`Failed to start recognition: ${error}`);
        }
    }, [isSupported, language, onResult, onError, onStart, onStop]);
    const startListening = useCallback(() => {
        console.log('Mobile startListening called');
        if (isListening) {
            console.log('Already listening on mobile');
            return;
        }
        shouldContinueRef.current = true;
        accumulatedTextRef.current = ''; // Reset accumulated text for new session
        lastResultIndexRef.current = 0; // Reset result index
        startRecognition();
    }, [isListening, startRecognition]);
    const stopListening = useCallback(() => {
        console.log('Mobile stopListening called');
        shouldContinueRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
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

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LLMMethod } from '../types/llm';

interface LLMResponse {
  answer: string;
  method: LLMMethod;
  confidence: number;
  source: string;
}

interface UseLLMRouterReturn {
  answer: string;
  loading: boolean;
  error: string;
  method: LLMMethod;
  confidence: number;
  source: string;
  askQuestion: (query: string) => Promise<void>;
  clearAnswer: () => void;
  cancelRequest: () => void;
}

interface UseLLMRouterOptions {
  timeout?: number; // milliseconds
  enableVIRL?: boolean;
  enableGPT?: boolean;
  enableFallback?: boolean;
}

export function useLLMRouter(options: UseLLMRouterOptions = {}): UseLLMRouterReturn {
  const {
    timeout = 15000, // 15 seconds default
    enableVIRL = true,
    enableGPT = true,
    enableFallback = true
  } = options;

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<LLMMethod>(null);
  const [confidence, setConfidence] = useState(0);
  const [source, setSource] = useState('');

  // 🛡️ RACE CONDITION PREVENTION: Track active requests
  const activeRequestRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRespondedRef = useRef(false);

  // Import the smart AskMe logic
  const { smartAskMe, isTimeSensitiveQuestion } = require('../lib/AskMeLogic');

  const askQuestion = useCallback(async (query: string) => {
    // 🛡️ RACE CONDITION PREVENTION: Ignore if already processing
    if (activeRequestRef.current === query) {
      console.log('🛡️ LLMRouter: Request already in progress, ignoring duplicate');
      return;
    }

    if (activeRequestRef.current) {
      console.log('🛡️ LLMRouter: Cancelling previous request');
      cancelRequest();
    }

    console.log('🚀 LLMRouter: Starting coordinated LLM request for:', query);
    
    // Reset state
    activeRequestRef.current = query;
    hasRespondedRef.current = false;
    setLoading(true);
    setError('');
    setAnswer('');
    setMethod(null);
    setConfidence(0);
    setSource('');

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (!hasRespondedRef.current) {
        console.log('⏰ LLMRouter: Request timed out');
        handleTimeout();
      }
    }, timeout);

    try {
      // 🧠 COORDINATED LLM REQUEST: Use smart AskMe with proper coordination
      const result = await smartAskMe(query);
      
      // 🛡️ RACE CONDITION PREVENTION: Only accept if this is still the active request
      if (activeRequestRef.current === query && !hasRespondedRef.current) {
        console.log('✅ LLMRouter: Received coordinated response:', {
          method: result.method,
          confidence: result.confidence,
          answerLength: result.answer.length
        });
        
        setAnswer(result.answer);
        setMethod(result.method);
        setConfidence(result.confidence);
        setSource(result.method === 'real-time' ? 'VIRL' : 'GPT');
        hasRespondedRef.current = true;
      } else {
        console.log('🛡️ LLMRouter: Ignoring response from outdated request');
      }
      
         } catch (err) {
       // 🛡️ RACE CONDITION PREVENTION: Only handle errors for active request
       if (activeRequestRef.current === query && !hasRespondedRef.current) {
         const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
         console.error('❌ LLMRouter: Error in coordinated request:', errorMessage);
         
         // 🔄 LLM ERROR UX: Provide helpful fallback message
         setError('We couldn\'t get an answer right now. Please try again or rephrase your question.');
         hasRespondedRef.current = true;
       }
     } finally {
      // Cleanup
      if (activeRequestRef.current === query) {
        setLoading(false);
        activeRequestRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        abortControllerRef.current = null;
      }
    }
  }, [timeout, enableVIRL, enableGPT, enableFallback]);

  const handleTimeout = useCallback(() => {
    if (!hasRespondedRef.current) {
      console.log('⏰ LLMRouter: Handling timeout');
      setError('Request timed out. Please try again.');
      setLoading(false);
      hasRespondedRef.current = true;
      activeRequestRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortControllerRef.current = null;
    }
  }, []);

  const cancelRequest = useCallback(() => {
    console.log('🛑 LLMRouter: Cancelling active request');
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset state
    activeRequestRef.current = null;
    hasRespondedRef.current = true;
    setLoading(false);
  }, []);

  const clearAnswer = useCallback(() => {
    setAnswer('');
    setError('');
    setMethod(null);
    setConfidence(0);
    setSource('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, [cancelRequest]);

  return {
    answer,
    loading,
    error,
    method,
    confidence,
    source,
    askQuestion,
    clearAnswer,
    cancelRequest
  };
} 
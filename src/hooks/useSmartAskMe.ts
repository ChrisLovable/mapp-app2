import { useState, useCallback, useRef } from 'react';
import { smartAskMe, isTimeSensitiveQuestion } from '../lib/AskMeLogic';
import type { LLMMethod } from '../types/llm';

interface UseSmartAskMeReturn {
  isLoading: boolean;
  answer: string;
  error: string;
  method: LLMMethod;
  confidence: number;
  askQuestion: (question: string) => Promise<void>;
  clearAnswer: () => void;
  isTimeSensitive: (question: string) => boolean;
}

export function useSmartAskMe(): UseSmartAskMeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [method, setMethod] = useState<LLMMethod>(null);
  const [confidence, setConfidence] = useState(0);
  
  // 🛡️ MOBILE-PROOF: Prevent duplicate requests
  const isRequestingRef = useRef(false);
  const currentRequestRef = useRef<string | null>(null);

  const askQuestion = useCallback(async (question: string) => {
    // 🛡️ MOBILE-PROOF: Prevent duplicate requests
    if (isRequestingRef.current) {
      console.log('🛡️ Request already in progress, ignoring duplicate');
      return;
    }

    // Check if this is the same question
    if (currentRequestRef.current === question) {
      console.log('🛡️ Same question already being processed');
      return;
    }

    console.log('🔍 Smart AskMe starting for question:', question);
    
    isRequestingRef.current = true;
    currentRequestRef.current = question;
    
    setIsLoading(true);
    setError('');
    setAnswer('');
    setMethod(null);
    setConfidence(0);

    try {
      const result = await smartAskMe(question);
      
      setAnswer(result.answer);
      setMethod(result.method);
      setConfidence(result.confidence);
      
      console.log('✅ Smart AskMe completed:', {
        method: result.method,
        confidence: result.confidence,
        answerLength: result.answer.length
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      console.error('❌ Smart AskMe failed:', errorMessage);
    } finally {
      setIsLoading(false);
      isRequestingRef.current = false;
      currentRequestRef.current = null;
    }
  }, []);

  const clearAnswer = useCallback(() => {
    setAnswer('');
    setError('');
    setMethod(null);
    setConfidence(0);
  }, []);

  const isTimeSensitive = useCallback((question: string) => {
    return isTimeSensitiveQuestion(question);
  }, []);

  return {
    isLoading,
    answer,
    error,
    method,
    confidence,
    askQuestion,
    clearAnswer,
    isTimeSensitive
  };
} 
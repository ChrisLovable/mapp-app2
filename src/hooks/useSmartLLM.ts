import { useState, useCallback, useRef } from 'react';
import type { LLMMethod } from '../types/llm';
import { useErrorToast } from './useErrorToast';

interface LLMResponse {
  source: LLMMethod;
  output: string;
  error?: string;
  confidence: number;
}

interface UseSmartLLMReturn {
  generate: (input: string) => Promise<LLMResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: LLMResponse | null;
}

export function useSmartLLM(): UseSmartLLMReturn {
  const { showError, showWarning } = useErrorToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<LLMResponse | null>(null);
  
  // 🛡️ RACE CONDITION PREVENTION: Track active requests
  const activeRequestRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callGPT = useCallback(async (input: string): Promise<LLMResponse> => {
    try {
      console.log('🤖 [useSmartLLM] Attempting GPT...');
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await res.json();
      if (!res.ok || !data.output) {
        throw new Error('GPT failed');
      }
      
      return {
        source: 'gpt',
        output: data.output,
        confidence: 0.8
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'GPT failed';
      console.warn('⚠️ [useSmartLLM] GPT fallback triggered:', errorMessage);
      showWarning('GPT Failed', 'Falling back to VIRL...');
      throw new Error(errorMessage);
    }
  }, []);

  const callVIRL = useCallback(async (input: string): Promise<LLMResponse> => {
    try {
      console.log('🔍 [useSmartLLM] Attempting VIRL...');
      const res = await fetch('/api/virl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await res.json();
      if (!res.ok || !data.output) {
        throw new Error('VIRL failed');
      }
      
      return {
        source: 'virl',
        output: data.output,
        confidence: 0.7
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'VIRL failed';
      console.error('❌ [useSmartLLM] VIRL failed:', errorMessage);
      showError('VIRL Failed', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const generate = useCallback(async (input: string): Promise<LLMResponse> => {
    // 🛡️ RACE CONDITION PREVENTION: Ignore if already processing
    if (activeRequestRef.current === input) {
      console.log('🛡️ [useSmartLLM] Request already in progress, ignoring duplicate');
      throw new Error('Request already in progress');
    }

    if (activeRequestRef.current) {
      console.log('🛡️ [useSmartLLM] Cancelling previous request');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    console.log('🚀 [useSmartLLM] Starting coordinated LLM request for:', input);
    
    // Reset state
    activeRequestRef.current = input;
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 🧠 COORDINATED LLM REQUEST: Try GPT first, fallback to VIRL
      let response: LLMResponse;
      
      try {
        // Try GPT first
        response = await callGPT(input);
        console.log('✅ [useSmartLLM] GPT succeeded:', {
          source: response.source,
          confidence: response.confidence,
          outputLength: response.output.length
        });
      } catch (gptError) {
        console.warn('⚠️ [useSmartLLM] GPT failed, trying VIRL:', gptError);
        
        // Fallback to VIRL
        try {
          response = await callVIRL(input);
          console.log('✅ [useSmartLLM] VIRL succeeded as fallback:', {
            source: response.source,
            confidence: response.confidence,
            outputLength: response.output.length
          });
        } catch (virlError) {
          console.error('❌ [useSmartLLM] Both GPT and VIRL failed:', {
            gptError: gptError instanceof Error ? gptError.message : 'Unknown GPT error',
            virlError: virlError instanceof Error ? virlError.message : 'Unknown VIRL error'
          });
          
          showError('LLM Service Unavailable', 'Both GPT and VIRL services are currently unavailable. Please try again later.');
          
          // Both failed - return error response
          response = {
            source: 'fallback',
            output: 'Sorry, I couldn\'t get a response right now. Please try again or rephrase your question.',
            error: 'Both GPT and VIRL failed',
            confidence: 0.1
          };
        }
      }
      
      // 🛡️ RACE CONDITION PREVENTION: Only accept if this is still the active request
      if (activeRequestRef.current === input && !signal.aborted) {
        setLastResponse(response);
        return response;
      } else {
        console.log('🛡️ [useSmartLLM] Ignoring response from outdated request');
        throw new Error('Request was cancelled');
      }
      
    } catch (err) {
      // 🛡️ RACE CONDITION PREVENTION: Only handle errors for active request
      if (activeRequestRef.current === input && !signal.aborted) {
                          const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
                  console.error('❌ [useSmartLLM] Error in coordinated request:', errorMessage);

                  showError('LLM Request Failed', errorMessage);

                  const errorResponse: LLMResponse = {
                    source: 'fallback',
                    output: 'We couldn\'t get an answer right now. Please try again or rephrase your question.',
                    error: errorMessage,
                    confidence: 0.1
                  };

                  setError(errorMessage);
                  setLastResponse(errorResponse);
                  return errorResponse;
      } else {
        throw new Error('Request was cancelled');
      }
    } finally {
      // Cleanup
      if (activeRequestRef.current === input) {
        setIsLoading(false);
        activeRequestRef.current = null;
        abortControllerRef.current = null;
      }
    }
  }, [callGPT, callVIRL]);

  return {
    generate,
    isLoading,
    error,
    lastResponse
  };
} 
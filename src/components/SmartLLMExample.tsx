import React, { useState } from 'react';
import { useSmartLLM } from '../hooks/useSmartLLM';
import type { LLMMethod } from '../types/llm';
import { getSourceLabel } from '../types/llm';

interface SmartLLMExampleProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartLLMExample: React.FC<SmartLLMExampleProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string>('');
  const [source, setSource] = useState<LLMMethod>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const { generate, isLoading, error, lastResponse } = useSmartLLM();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      console.log('🚀 SmartLLMExample: Generating response for:', input);
      const result = await generate(input);
      
      setResponse(result.output);
      setSource(result.source);
      setConfidence(result.confidence);
      
      console.log('✅ SmartLLMExample: Response received:', {
        source: result.source,
        confidence: result.confidence,
        outputLength: result.output.length,
        error: result.error
      });
      
    } catch (err) {
      console.error('❌ SmartLLMExample: Error:', err);
      setResponse('Failed to get response. Please try again.');
      setSource('fallback');
      setConfidence(0);
    }
  };

  const handleClear = () => {
    setInput('');
    setResponse('');
    setSource(null);
    setConfidence(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="glassy-rainbow-btn rounded-2xl bg-black p-6 w-full max-w-2xl max-h-[90vh] flex flex-col border-0">
        {/* Header */}
        <div className="w-full bg-blue-600 rounded-t-2xl rounded-b-2xl flex items-center justify-between px-4 py-3 mb-4">
          <h2 className="text-white font-bold text-lg sm:text-xl mx-auto w-full text-center">
            Smart LLM with Fallback
          </h2>
          <button 
            onClick={onClose} 
            className="absolute right-6 top-4 text-white text-xl font-bold bg-transparent rounded-full hover:bg-blue-800 hover:text-gray-200 transition-colors w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white mb-2 block">Question</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (GPT will try first, then VIRL if needed)"
                className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !input.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111' }}
              >
                {isLoading ? 'Generating...' : 'Ask Question'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0"
                style={{ background: '#dc2626' }}
              >
                Clear
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-xl border border-red-500">
              {error}
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white mb-2 block">Response</label>
                <div className="bg-black bg-opacity-50 p-4 rounded-xl border border-[var(--favourite-blue)] max-h-64 overflow-y-auto">
                  <pre className="text-white text-sm whitespace-pre-wrap">{response}</pre>
                </div>
              </div>

              {/* Source and Confidence Info */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Source:</span>
                  <span className="text-white font-semibold">
                    {source ? getSourceLabel(source) : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white font-semibold">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={() => navigator.clipboard.writeText(response)}
                className="w-full px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                style={{ background: '#111' }}
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && lastResponse && (
            <div className="text-xs text-gray-500 bg-gray-900 p-3 rounded-lg">
              <div><strong>Debug Info:</strong></div>
              <div>Source: {lastResponse.source}</div>
              <div>Confidence: {lastResponse.confidence}</div>
              {lastResponse.error && <div>Error: {lastResponse.error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartLLMExample; 
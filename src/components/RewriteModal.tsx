import React, { useState, useRef } from 'react';

import { apiUsageTracker } from '../lib/ApiUsageTracker';

interface RewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onTextChange?: (text: string) => void;
}

const REWRITE_OPTIONS = [
  { id: 'business', label: 'Professional', description: 'Formal, corporate tone suitable for business communications' },
  { id: 'informal', label: 'Informal', description: 'Casual, conversational tone for everyday communication' },
  { id: 'friendly', label: 'Friendly', description: 'Warm, approachable tone that builds rapport' },
  { id: 'expanded', label: 'Expanded', description: 'Add more detail and elaboration to the content' },
  { id: 'summarized', label: 'Summarized', description: 'Condense the content while keeping key points' },
  { id: 'grammar', label: 'Well-written', description: 'Keep the text as is, but correct grammar and punctuation only' }
];

export default function RewriteModal({ isOpen, onClose, currentText, onTextChange }: RewriteModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAllActive, setSelectAllActive] = useState(false);
  const rewrittenTextareaRef = useRef(null);

  const handleOptionSelect = (optionId: string) => {
    console.log('Selecting option:', optionId);
    setSelectedOption(optionId);
  };

  const handleRewrite = async () => {
    console.log('Rewrite button clicked');
    console.log('Current text:', currentText);
    console.log('Selected option:', selectedOption);
    
    if (!currentText.trim()) {
      setError('Please enter text to rewrite');
      return;
    }

    if (!selectedOption) {
      setError('Please select a rewrite option');
      return;
    }

    setIsLoading(true);
    setError('');
    setRewrittenText('');

    try {
      let prompt = '';
      if (selectedOption === 'grammar') {
        prompt = `Correct only the grammar and punctuation of the following text. Do not change the wording, style, or meaning. Return only the corrected text, nothing else.\n\n"${currentText}"`;
      } else {
        const optionLabel = REWRITE_OPTIONS.find(opt => opt.id === selectedOption)?.label;

        console.log('Option label:', optionLabel);
        
        prompt = `Rewrite the following text in a ${optionLabel} style. Maintain the original meaning and key information while adapting the tone and structure as requested:\n\n"${currentText}"\n\nPlease provide only the rewritten text without any additional explanations or formatting.`;
      }

      console.log('Sending prompt to OpenAI:', prompt);
      
      const response = await getGPTAnswer(prompt);
      console.log('OpenAI response:', response);
      
      setRewrittenText(response);
      
      // Track successful rewrite usage
      apiUsageTracker.trackOpenAIUsage(
        'https://api.openai.com/v1/chat/completions',
        'gpt-4',
        prompt.length / 4, // Approximate token count
        response.length / 4, // Approximate token count
        'Text Rewrite',
        true
      );
    } catch (error) {
      setError('Failed to rewrite text. Please try again.');
      console.error('Rewrite error:', error);
      
      // Track failed rewrite usage
      apiUsageTracker.trackOpenAIUsage(
        'https://api.openai.com/v1/chat/completions',
        'gpt-4',
        currentText.length / 4, // Approximate token count
        0,
        'Text Rewrite',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rewrittenText);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const clearAll = () => {
    setSelectedOption('');
    setRewrittenText('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4" style={{ height: '100vh' }}>
      <div className="w-full flex items-center justify-center">
        <div className="rounded-2xl bg-black p-4 min-h-0 h-auto flex flex-col" style={{ width: '85vw', boxSizing: 'border-box', border: '2px solid white' }}>
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="relative mb-6 px-4 py-3 rounded-lg simple-double-border" style={{ background: 'linear-gradient(135deg, #000000 0%, #666666 100%)', border: '4px double rgba(255, 255, 255, 0.9)' }}>
              <div className="token-dashboard-header">
              <h2 className="text-white font-bold text-base text-center">Rewrite Text</h2>
            </div>
              <button
                onClick={onClose}
                className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                style={{ background: '#000000', border: 'none', outline: 'none', fontSize: '15px' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="w-full px-4">
                {/* Input Text Display */}
                <div className="space-y-2 mb-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left mt-[-28px]" style={{ fontSize: '0.85rem' }}>Text to rewrite:</label>
                  <div className="p-3 rounded-2xl animated-rainbow-border min-h-[80px] max-h-[200px]">
                    <textarea
                      value={currentText}
                      onChange={(e) => {
                        if (onTextChange) {
                          onTextChange(e.target.value);
                        }
                      }}
                      className="w-full h-full bg-transparent border-0 outline-none resize-y text-sm text-white"
                      placeholder="Enter or edit the text you want to rewrite..."
                      style={{ minHeight: '60px', maxHeight: '60px' }}
                    />
                  </div>
                </div>

                {/* Rewrite Options */}
                <div className="space-y-4 mb-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Select rewrite style:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {REWRITE_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center px-3 py-1 bg-[var(--favourite-blue)] text-white rounded-full cursor-pointer transition-all block`}
                        style={{
                          color: selectedOption === option.id ? 'var(--favourite-green)' : 'white',
                          boxShadow: selectedOption === option.id ? '0 0 12px 4px var(--favourite-blue), 0 0 16px 6px var(--favourite-blue)' : undefined
                        }}
                      >
                        <input
                          type="radio"
                          name="rewriteOption"
                          checked={selectedOption === option.id}
                          onChange={() => handleOptionSelect(option.id)}
                          className="appearance-none w-5 h-5 rounded-full border-2 border-white checked:bg-black checked:ring-2 checked:ring-red-500 mr-1 focus:ring-white cursor-pointer"
                        />
                        <span className="text-xs font-bold">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="p-2">
                      <button
                        onClick={handleRewrite}
                        disabled={isLoading || !currentText.trim() || !selectedOption}
                        className="glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0"
                        style={{
                          background: '#111',
                          boxShadow: '0 0 6px 1.5px #00fff7, 0 0 8px 2px #00fff766, 0 3px 6px rgba(30, 64, 175, 0.3), 0 0 5px rgba(255, 255, 255, 0.1)',
                          fontSize: '0.9rem',
                          minWidth: '120px'
                        }}
                      >
                        {isLoading ? 'Rewriting...' : 'Rewrite Text'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rewritten Text Output - always visible */}
                <div className="space-y-2 mt-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Rewritten text:</label>
                  <div className="p-3 rounded-2xl animated-rainbow-border">
                    <textarea
                      id="rewritten-textarea"
                      ref={rewrittenTextareaRef}
                      value={rewrittenText}
                      onChange={(e) => setRewrittenText(e.target.value)}
                      className={`w-full h-full bg-transparent border-0 outline-none resize-y text-sm text-white font-bold${selectAllActive ? ' custom-selection' : ''}`}
                      placeholder="Rewritten text will appear here..."
                      style={{ minHeight: '60px', maxHeight: '60px' }}
                      onBlur={() => setSelectAllActive(false)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          const textarea = document.querySelector('#rewritten-textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.select();
                            setSelectAllActive(true);
                          }
                        }}
                        className="glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0 focus:neon-glow"
                        style={{
                          background: '#111',
                          boxShadow: '0 0 6px 1.5px #00fff7, 0 0 8px 2px #00fff766, 0 3px 6px rgba(30, 64, 175, 0.3), 0 0 5px rgba(255, 255, 255, 0.1)',
                          fontSize: '0.9rem',
                          minWidth: '120px'
                        }}
                        onFocus={e => e.currentTarget.style.boxShadow = '0 0 16px 4px #00fff7, 0 0 24px 8px #00fff766, 0 3px 12px rgba(30, 64, 175, 0.5), 0 0 10px rgba(255, 255, 255, 0.2)'}
                        onBlur={e => e.currentTarget.style.boxShadow = '0 0 6px 1.5px #00fff7, 0 0 8px 2px #00fff766, 0 3px 6px rgba(30, 64, 175, 0.3), 0 0 5px rgba(255, 255, 255, 0.1)'}
                      >
                        Select All
                      </button>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={copyToClipboard}
                        className="glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0"
                        style={{
                          background: '#111',
                          boxShadow: '0 0 6px 1.5px #00fff7, 0 0 8px 2px #00fff766, 0 3px 6px rgba(30, 64, 175, 0.3), 0 0 5px rgba(255, 255, 255, 0.1)',
                          fontSize: '0.9rem',
                          minWidth: '120px'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-2xl animated-rainbow-border bg-red-100 text-black border-0 mb-4" style={{ backgroundColor: '#fee2e2' }}>
                    <h3 className="text-red-800 font-semibold text-sm mb-1">Error</h3>
                    <p className="text-red-700 text-xs">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
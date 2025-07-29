import React, { useRef } from 'react';

interface AskMeResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  isLoading: boolean;
  error: string;
  source?: string; // New parameter to show the source of the answer
}

export default function AskMeResponseModal({ 
  isOpen, 
  onClose, 
  question, 
  answer, 
  isLoading, 
  error,
  source 
}: AskMeResponseModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  // Parse and rephrase the question for better display
  const parseQuestion = (q: string) => {
    // Remove common prefixes and make it more conversational
    let parsed = q.trim();
    
    // Remove question words at the beginning if they make the question redundant
    const questionWords = ['what is', 'what are', 'what was', 'what were', 'what will', 'what would', 'what could', 'what should'];
    for (const word of questionWords) {
      if (parsed.toLowerCase().startsWith(word)) {
        parsed = parsed.substring(word.length).trim();
        break;
      }
    }
    
    // Capitalize first letter
    parsed = parsed.charAt(0).toUpperCase() + parsed.slice(1);
    
    // Add question mark if not present
    if (!parsed.endsWith('?')) {
      parsed += '?';
    }
    
    return parsed;
  };

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  const handleCopy = async () => {
    if (textareaRef.current) {
      try {
        await navigator.clipboard.writeText(textareaRef.current.value);
        // You could add a toast notification here if desired
      } catch (err) {
        // Fallback for older browsers
        textareaRef.current.select();
        document.execCommand('copy');
      }
    }
  };

  const parsedQuestion = parseQuestion(question);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="glassy-rainbow-btn rounded-2xl bg-black p-4 w-full min-h-0 h-auto flex flex-col border-0" style={{ boxSizing: 'border-box' }}>
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="relative mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
              <h2 className="text-xl font-bold text-white">
                {source?.includes('Real-time Web Search') ? '🔍 Real-time Web Search Results' : '🤖 AI Response'}
              </h2>
              <button
                onClick={onClose}
                className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                style={{ background: '#111', border: 'none', outline: 'none' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="w-full px-4">
                {/* Question Section */}
                <div className="space-y-2 mb-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem', marginLeft: '-50px' }}>You asked the question:</label>
                  <div className="p-3 rounded-2xl text-white border-2 min-h-[60px] text-left" style={{ backgroundColor: 'transparent', borderColor: 'var(--favourite-blue)' }}>
                    <div className="text-white text-sm text-left">
                      {parsedQuestion}
                    </div>
                  </div>
                </div>

                {/* Answer Section */}
                <div className="space-y-2 mb-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>The answer to your question is:</label>
                  
                  {/* Source Label */}
                  {source && (
                    <div className="mb-2 p-2 rounded-lg bg-gray-800/50 border border-gray-600">
                      <span className="text-gray-300 text-xs">
                        Your answer was provided by <span className="text-blue-400 font-semibold">[{source}]</span>
                      </span>
                    </div>
                  )}
                  
                  {/* Loading State */}
                  {isLoading && (
                    <div className="p-3 rounded-2xl text-black border-2 min-h-[200px] flex items-center justify-center" style={{ backgroundColor: 'transparent', borderColor: 'var(--favourite-blue)' }}>
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mr-3"></div>
                        <span className="text-gray-800 text-lg">Getting your answer...</span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="p-3 rounded-2xl bg-red-100 text-black border-2 min-h-[200px]" style={{ backgroundColor: '#fee2e2', borderColor: 'var(--favourite-blue)' }}>
                      <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
                      <p className="text-red-700 text-base">{error}</p>
                    </div>
                  )}

                  {/* Answer State */}
                  {answer && !isLoading && !error && (
                    <>
                      <div className="p-3 rounded-2xl text-white border-2 min-h-[200px] max-h-[400px] text-left" style={{ backgroundColor: 'transparent', borderColor: 'var(--favourite-blue)' }}>
                        {source?.includes('Real-time Web Search') ? (
                          // Enhanced display for real-time search results
                          <div className="space-y-4">
                            <div className="text-green-400 text-sm font-semibold mb-3">
                              🔍 Real-time search results from the web:
                            </div>
                            <div 
                              className="w-full text-white border-0 resize-none bg-transparent text-sm leading-relaxed min-h-[180px] max-h-[380px] overflow-y-auto"
                              style={{ backgroundColor: 'transparent', outline: 'none' }}
                              dangerouslySetInnerHTML={{
                                __html: answer.replace(/\n/g, '<br>').replace(
                                  /\[Read more\]\((https?:\/\/[^)]+)\)/g,
                                  '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">[Read more]</a>'
                                )
                              }}
                            />
                          </div>
                        ) : (
                          // Regular textarea for AI responses
                          <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={() => {}} // Read-only but editable for selection
                            className="w-full text-white border-0 resize-none bg-transparent text-sm font-bold leading-relaxed min-h-[180px] max-h-[380px]"
                            style={{ backgroundColor: 'transparent', outline: 'none' }}
                            readOnly={false}
                          />
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={handleSelectAll}
                          className="flex-1 p-4 rounded-xl glassy-rainbow-btn text-white font-medium transition-all duration-200 border-0 text-sm"
                          style={{ background: '#111' }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={handleCopy}
                          className="flex-1 p-4 rounded-xl glassy-rainbow-btn text-white font-medium transition-all duration-200 border-0 text-sm"
                          style={{ background: '#111' }}
                        >
                          Copy
                        </button>
                        {source?.includes('Real-time Web Search') && (
                          <button
                            onClick={() => {
                              // Refresh the search
                              window.location.reload();
                            }}
                            className="flex-1 p-4 rounded-xl glassy-rainbow-btn text-white font-medium transition-all duration-200 border-0 text-sm"
                            style={{ background: '#111' }}
                          >
                            🔄 Refresh
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Empty State */}
                  {!answer && !isLoading && !error && (
                    <div className="p-3 rounded-2xl text-black border-2 min-h-[200px] flex items-center justify-center" style={{ backgroundColor: 'transparent', borderColor: 'var(--favourite-blue)' }}>
                      <span className="text-gray-600 text-lg">No answer available</span>
                    </div>
                  )}
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
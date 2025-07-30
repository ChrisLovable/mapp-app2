import { useState, useEffect, useRef } from 'react';
import { useSmartSpeechToText } from '../hooks/useSmartSpeechToText';
import { useLLMRouter } from '../hooks/useLLMRouter';

interface AskMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  onConfirm?: (question: string) => void;
  onAnswer?: (answer: string, method: 'virl' | 'gpt' | 'fallback') => void;
}

const TRIGGERS = [
  'current', 'now', 'latest', 'recent', 'live', 'today', 'this week', 'this month',
  'upcoming', 'breaking', 'real-time', 'updated', 'just announced', 'newly released',
  'in progress', 'trending', 'this hour', 'as of now', 'fresh', 'real-world', 'active',
  "what's happening", "what's new", "what's the status", 'any updates',
  'show me the latest', 'has it launched', 'is it released', 'are they working on',
  'ongoing', 'still available', 'still happening'
];

function containsTrigger(text: string) {
  const lower = text.toLowerCase();
  const match = TRIGGERS.find(trigger => lower.includes(trigger));
  console.log('Trigger word matched:', match);
  return !!match;
}

export default function AskMeModal({ isOpen, onClose, question, onConfirm, onAnswer }: AskMeModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [useRealTimeSearch, setUseRealTimeSearch] = useState(false);
  const [isTimeSensitive, setIsTimeSensitive] = useState(false);
  
  // 🛡️ MOBILE-PROOF: Use the global mic manager
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    isSupported
  } = useSmartSpeechToText({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    onResult: (text) => {
      console.log('🎤 AskMeModal transcript:', text);
      // 💬 PROMPT TRIM: Clean up transcript before adding
      const cleanedText = text.trim();
      if (cleanedText) {
        // 🧪 INPUT SAFETY: Debounce transcript updates
        setTimeout(() => {
          setCurrentQuestion(prev => {
            const newQuestion = prev + cleanedText;
            // 🧪 INPUT SAFETY: Limit to reasonable length
            return newQuestion.length > 1000 ? newQuestion.substring(0, 1000) : newQuestion;
          });
        }, 100); // 100ms debounce
      }
    },
    onError: (error) => {
      console.error('❌ AskMeModal speech error:', error);
      if (error.includes('not-allowed')) {
        alert('❌ Microphone permission denied. Please allow microphone access.');
      } else if (error.includes('no-speech')) {
        alert('❌ No speech detected. Please try speaking again.');
      } else {
        alert(`❌ Speech recognition error: ${error}`);
      }
    }
  });

  // 🧠 SMART: Use the coordinated LLM router
  const {
    answer,
    loading: isLoading,
    error,
    method,
    confidence,
    source,
    askQuestion,
    clearAnswer,
    cancelRequest
  } = useLLMRouter({
    timeout: 15000,
    enableVIRL: true,
    enableGPT: true,
    enableFallback: true
  });

  // Reset current question when modal opens
  useEffect(() => {
    if (isOpen) {
      if (question) {
        setCurrentQuestion(question);
      } else {
        setCurrentQuestion('');
      }
      
      // 🧠 SMART: Check if the question is time-sensitive using smart logic
      const fullQuestion = question || '';
      const timeSensitive = fullQuestion.toLowerCase().includes('now') || 
                           fullQuestion.toLowerCase().includes('latest') || 
                           fullQuestion.toLowerCase().includes('current') ||
                           fullQuestion.toLowerCase().includes('today') ||
                           fullQuestion.toLowerCase().includes('news');
      console.log('🔍 Smart time-sensitive check:', { question: fullQuestion, timeSensitive });
      setIsTimeSensitive(timeSensitive);
      setUseRealTimeSearch(timeSensitive);
      
      // Clear any previous answers
      clearAnswer();
    }
  }, [isOpen, question, clearAnswer]);

  // 🛡️ CANCEL ON MODAL CLOSE: Cancel any active requests when modal closes
  useEffect(() => {
    return () => {
      if (!isOpen) {
        console.log('🛑 AskMeModal: Cancelling requests on modal close');
        cancelRequest();
      }
    };
  }, [isOpen, cancelRequest]);

  // 🛡️ MOBILE-PROOF: Handle microphone toggle with protected hook
  const handleMicToggle = () => {
    console.log('🎤 AskMeModal mic toggle:', isListening ? 'stop' : 'start');
    if (isListening) {
      stopListening();
    } else {
      // 🛡️ MOBILE-PROOF: Wrap in requestAnimationFrame to avoid flicker/duplication
      requestAnimationFrame(() => {
        startListening();
      });
    }
  };

  const handleConfirm = async () => {
    if (!currentQuestion.trim()) return;
    
    console.log('🔍 AskMeModal starting smart analysis for:', currentQuestion);
    
    try {
      // 🧠 SMART: Use smart AskMe logic
      await askQuestion(currentQuestion);
      
      // Call onAnswer callback if provided
      if (onAnswer && answer) {
        onAnswer(answer, method || 'gpt');
      }
      
      // Call legacy onConfirm callback if provided
      if (onConfirm) {
        const questionWithType = {
          question: currentQuestion,
          useRealTimeSearch: useRealTimeSearch || isTimeSensitive
        };
        onConfirm(JSON.stringify(questionWithType));
      }
      
      // Don't close modal automatically - let parent handle it
      // onClose();
      
    } catch (err) {
      console.error('❌ AskMeModal failed:', err);
      // Error is already handled by the hook
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="glassy-rainbow-btn rounded-2xl bg-black p-4 w-full min-h-0 h-auto flex flex-col border-4" style={{ boxSizing: 'border-box' }}>
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
                         <div className="relative mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
               <h2 className="text-xl font-bold text-white">Real-time Web Search</h2>
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
                                 {/* Search Type Toggle */}
                 <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500 rounded-xl">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center">
                       <span className="text-2xl mr-2">🔍</span>
                       <h3 className="text-blue-300 font-semibold">Search Type</h3>
                     </div>
                     <div className="flex items-center space-x-2">
                       <span className="text-xs text-gray-400">AI Response</span>
                       <button
                         onClick={() => setUseRealTimeSearch(!useRealTimeSearch)}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                           useRealTimeSearch ? 'bg-green-600' : 'bg-gray-600'
                         }`}
                       >
                         <span
                           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                             useRealTimeSearch ? 'translate-x-6' : 'translate-x-1'
                           }`}
                         />
                       </button>
                       <span className="text-xs text-gray-400">Real-time Web</span>
                     </div>
                   </div>
                   <p className="text-gray-300 text-sm">
                     {useRealTimeSearch 
                       ? "🔍 Real-time Web Search: Get the most current information from the web"
                       : "🤖 AI Response: Get a comprehensive AI-generated answer"
                     }
                   </p>
                   {isTimeSensitive && (
                     <div className="mt-2 p-2 bg-green-900/30 border border-green-400 rounded-lg">
                       <p className="text-green-300 text-xs">
                         ⚡ Time-sensitive keywords detected! Real-time search recommended.
                       </p>
                     </div>
                   )}
                 </div>

                {/* Question Input */}
                <div className="space-y-2 mb-2">
                  <div className="flex flex-col mb-4 w-full">
                    <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Question</label>
                    <div className="flex items-center space-x-2">
                      <textarea 
                        className="flex-1 p-3 rounded-2xl bg-white text-black border-2 min-h-[60px] text-left resize-none"
                        style={{ backgroundColor: 'white', borderColor: 'var(--favourite-blue)' }}
                        value={currentQuestion + transcript}
                        readOnly
                        placeholder="Your question will appear here..."
                      />
                      <button
                        onClick={handleMicToggle}
                        onPointerDown={(e) => e.preventDefault()} // 🛡️ MOBILE-PROOF: Prevent ghost tap
                        onTouchStart={(e) => e.preventDefault()} // 🛡️ MOBILE-PROOF: Redundant but safe
                        className={`p-2 rounded-full transition-all duration-200 ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        title={isListening ? 'Stop Recording' : 'Start Recording'}
                        disabled={!isSupported}
                      >
                        <span className="text-white text-lg">
                          {isListening ? '⏹️' : '🎤'}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('🧪 Testing microphone permissions...');
                          navigator.mediaDevices.getUserMedia({ audio: true })
                            .then(stream => {
                              console.log('✅ Microphone test successful');
                              alert('✅ Microphone is working! Permission granted.');
                              stream.getTracks().forEach(track => track.stop());
                            })
                            .catch(error => {
                              console.error('❌ Microphone test failed:', error);
                              alert(`❌ Microphone test failed: ${error.message}`);
                            });
                        }}
                        className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-200"
                        title="Test Microphone"
                      >
                        <span className="text-white text-lg">🧪</span>
                      </button>
                    </div>
                    {isListening && (
                      <div className="mt-2 text-xs text-green-400 flex items-center">
                        <span className="animate-pulse mr-2">🎤</span>
                        Listening... {transcript && `"${transcript}"`}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="mb-4 text-gray-300">
                  Speak your question, then say 'Go', 'Send', 'Submit', or 'Ask' to get a smart response.
                </p>
                
                {/* 🧠 SMART: Show analysis results */}
                {isLoading && (
                  <div className="mb-4 p-3 bg-blue-900/30 border border-blue-400 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                      <p className="text-blue-300 text-sm">
                        🔍 Analyzing your question and choosing the best approach...
                      </p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-400 rounded-lg">
                    <p className="text-red-300 text-sm">
                      ❌ {error}
                    </p>
                  </div>
                )}
                
                {answer && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-400 rounded-lg">
                    <div className="mb-2">
                      <span className="text-green-300 text-xs">
                        {method === 'virl' ? '🔍 Real-time Search' : 
                         method === 'gpt' ? '🤖 AI Response' : 
                         method === 'fallback' ? '⚠️ Fallback Response' : '🤖 Response'}
                      </span>
                      {confidence > 0 && (
                        <span className="text-gray-400 text-xs ml-2">
                          (Confidence: {Math.round(confidence * 100)}%)
                        </span>
                      )}
                    </div>
                    <p className="text-green-300 text-sm whitespace-pre-wrap">
                      {answer}
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 mt-6">
                  <button 
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors" 
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      isLoading 
                        ? 'bg-gray-500' 
                        : useRealTimeSearch 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleConfirm}
                    disabled={!currentQuestion.trim() || isLoading}
                  >
                    {isLoading 
                      ? '🔄 Processing...' 
                      : useRealTimeSearch 
                        ? '🔍 Smart Search' 
                        : '🤖 Smart Ask'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { containsTrigger }; 
import { useState, useEffect, useRef } from 'react';

interface AskMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  onConfirm: (question: string) => void;
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

export default function AskMeModal({ isOpen, onClose, question, onConfirm }: AskMeModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [useRealTimeSearch, setUseRealTimeSearch] = useState(false);
  const [isTimeSensitive, setIsTimeSensitive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Reset current question when modal opens
  useEffect(() => {
    if (isOpen) {
      if (question) {
        setCurrentQuestion(question);
      } else {
        setCurrentQuestion('');
      }
      setTranscript('');
      
             // Check if the question is time-sensitive
       const fullQuestion = question || '';
       const timeSensitive = containsTrigger(fullQuestion);
       setIsTimeSensitive(timeSensitive);
       setUseRealTimeSearch(timeSensitive);
    }
  }, [isOpen, question]);

  // Initialize speech recognition
  useEffect(() => {
    if (isOpen && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('AskMeModal: Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          // Check for "Go" keyword to send the question
          const cleanTranscript = finalTranscript.toLowerCase().trim();
          if (cleanTranscript === 'go' || cleanTranscript.includes('go') || 
              cleanTranscript === 'send' || cleanTranscript.includes('send') ||
              cleanTranscript === 'submit' || cleanTranscript.includes('submit') ||
              cleanTranscript === 'ask' || cleanTranscript.includes('ask')) {
            const fullQuestion = currentQuestion + transcript;
            if (fullQuestion.trim() && fullQuestion.length > 5) {
              console.log('AskMeModal: Send keyword detected, sending question:', fullQuestion);
              onConfirm(fullQuestion);
              onClose();
            } else {
              console.log('AskMeModal: Send keyword detected but no valid question to send');
            }
            return;
          }
          
          const newQuestion = currentQuestion + finalTranscript;
          setCurrentQuestion(newQuestion);
          setTranscript('');
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('AskMeModal: Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('AskMeModal: Speech recognition ended');
      };

      recognitionRef.current = recognition;
      
      // Start listening when modal opens
      setTimeout(() => {
        try {
          recognition.start();
          console.log('AskMeModal: Speech recognition started, waiting for user input');
        } catch (error) {
          console.error('AskMeModal: Error starting recognition:', error);
        }
      }, 1000);

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [isOpen, currentQuestion]);

  const handleConfirm = () => {
    if (currentQuestion.trim()) {
      // Pass the question with search type information
      const questionWithType = {
        question: currentQuestion,
        useRealTimeSearch: useRealTimeSearch || isTimeSensitive
      };
      onConfirm(JSON.stringify(questionWithType));
      onClose();
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
                    <textarea 
                      className="w-full p-3 rounded-2xl bg-white text-black border-2 min-h-[60px] text-left resize-none"
                      style={{ backgroundColor: 'white', borderColor: 'var(--favourite-blue)' }}
                      value={currentQuestion + transcript}
                      readOnly
                      placeholder="Your question will appear here..."
                    />
                    {isListening && (
                      <div className="mt-2 text-xs text-green-400 flex items-center">
                        <span className="animate-pulse mr-2">🎤</span>
                        Listening... {transcript && `"${transcript}"`}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="mb-4 text-gray-300">
                  Speak your question, then say 'Go', 'Send', 'Submit', or 'Ask' to search the web for current information.
                </p>
                
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
                       useRealTimeSearch 
                         ? 'bg-green-600 hover:bg-green-700' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                     onClick={handleConfirm}
                     disabled={!currentQuestion.trim()}
                   >
                     {useRealTimeSearch ? '🔍 Search Web' : '🤖 Ask AI'}
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
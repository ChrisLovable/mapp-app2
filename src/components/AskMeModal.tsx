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
      console.log('🔍 Time-sensitive check:', { question: fullQuestion, timeSensitive, triggers: TRIGGERS });
      setIsTimeSensitive(timeSensitive);
      setUseRealTimeSearch(timeSensitive);
    }
  }, [isOpen, question]);

  // Start listening when user clicks microphone button
  const startListening = () => {
    console.log('🎤 Starting microphone...');
    
    // Immediately show recording state
    setIsListening(true);
    
    // Simple mobile-friendly approach
    try {
      // Check if speech recognition is available
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('❌ Speech recognition not supported. Please use Chrome or Safari.');
        setIsListening(false);
        return;
      }

      // Create new recognition instance each time
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Mobile-friendly settings
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('✅ Speech recognition started');
      };

      recognition.onresult = (event) => {
        console.log('🎤 Speech result received');
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
          setCurrentQuestion(prev => prev + finalTranscript);
          setTranscript('');
          console.log('📝 Final transcript:', finalTranscript);
        } else {
          setTranscript(interimTranscript);
          console.log('📝 Interim transcript:', interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('❌ Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          alert('❌ No speech detected. Please try speaking again.');
        } else {
          alert(`❌ Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Speech recognition ended');
        setIsListening(false);
      };

      // Store reference and start
      recognitionRef.current = recognition;
      recognition.start();
      console.log('✅ Speech recognition started successfully');
      
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      alert('❌ Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    console.log('⏹️ Stopping microphone...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('✅ Microphone stopped');
      } catch (error) {
        console.error('❌ Error stopping microphone:', error);
      }
    }
  };

  const handleConfirm = () => {
    if (currentQuestion.trim()) {
      // Pass the question with search type information
      const questionWithType = {
        question: currentQuestion,
        useRealTimeSearch: useRealTimeSearch || isTimeSensitive
      };
      console.log('🔍 AskMeModal confirm:', questionWithType);
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
                    <div className="flex items-center space-x-2">
                      <textarea 
                        className="flex-1 p-3 rounded-2xl bg-white text-black border-2 min-h-[60px] text-left resize-none"
                        style={{ backgroundColor: 'white', borderColor: 'var(--favourite-blue)' }}
                        value={currentQuestion + transcript}
                        readOnly
                        placeholder="Your question will appear here..."
                      />
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        title={isListening ? 'Stop Recording' : 'Start Recording'}
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
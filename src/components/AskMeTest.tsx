import { useState } from 'react';
import AskMeModal from './AskMeModal';
import AskMeResponseModal from './AskMeResponseModal';
import { useSmartAskMe } from '../hooks/useSmartAskMe';

export default function AskMeTest() {
  const [question, setQuestion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  
  // 🧠 SMART: Use the smart AskMe hook
  const {
    isLoading,
    answer,
    error,
    method,
    confidence,
    askQuestion,
    clearAnswer,
    isTimeSensitive
  } = useSmartAskMe();

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    console.log('🔍 Smart AskMe starting for:', question);
    
    // Show the modal for smart analysis
    setShowModal(true);
  };

  const handleSmartAnswer = async (answer: string, method: 'real-time' | 'ai' | 'fallback') => {
    console.log('✅ Smart answer received:', { method, answerLength: answer.length });
    
    // Close the modal and show response
    setShowModal(false);
    setShowResponseModal(true);
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    clearAnswer();
  };

  return (
    <div className="p-4 bg-white text-black min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Ask Me Test</h1>
        
        <div className="mb-6">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-black resize-none"
            rows={4}
            placeholder="Ask me something... (try 'latest news' or 'tell me a joke')"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Ask Me'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How to test:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Enter "tell me a joke" → Direct GPT response</li>
            <li>Enter "latest news" → Modal with choice between real-time and GPT</li>
            <li>Enter "current weather" → Modal with choice between real-time and GPT</li>
            <li>Enter "what's happening now" → Modal with choice between real-time and GPT</li>
          </ul>
        </div>

        <AskMeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          question={question}
          onAnswer={handleSmartAnswer}
        />

        <AskMeResponseModal
          isOpen={showResponseModal}
          onClose={closeResponseModal}
          question={question}
          answer={answer}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
} 
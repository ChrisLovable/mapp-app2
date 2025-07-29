import { useState } from 'react';
import AskMeModal, { containsTrigger } from './AskMeModal';
import AskMeResponseModal from './AskMeResponseModal';
import { getRealTimeAnswer, getGPTAnswer } from '../lib/AskMeLogic';

export default function AskMeTest() {
  const [question, setQuestion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const handleAsk = () => {
    console.log('Checking:', question);
    const shouldShow = containsTrigger(question);
    console.log('Should show modal?', shouldShow);
    if (shouldShow) {
      // For time-sensitive questions, show choice modal first
      setShowModal(true);
    } else {
      // For non-time-sensitive questions, go directly to GPT response
      handleGPTResponse();
    }
  };

  const handleGPTResponse = async () => {
    setIsLoading(true);
    setError('');
    setAnswer('');
    setShowResponseModal(true);
    
    try {
      const response = await getGPTAnswer(question);
      setAnswer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (mode: 'realtime' | 'general') => {
    // Close the choice modal first
    setShowModal(false);
    
    // Open the response modal and start loading
    setIsLoading(true);
    setError('');
    setAnswer('');
    setShowResponseModal(true);
    
    try {
      let response: string;
      
      if (mode === 'realtime') {
        response = await getRealTimeAnswer(question);
      } else {
        response = await getGPTAnswer(question);
      }
      
      setAnswer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setAnswer('');
    setError('');
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
          onSelect={handleChoice}
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
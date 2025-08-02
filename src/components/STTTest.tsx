import React, { useState } from 'react';
import { SpeechToTextButton } from './SpeechToTextButton';

export const STTTest: React.FC = () => {
  const [transcript, setTranscript] = useState('');

  const handleSTTResult = (text: string) => {
    setTranscript(text);
  };

  return (
    <div className="p-6 bg-black border border-white rounded-xl">
      <h3 className="text-xl font-bold text-white mb-4">STT Test</h3>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speech will appear here..."
          className="flex-1 px-4 py-3 bg-black border-2 border-white rounded-xl text-white"
        />
        <SpeechToTextButton
          onResult={handleSTTResult}
          onError={(error) => alert(error)}
          size="md"
        />
      </div>
      <p className="text-gray-400 text-sm">
        Click the microphone button and start speaking. The text should appear in real-time.
      </p>
    </div>
  );
}; 
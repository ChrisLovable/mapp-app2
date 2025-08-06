import { useState } from 'react';

interface Props {
  message: string;
  language: string;
}

export default function VoiceOutput({ message, language }: Props) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (!message) return;
    
    if (speaking) {
      setSpeaking(false);
      return;
    }

    setSpeaking(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        alert('OpenAI API key not found. Please check your configuration.');
        return;
      }

      // Use OpenAI TTS directly
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: message,
          voice: 'alloy', // You can change this to: alloy, echo, fable, onyx, nova, shimmer
          response_format: 'mp3',
          speed: 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeaking(false);
        alert('Failed to play audio. Please try again.');
      };
      
      await audio.play();
      console.log('OpenAI TTS playing:', message);
    } catch (error) {
      console.error('OpenAI TTS Error:', error);
      alert('Failed to generate speech. Please try again.');
      setSpeaking(false);
    }
  };

  // Show server status indicator
  const getButtonStyle = () => {
    return {
      backgroundColor: speaking ? '#16a34a' : 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.8)',
      color: speaking ? 'white' : 'var(--text-color)',
      boxShadow: speaking ? '0 0 0 4px rgba(22, 163, 74, 0.6)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    };
  };

  const getTooltipText = () => {
    return speaking ? 'Stop speaking' : 'Speak message';
  };

  return (
    <button
      className={`glassy-btn neon-grid-btn p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border-0 active:scale-95 relative overflow-visible
        ${speaking ? 'scale-125 animate-pulse ring-4 ring-opacity-60' : ''}`}
      style={{
        background: '#111',
        color: speaking ? 'white' : 'var(--text-color)',
        boxShadow: '0 1px 6px 1px #00fff7, 0 2px 8px 0 #000, 0 1px 4px 0 #00fff766, 0 1.5px 3px rgba(30, 64, 175, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}
      onClick={handleSpeak}
      aria-label={speaking ? 'Stop speaking' : 'Speak message'}
      type="button"
      title={getTooltipText()}
    >
      <span className="text-4xl">
        {speaking ? '🔊' : '🔊'}
      </span>
    </button>
  );
}

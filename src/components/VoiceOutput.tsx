import { useState, useEffect } from 'react';
import { ttsService, generateAndPlaySpeech } from '../utils/tts';

interface Props {
  message: string;
  language: string;
}

export default function VoiceOutput({ message, language }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  // Check server availability on component mount
  useEffect(() => {
    ttsService.checkServerAvailability().then(setServerAvailable);
  }, []);

  const handleSpeak = async () => {
    if (!message) return;
    
    if (speaking) {
      setSpeaking(false);
      return;
    }

    // Check server availability before attempting TTS
    if (serverAvailable === false) {
      const instructions = 'Voice server is not available.\n\nTo start the voice server:\n1. Open a new terminal\n2. Navigate to your project directory\n3. Run: node azure-tts-proxy.js\n\nThen refresh this page.';
      alert(instructions);
      return;
    }

    setSpeaking(true);

    try {
      // Lazy fetch TTS audio only when user explicitly requests it
      const result = await generateAndPlaySpeech({
          text: message,
          language: language
      });

      if (!result.success) {
        alert(result.error);
        setServerAvailable(false);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setSpeaking(false);
    }
  };

  // Show server status indicator
  const _getButtonStyle = () => {
    if (serverAvailable === false) {
      return {
        background: '#333',
        color: '#666',
        cursor: 'not-allowed'
      };
    }
    return {};
  };

  const getTooltipText = () => {
    if (serverAvailable === false) {
      return 'Voice server is not available. Click for instructions to start it.';
    }
    return speaking ? 'Stop speaking' : 'Speak message';
  };

  return (
    <button
      className={`glassy-btn neon-grid-btn p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border-0 active:scale-95 relative overflow-visible
        ${speaking ? 'scale-125 animate-pulse ring-4 ring-opacity-60' : ''}
        ${serverAvailable === false ? 'opacity-50' : ''}`}
      style={{
        background: '#111',
        color: speaking ? 'white' : 'var(--text-color)',
        boxShadow: '0 1px 6px 1px #00fff7, 0 2px 8px 0 #000, 0 1px 4px 0 #00fff766, 0 1.5px 3px rgba(30, 64, 175, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}
      onClick={handleSpeak}
      disabled={serverAvailable === false}
      aria-label={speaking ? 'Stop speaking' : serverAvailable === false ? 'Voice server unavailable' : 'Speak message'}
      type="button"
      title={getTooltipText()}
    >
      <span className="text-4xl">
        {serverAvailable === false ? '🔇' : '🔊'}
      </span>
    </button>
  );
}

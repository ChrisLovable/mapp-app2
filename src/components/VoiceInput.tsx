import { useContinuousSpeechToText } from '../hooks/useSpeechToText';

interface Props {
  language: string;
  onResult: (text: string) => void;
}

export default function VoiceInput({ language, onResult }: Props) {
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useContinuousSpeechToText({
    language,
    onResult
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      className={`glassy-btn neon-grid-btn p-2 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border-0 active:scale-95 relative overflow-visible
        ${isListening ? 'scale-125 animate-pulse ring-4 ring-red-500 ring-opacity-80 bg-red-600' : ''}
      `}
      style={{
        background: isListening ? '#dc2626' : '#111',
        color: isListening ? 'white' : 'var(--text-color)',
        boxShadow: isListening
          ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
          : '0 1px 6px 1px #00fff7, 0 2px 8px 0 #000, 0 1px 4px 0 #00fff766, 0 1.5px 3px rgba(30, 64, 175, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}
      onClick={handleMicClick}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
      type="button"
      disabled={!isSupported}
    >
      <span className={`text-4xl transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`}>🎤</span>
    </button>
  );
}

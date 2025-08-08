import React from 'react';

export interface StandaloneSttButtonProps {
  onTextUpdate: (newText: string) => void;
  currentText: string;
  language?: 'en-US' | 'af-ZA' | string;
  buttonText?: string;
  className?: string;
}

const StandaloneSttButton: React.FC<StandaloneSttButtonProps> = ({
  onTextUpdate,
  currentText,
  language = 'en-US',
  buttonText,
  className = ''
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const baseTextRef = React.useRef<string>('');

  const start = React.useCallback(() => {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    // Store only the text that existed BEFORE STT started
    baseTextRef.current = (currentText || '').trim();

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalChunk += transcript;
        else interimChunk += transcript;
      }

      const sttCombined = (finalChunk + interimChunk).trim();
      const prefix = baseTextRef.current;
      const newText = prefix ? `${prefix} ${sttCombined}`.trim() : sttCombined;
      onTextUpdate(newText);

      // Advance base only on final results to prevent duplication
      if (finalChunk.trim()) {
        baseTextRef.current = newText;
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Standalone STT error:', e);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [currentText, language, onTextUpdate]);

  const stop = React.useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  const toggle = React.useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  React.useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  const label = buttonText || (language === 'af-ZA' ? '🎤 Stem (AF)' : '🎤 Voice (EN)');

  return (
    <button
      type="button"
      onClick={toggle}
      className={`glassy-btn neon-grid-btn rounded-2xl font-extrabold text-xl shadow-2xl transition-all active:scale-95 ${className}`}
      style={{
        background: isListening
          ? 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(220,38,38,0.8), rgba(0,0,0,0.4))'
          : 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.8), rgba(59,130,246,0.2))',
        color: '#fff',
        border: '2px solid rgba(255,255,255,0.4)',
        backdropFilter: 'blur(20px)'
      }}
      aria-label={isListening ? 'Stop standalone mic' : 'Start standalone mic'}
    >
      {isListening ? '■ Stop Mic' : label}
    </button>
  );
};

export default StandaloneSttButton;

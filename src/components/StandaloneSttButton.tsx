import React from 'react';

export interface StandaloneSttButtonProps {
  onTextUpdate: (newText: string) => void;
  currentText: string;
  language?: 'en-US' | 'af-ZA' | string;
  buttonText?: string;
  className?: string;
  compact?: boolean;
}

const isMobileUA = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const StandaloneSttButton: React.FC<StandaloneSttButtonProps> = ({
  onTextUpdate,
  currentText,
  language = 'en-US',
  buttonText,
  className = '',
  compact = false
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const baseTextRef = React.useRef<string>('');
  const lastEmittedRef = React.useRef<string>('');

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

    // Fix base at session start to avoid double-concatenation
    baseTextRef.current = (currentText || '').trim();
    lastEmittedRef.current = baseTextRef.current;

    recognition.onresult = (event: any) => {
      // Rebuild from ALL results every time (mobile often resets resultIndex)
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript: string = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          // Keep the latest interim only
          interimTranscript = transcript;
        }
      }

      const combinedSTT = `${finalTranscript}${interimTranscript}`.trim();
      const nextText = [baseTextRef.current, combinedSTT].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

      // Suppress duplicate emissions
      if (nextText === lastEmittedRef.current) return;
      onTextUpdate(nextText);
      lastEmittedRef.current = nextText;
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
  const content = compact ? (isListening ? '■' : '🎤') : (isListening ? '■ Stop Mic' : label);

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
      {content}
    </button>
  );
};

export default StandaloneSttButton;

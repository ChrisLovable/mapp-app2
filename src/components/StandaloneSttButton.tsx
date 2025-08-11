import React from 'react';

export interface StandaloneSttButtonProps {
  onTextUpdate: (newText: string) => void;
  currentText: string;
  language?: 'en-US' | 'af-ZA' | string;
  buttonText?: string;
  className?: string;
}

const isMobileUA = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const StandaloneSttButton: React.FC<StandaloneSttButtonProps> = ({
  onTextUpdate,
  currentText,
  language = 'en-US',
  buttonText,
  className = ''
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const globalBaseRef = React.useRef<string>(''); // persists across auto-restarts
  const lastEmittedRef = React.useRef<string>('');
  const prevCombinedRef = React.useRef<string>('');
  const shouldContinueRef = React.useRef<boolean>(false);

  const start = React.useCallback(() => {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    const mobile = isMobileUA();
    recognition.continuous = true;
    recognition.interimResults = !mobile; // final-only on mobile to reduce duplication
    recognition.lang = language;

    // Initialize session base only once per overarching session
    if (!shouldContinueRef.current) {
      globalBaseRef.current = (currentText || '').trim();
      lastEmittedRef.current = globalBaseRef.current;
      prevCombinedRef.current = '';
    }

    recognition.onresult = (event: any) => {
      // Rebuild from all results each time for robustness
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript: string = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript = transcript; // keep the latest interim
        }
      }

      const combined = (recognition.interimResults
        ? `${finalTranscript}${interimTranscript}`
        : `${finalTranscript}`).trim();

      // Guard: avoid regressions and repeats
      if (combined === prevCombinedRef.current) return;
      prevCombinedRef.current = combined;

      const nextText = [globalBaseRef.current, combined]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (nextText !== lastEmittedRef.current) {
        onTextUpdate(nextText);
        lastEmittedRef.current = nextText;
      }

      // Advance the global base only when new finals arrive (stabilized text)
      if (finalTranscript.trim()) {
        globalBaseRef.current = [globalBaseRef.current, finalTranscript]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        // After advancing base, reset prevCombined to the remaining interim to avoid double-adding
        prevCombinedRef.current = recognition.interimResults ? interimTranscript.trim() : '';
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Standalone STT error:', e);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (shouldContinueRef.current) {
        // Auto-restart to keep continuous session on mobile
        start();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldContinueRef.current = true;
    recognition.start();
    setIsListening(true);
  }, [currentText, language, onTextUpdate]);

  const stop = React.useCallback(() => {
    shouldContinueRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  }, []);

  const toggle = React.useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  React.useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  const label = buttonText || '🎤';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`glassy-btn neon-grid-btn rounded-2xl font-extrabold text-xl shadow-2xl transition-all active:scale-95 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(220,38,38,0.2))',
        color: '#fff',
        border: '2px solid rgba(255,255,255,0.4)',
        backdropFilter: 'blur(20px)',
        filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.7)) drop-shadow(0 0 16px rgba(220,38,38,0.4))',
        boxShadow: '0 15px 30px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.4), 0 0 0 2px rgba(220,38,38,0.3), 0 0 0 1px rgba(255,255,255,0.2)',
        transform: 'translateZ(20px) perspective(1000px) rotateX(5deg)'
      }}
      aria-label={isListening ? 'Stop standalone mic' : 'Start standalone mic'}
    >
      {isListening ? '■ Stop Mic' : label}
    </button>
  );
};

export default StandaloneSttButton;

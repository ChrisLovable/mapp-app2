import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface SpeechContextValue {
  isListening: boolean;
  transcriptLive: string;      // accumulated final + current interim
  transcriptFinal: string;     // accumulated final only
  finalDelta: string;          // new final text since previous commit
  finalVersion: number;        // increments on each new finalDelta
  startListening: (language?: string) => void;
  stopListening: () => void;
}

const SpeechContext = createContext<SpeechContextValue | undefined>(undefined);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const recognitionRef = useRef<SpeechRecognition | null>(null as any);
  const [isListening, setIsListening] = useState(false);
  const languageRef = useRef<string>('en-US');

  const accumulatedFinalRef = useRef<string>('');
  const lastResultIndexRef = useRef<number>(0);

  const [transcriptLive, setTranscriptLive] = useState('');
  const [transcriptFinal, setTranscriptFinal] = useState('');
  const [finalDelta, setFinalDelta] = useState('');
  const [finalVersion, setFinalVersion] = useState(0);

  const startListening = useCallback((language?: string) => {
    if (isListening) return; // mic lock

    const SpeechRecognitionImpl: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    languageRef.current = language || languageRef.current;

    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognition.lang = languageRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      accumulatedFinalRef.current = '';
      lastResultIndexRef.current = 0;
      setTranscriptFinal('');
      setTranscriptLive('');
      setFinalDelta('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let newFinalChunk = '';

      for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
        const result = event.results.item(i);
        const text = result.item(0).transcript;
        if (result.isFinal) {
          newFinalChunk += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      lastResultIndexRef.current = event.results.length;

      if (newFinalChunk) {
        const prevFinal = accumulatedFinalRef.current;
        accumulatedFinalRef.current = (prevFinal + ' ' + newFinalChunk).trim();
        setTranscriptFinal(accumulatedFinalRef.current);
        // Compute delta based on previous final
        const delta = accumulatedFinalRef.current.startsWith(prevFinal)
          ? accumulatedFinalRef.current.slice(prevFinal.length).trim()
          : newFinalChunk.trim();
        if (delta) {
          setFinalDelta(delta);
          setFinalVersion(v => v + 1);
        }
      }

      const live = interimTranscript
        ? (accumulatedFinalRef.current + ' ' + interimTranscript).trim()
        : accumulatedFinalRef.current;
      setTranscriptLive(live);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  const value: SpeechContextValue = {
    isListening,
    transcriptLive,
    transcriptFinal,
    finalDelta,
    finalVersion,
    startListening,
    stopListening,
  };

  return (
    <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>
  );
}

export function useSpeech(): SpeechContextValue {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeech must be used within SpeechProvider');
  return ctx;
}

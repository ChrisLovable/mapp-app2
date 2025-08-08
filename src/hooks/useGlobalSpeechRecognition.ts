let recognitionInstance: SpeechRecognition | null = null;

export interface GlobalSpeechRecognitionAPI {
  start(
    language?: string,
    onResult?: (text: string) => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): void;
  stop(): void;
}

export const GlobalSpeechRecognition: GlobalSpeechRecognitionAPI = {
  start(language = 'en-US', onResult, onEnd, onError) {
    // Stop any existing session first
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch {}
      recognitionInstance = null;
    }

    const SR: typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new (SR as any)() as SpeechRecognition;
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      try {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(' ')
          .trim();
        onResult?.(transcript);
      } catch (err) {
        console.error('Error processing speech recognition result', err);
        onError?.('Failed to process speech recognition result.');
      }
    };

    recognition.onend = () => {
      recognitionInstance = null;
      onEnd?.();
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event?.error);
      onError?.(String(event?.error ?? 'unknown'));
    };

    recognitionInstance = recognition;
    try {
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start error:', err);
      recognitionInstance = null;
      onError?.(err?.message || 'Failed to start speech recognition');
    }
  },

  stop() {
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
      recognitionInstance = null;
    }
  },
};



declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
  }

  interface Command {
    command: string;
    callback: () => void;
    matchInterim?: boolean;
  }

  interface SpeechRecognitionHook {
    startListening(options?: SpeechRecognitionOptions): void;
    stopListening(): void;
    transcript: string;
    listening: boolean;
    resetTranscript(): void;
    browserSupportsSpeechRecognition: boolean;
  }

  function useSpeechRecognition(options?: {
    commands?: Command[];
  }): SpeechRecognitionHook;

  export { useSpeechRecognition };
}
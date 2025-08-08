declare module '*.css';

// Ambient module declaration for JS helper so TS can type it
declare module '../hooks/useGlobalSpeechRecognition' {
  export interface GlobalSpeechRecognitionAPI {
    start(
      language?: string,
      onResult?: (text: string) => void,
      onEnd?: () => void,
      onError?: (error: string) => void
    ): void;
    stop(): void;
  }
  export const GlobalSpeechRecognition: GlobalSpeechRecognitionAPI;
}
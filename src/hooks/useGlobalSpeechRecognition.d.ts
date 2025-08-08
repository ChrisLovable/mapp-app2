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



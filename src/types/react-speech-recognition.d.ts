declare module 'react-speech-recognition' {
  export interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
  }

  export interface UseSpeechRecognitionReturn {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionReturn;
  
  export default {
    startListening: (options?: SpeechRecognitionOptions) => void;
    stopListening: () => void;
  };
} 
interface UseSpeechToTextOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onStop?: () => void;
}
interface UseSpeechToTextReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    isSupported: boolean;
}
export declare const useSpeechToText: (options?: UseSpeechToTextOptions) => UseSpeechToTextReturn;
export declare const useContinuousSpeechToText: (options?: UseSpeechToTextOptions) => UseSpeechToTextReturn;
export declare const useMobileSpeechToText: (options?: UseSpeechToTextOptions) => UseSpeechToTextReturn;
export {};

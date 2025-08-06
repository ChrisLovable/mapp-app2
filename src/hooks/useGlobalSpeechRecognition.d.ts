export declare const GlobalSpeechRecognition: {
    start: (lang: string, onResult: (transcript: string, isFinal: boolean) => void, onEnd: () => void, onError: (error: string) => void) => void;
    stop: () => void;
};

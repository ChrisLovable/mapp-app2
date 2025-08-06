interface TTSOptions {
    text: string;
    language: string;
    voice?: string;
    rate?: number;
    pitch?: number;
}
interface TTSResponse {
    success: boolean;
    audioUrl?: string;
    error?: string;
}
declare class TTSService {
    private static instance;
    private serverAvailable;
    private serverCheckPromise;
    private constructor();
    static getInstance(): TTSService;
    checkServerAvailability(): Promise<boolean>;
    private performServerCheck;
    generateSpeech(options: TTSOptions): Promise<TTSResponse>;
    playAudio(audioUrl: string): Promise<void>;
    resetServerStatus(): void;
}
export declare const ttsService: TTSService;
export declare const generateAndPlaySpeech: (options: TTSOptions) => Promise<TTSResponse>;
export declare const checkTTSServer: () => Promise<boolean>;
export {};

export declare class TokenTracker {
    private apiBaseUrl;
    private isEnabled;
    constructor();
    logUsage(data: {
        apiName: string;
        endpoint: string;
        sourceModal: string;
        tokensUsed: number;
        requestData?: any;
        responseStatus: string;
        responseTimeMs: number;
        status: 'success' | 'failed' | 'error';
        errorMessage?: string;
    }): Promise<void>;
    logSuccess(data: {
        apiName: string;
        endpoint: string;
        sourceModal: string;
        tokensUsed: number;
        requestData?: any;
        responseTimeMs: number;
    }): Promise<void>;
    logFailure(data: {
        apiName: string;
        endpoint: string;
        sourceModal: string;
        tokensUsed: number;
        requestData?: any;
        responseStatus: string;
        responseTimeMs: number;
        errorMessage: string;
    }): Promise<void>;
    trackApiCall<T>(apiName: string, endpoint: string, sourceModal: string, tokensUsed: number, apiCall: () => Promise<T>, requestData?: any): Promise<T>;
}
export declare const tokenTracker: TokenTracker;
export declare const trackImageGeneration: (prompt: string, sourceModal: string) => Promise<any>;
export declare const trackTextGeneration: (prompt: string, sourceModal: string) => Promise<any>;
export declare const trackTextToSpeech: (text: string, sourceModal: string) => Promise<any>;
export declare const trackSpeechToText: (audioData: any, sourceModal: string) => Promise<any>;
export declare const trackTranslation: (text: string, targetLanguage: string, sourceModal: string) => Promise<any>;
export declare const trackPdfProcessing: (pdfData: any, sourceModal: string) => Promise<any>;

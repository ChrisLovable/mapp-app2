export interface RealtimeDetectionResult {
    isRealtime: boolean;
    confidence: number;
    matchedTriggers: string[];
}
export interface AIResponse {
    success: boolean;
    response?: string;
    error?: string;
    tokensUsed?: number;
}
export declare class AskMeLogic {
    private static readonly API_URL;
    /**
     * Detects if a question requires real-time or up-to-date information
     */
    static detectRealtimeQuestion(question: string): RealtimeDetectionResult;
    static sendQuestionToAI(question: string, imageFile?: File): Promise<AIResponse>;
    static formatResponse(response: string): string;
    /**
     * Converts a File object to base64 data URL for OpenAI Vision API
     */
    private static fileToBase64;
}

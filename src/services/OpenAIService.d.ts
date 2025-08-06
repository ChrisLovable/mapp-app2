export interface AIResponse {
    content: string;
    tokens: number;
    model: string;
}
export interface PromptConfig {
    maxTokens?: number;
    temperature?: number;
    model?: string;
}
export declare class OpenAIService {
    private apiKey;
    private defaultModel;
    private defaultMaxTokens;
    private defaultTemperature;
    constructor();
    getResponse(prompt: string, config?: PromptConfig): Promise<AIResponse>;
    getResponseWithRetry(prompt: string, config?: PromptConfig, maxRetries?: number): Promise<AIResponse>;
    analyzeExpenseData(prompt: string, expenseData: any): Promise<AIResponse>;
    answerQuickQuestion(question: string, contextData: any): Promise<AIResponse>;
    analyzeTrends(trendData: any): Promise<AIResponse>;
    generateInsights(insightData: any): Promise<AIResponse>;
    estimateTokens(text: string): number;
    isWithinTokenLimit(prompt: string, maxTokens?: number): boolean;
    truncatePrompt(prompt: string, maxTokens?: number): string;
}

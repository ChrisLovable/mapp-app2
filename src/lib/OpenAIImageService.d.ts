export interface ImageGenerationOptions {
    prompt: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    referenceImage?: string;
    styleInfo?: string;
}
export interface ImageGenerationResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class OpenAIImageService {
    private apiKey;
    constructor();
    generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;
    enhancePromptWithStyle(basePrompt: string, styleInfo?: string): string;
    validateImageSize(size: string): boolean;
    private _base64ToBlob;
}
export declare const openAIImageService: OpenAIImageService;

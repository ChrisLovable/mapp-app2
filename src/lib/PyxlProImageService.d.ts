export interface PyxlProImageOptions {
    prompt: string;
    referenceImage?: string;
    styleInfo?: string;
    strength?: number;
    guidance_scale?: number;
}
export interface PyxlProImageResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class PyxlProImageService {
    private apiKey;
    constructor();
    generateImage(options: PyxlProImageOptions): Promise<PyxlProImageResponse>;
    private base64ToBlob;
}
export declare const pyxlProImageService: PyxlProImageService;

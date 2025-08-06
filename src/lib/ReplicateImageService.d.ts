export interface ReplicateImageOptions {
    prompt: string;
    referenceImage?: string;
    styleInfo?: string;
    strength?: number;
    guidance_scale?: number;
}
export interface ReplicateImageResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class ReplicateImageService {
    generateImage(options: ReplicateImageOptions): Promise<ReplicateImageResponse>;
}
export declare const replicateImageService: ReplicateImageService;

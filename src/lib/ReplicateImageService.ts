import { apiUsageTracker } from './ApiUsageTracker';

export interface ReplicateImageOptions {
  prompt: string;
  referenceImage?: string; // base64 image data
  styleInfo?: string; // Additional style information
  strength?: number; // How much to follow the reference image (0-1)
  guidance_scale?: number; // How closely to follow the prompt
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

export class ReplicateImageService {
  async generateImage(options: ReplicateImageOptions): Promise<ReplicateImageResponse> {
    const {
      prompt,
      referenceImage,
      styleInfo,
      strength = 0.7,
      guidance_scale = 7.5
    } = options;

    if (!prompt.trim() && !referenceImage) {
      return {
        success: false,
        error: 'Either a prompt or reference image is required for image generation.'
      };
    }

    try {
      console.log('=== REPLICATE IMAGE GENERATION DEBUG ===');
      console.log('Prompt:', prompt);
      console.log('Style Info:', styleInfo);
      console.log('Reference Image Present:', !!referenceImage);
      console.log('Strength:', strength);
      console.log('Guidance Scale:', guidance_scale);
      console.log('====================================');

      let finalPrompt = prompt.trim();
      if (styleInfo) {
        finalPrompt = finalPrompt ? `${finalPrompt}, ${styleInfo} style` : `Create an image in ${styleInfo} style`;
      }
      if (!finalPrompt) {
        finalPrompt = 'Create a beautiful image';
      }

      const body: any = {
        prompt: finalPrompt,
        width: 1024,
        height: 1024,
        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text',
      };
      if (referenceImage) {
        body.reference_image = referenceImage;
        body.strength = strength;
        body.guidance_scale = guidance_scale;
      } else {
        body.guidance_scale = guidance_scale;
      }

      console.log('=== REQUEST BODY ===');
      console.log(JSON.stringify(body, null, 2));
      console.log('====================');

      const response = await fetch('/api/replicate/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Replicate API error:', response.status, response.statusText, errorText);
        apiUsageTracker.trackOpenAIUsage(
          '/api/replicate/predictions',
          'replicate',
          0,
          0,
          referenceImage ? 'Image Transformation' : 'Image Generation',
          false,
          errorText
        );
        return {
          success: false,
          error: `Replicate API error: ${errorText}`
        };
      }

      const prediction = await response.json();
      console.log('=== API RESPONSE ===');
      console.log(JSON.stringify(prediction, null, 2));
      console.log('====================');

      // Poll for result if needed
      let result = prediction;
      let attempts = 0;
      while (result && result.status && result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const poll = await fetch(`/api/replicate/predictions/${result.id}`);
        result = await poll.json();
        attempts++;
        console.log(`Polling attempt ${attempts}: status = ${result.status}`);
        if (result.status === 'failed') {
          break;
        }
      }

      if (!result || result.status !== 'succeeded' || !result.output || !result.output[0]) {
        return {
          success: false,
          error: 'No image URL received from Replicate'
        };
      }

      const imageUrl = result.output[0];
      apiUsageTracker.trackOpenAIUsage(
        '/api/replicate/predictions',
        'replicate',
        0,
        0,
        referenceImage ? 'Image Transformation' : 'Image Generation',
        true
      );
      return {
        success: true,
        imageUrl,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('Replicate image generation error:', error);
      apiUsageTracker.trackOpenAIUsage(
        '/api/replicate/predictions',
        'replicate',
        0,
        0,
        'Image Generation',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const replicateImageService = new ReplicateImageService(); 
// OpenAIImageService.ts - Service for OpenAI DALL-E image generation
import { apiUsageTracker } from './ApiUsageTracker';

export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  referenceImage?: string; // base64 image data
  styleInfo?: string; // Additional style information
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

export class OpenAIImageService {
  private apiKey: string;

  constructor() {
    // Client no longer needs an API key; we use backend proxy
    this.apiKey = '';
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid', referenceImage, styleInfo } = options;

    // API key is managed on the server; ensure backend is running

    if (!prompt.trim() && !referenceImage) {
      return {
        success: false,
        error: 'Either a prompt or reference image is required for image generation.'
      };
    }

    try {
      console.log('=== OPENAI IMAGE GENERATION DEBUG ===');
      console.log('Prompt:', prompt);
      console.log('Style Info:', styleInfo);
      console.log('Reference Image Present:', !!referenceImage);
      console.log('Size:', size);
      console.log('Quality:', quality);
      console.log('Style:', style);
      console.log('=====================================');
      
      if (referenceImage) {
        console.log('Reference image provided for transformation');
        console.log('Reference image data length:', referenceImage.length);
      }

      let finalPrompt = prompt.trim();
      
      // Add reference image context to the prompt
      if (referenceImage && finalPrompt) {
        finalPrompt = `Based on the reference image style and composition: ${finalPrompt}`;
      } else if (referenceImage && !finalPrompt) {
        finalPrompt = 'Create an image inspired by the reference image style and composition';
      }
      
      if (styleInfo) {
        finalPrompt = `${finalPrompt}, ${styleInfo} style`;
      }

      const requestBody = {
        prompt: finalPrompt,
        size: size,
        quality: quality,
        style: style
      };
      
      console.log('=== REQUEST BODY ===');
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('====================');

      const response = await fetch('/api/openai/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('=== API RESPONSE STATUS ===');
      console.log('Response Status:', response.status);
      console.log('Response Status Text:', response.statusText);
      console.log('===========================');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error('OpenAI API error:', errorMessage);
        console.log('Error Data:', JSON.stringify(errorData, null, 2));
        
        // Track failed API usage
        const operationType = referenceImage ? 'Image Transformation' : 'Image Generation';
        apiUsageTracker.trackOpenAIUsage(
          '/api/openai/images/generations',
          'dall-e-3',
          0,
          0,
          operationType,
          false,
          errorMessage
        );

        return {
          success: false,
          error: `OpenAI API error: ${errorMessage}`
        };
      }

      const data = await response.json();
      
      console.log('=== API RESPONSE DATA ===');
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('========================');
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        console.error('No image URL in response data');
        return {
          success: false,
          error: 'No image URL received from OpenAI'
        };
      }

      const imageUrl = data.data[0].url;
      const usage = data.usage;

      const operationType = referenceImage ? 'Image Transformation' : 'Image Generation';
      console.log(`OpenAI ${operationType.toLowerCase()} successful:`, imageUrl);
      console.log('Generated Image URL:', imageUrl);

      // Track successful API usage
        apiUsageTracker.trackOpenAIUsage(
          '/api/openai/images/generations',
          'dall-e-3',
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0,
        operationType,
        true
      );

      return {
        success: true,
        imageUrl,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('OpenAI image generation error:', error);
      
      // Track failed API usage
      apiUsageTracker.trackOpenAIUsage(
        '/api/openai/images/generations',
        'dall-e-3',
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

  // Helper method to enhance prompt with style information
  enhancePromptWithStyle(basePrompt: string, styleInfo?: string): string {
    if (!styleInfo) {
      return basePrompt;
    }

    return `${basePrompt}, ${styleInfo}`;
  }

  // Helper method to validate image size
  validateImageSize(size: string): boolean {
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    return validSizes.includes(size);
  }

  // Helper method to convert base64 to blob
  private async _base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

// Export a singleton instance
export const openAIImageService = new OpenAIImageService(); 
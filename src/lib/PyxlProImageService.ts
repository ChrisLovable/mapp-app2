// PyxlProImageService.ts - Service for PyxlPro image generation with reference image support
import { apiUsageTracker } from './ApiUsageTracker';

export interface PyxlProImageOptions {
  prompt: string;
  referenceImage?: string; // base64 image data
  styleInfo?: string; // Additional style information
  strength?: number; // How much to follow the reference image (0-1)
  guidance_scale?: number; // How closely to follow the prompt
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

export class PyxlProImageService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_PYXLPRO_API_KEY;
    if (!this.apiKey) {
      console.warn('PyxlPro API key not found. Please set VITE_PYXLPRO_API_KEY in your .env file.');
    }
  }

  async generateImage(options: PyxlProImageOptions): Promise<PyxlProImageResponse> {
    const { 
      prompt, 
      referenceImage, 
      styleInfo, 
      strength = 0.7, 
      guidance_scale = 7.5 
    } = options;

    if (!this.apiKey) {
      return {
        success: false,
        error: 'PyxlPro API key not found. Please check your .env file.'
      };
    }

    if (!prompt.trim() && !referenceImage) {
      return {
        success: false,
        error: 'Either a prompt or reference image is required for image generation.'
      };
    }

    try {
      console.log('=== PYXLPRO IMAGE GENERATION DEBUG ===');
      console.log('Prompt:', prompt);
      console.log('Style Info:', styleInfo);
      console.log('Reference Image Present:', !!referenceImage);
      console.log('Strength:', strength);
      console.log('Guidance Scale:', guidance_scale);
      console.log('=====================================');
      
      if (referenceImage) {
        console.log('Reference image provided for transformation');
        console.log('Reference image data length:', referenceImage.length);
      }

      let finalPrompt = prompt.trim();
      
      // Enhance prompt with style information
      if (styleInfo) {
        finalPrompt = finalPrompt ? `${finalPrompt}, ${styleInfo} style` : `Create an image in ${styleInfo} style`;
      }

      if (!finalPrompt) {
        finalPrompt = 'Create a beautiful image';
      }

      let requestBody: any;
      let endpoint: string;

      if (referenceImage) {
        // Use PyxlPro image-to-image transformation
        endpoint = 'https://api.pyxlpro.com/v1/image-to-image';
        
        // Convert base64 to blob for the API
        const base64Data = referenceImage.split(',')[1] || referenceImage;
        const imageBlob = await this.base64ToBlob(base64Data, 'image/png');
        
        // Create FormData for image upload
        const formData = new FormData();
        formData.append('image', imageBlob, 'reference.png');
        formData.append('prompt', finalPrompt);
        formData.append('strength', strength.toString());
        formData.append('guidance_scale', guidance_scale.toString());
        formData.append('num_inference_steps', '20');
        formData.append('scheduler', 'DDIMScheduler');

        console.log('=== REQUEST BODY (image-to-image) ===');
        console.log('FormData entries:');
        for (const [key, value] of formData.entries()) {
          if (key === 'image') {
            console.log('image: [Blob data]');
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        console.log('=====================================');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: formData
        });

        console.log('=== API RESPONSE STATUS ===');
        console.log('Response Status:', response.status);
        console.log('Response Status Text:', response.statusText);
        console.log('===========================');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          console.error('PyxlPro API error:', errorMessage);
          console.log('Error Data:', JSON.stringify(errorData, null, 2));
          
          // Track failed API usage
          apiUsageTracker.trackOpenAIUsage(
            endpoint,
            'pyxlpro',
            0,
            0,
            'Image Transformation',
            false,
            errorMessage
          );

          return {
            success: false,
            error: `PyxlPro API error: ${errorMessage}`
          };
        }

        const data = await response.json();
        
        console.log('=== API RESPONSE DATA ===');
        console.log('Response Data:', JSON.stringify(data, null, 2));
        console.log('========================');
        
        if (!data.output || !data.output[0]) {
          console.error('No image URL in response data');
          return {
            success: false,
            error: 'No image URL received from PyxlPro'
          };
        }

        const imageUrl = data.output[0];
        const usage = data.usage;

        console.log('PyxlPro image transformation successful:', imageUrl);
        console.log('Generated Image URL:', imageUrl);

        // Track successful API usage
        apiUsageTracker.trackOpenAIUsage(
          endpoint,
          'pyxlpro',
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
          'Image Transformation',
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

      } else {
        // Use PyxlPro text-to-image generation
        endpoint = 'https://api.pyxlpro.com/v1/text-to-image';
        
        requestBody = {
          prompt: finalPrompt,
          negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text',
          num_inference_steps: 20,
          guidance_scale: guidance_scale,
          width: 1024,
          height: 1024,
          scheduler: 'DDIMScheduler'
        };
        
        console.log('=== REQUEST BODY (text-to-image) ===');
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('=====================================');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
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
          
          console.error('PyxlPro API error:', errorMessage);
          console.log('Error Data:', JSON.stringify(errorData, null, 2));
          
          // Track failed API usage
          apiUsageTracker.trackOpenAIUsage(
            endpoint,
            'pyxlpro',
            0,
            0,
            'Image Generation',
            false,
            errorMessage
          );

          return {
            success: false,
            error: `PyxlPro API error: ${errorMessage}`
          };
        }

        const data = await response.json();
        
        console.log('=== API RESPONSE DATA ===');
        console.log('Response Data:', JSON.stringify(data, null, 2));
        console.log('========================');
        
        if (!data.output || !data.output[0]) {
          console.error('No image URL in response data');
          return {
            success: false,
            error: 'No image URL received from PyxlPro'
          };
        }

        const imageUrl = data.output[0];
        const usage = data.usage;

        console.log('PyxlPro image generation successful:', imageUrl);
        console.log('Generated Image URL:', imageUrl);

        // Track successful API usage
        apiUsageTracker.trackOpenAIUsage(
          endpoint,
          'pyxlpro',
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
          'Image Generation',
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
      }

    } catch (error) {
      console.error('PyxlPro image generation error:', error);
      
      // Track failed API usage
      apiUsageTracker.trackOpenAIUsage(
        'https://api.pyxlpro.com/v1/image-to-image',
        'pyxlpro',
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

  // Helper method to convert base64 to blob
  private async base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
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
export const pyxlProImageService = new PyxlProImageService(); 
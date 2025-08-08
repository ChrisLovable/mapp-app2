// Token Tracker Service
// Handles logging API usage to the admin dashboard

export class TokenTracker {
  private apiBaseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.apiBaseUrl = (import.meta as any).env?.VITE_TOKEN_API_URL || '/api';
    this.isEnabled = true; // Set to false to disable tracking
  }

  async logUsage(data: {
    apiName: string;
    endpoint: string;
    sourceModal: string;
    tokensUsed: number;
    requestData?: any;
    responseStatus: string;
    responseTimeMs: number;
    status: 'success' | 'failed' | 'error';
    errorMessage?: string;
  }) {
    if (!this.isEnabled) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/log-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.warn('Failed to log API usage:', await response.text());
      }
    } catch (error) {
      console.warn('Error logging API usage:', error);
    }
  }

  async logSuccess(data: {
    apiName: string;
    endpoint: string;
    sourceModal: string;
    tokensUsed: number;
    requestData?: any;
    responseTimeMs: number;
  }) {
    await this.logUsage({
      ...data,
      responseStatus: '200',
      status: 'success'
    });
  }

  async logFailure(data: {
    apiName: string;
    endpoint: string;
    sourceModal: string;
    tokensUsed: number;
    requestData?: any;
    responseStatus: string;
    responseTimeMs: number;
    errorMessage: string;
  }) {
    await this.logUsage({
      ...data,
      status: 'failed'
    });
  }

  async trackApiCall<T>(
    apiName: string,
    endpoint: string,
    sourceModal: string,
    tokensUsed: number,
    apiCall: () => Promise<T>,
    requestData?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const responseTimeMs = Date.now() - startTime;
      
      await this.logSuccess({
        apiName,
        endpoint,
        sourceModal,
        tokensUsed,
        requestData,
        responseTimeMs
      });
      
      return result;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      await this.logFailure({
        apiName,
        endpoint,
        sourceModal,
        tokensUsed,
        requestData,
        responseStatus: error instanceof Error ? '500' : '400',
        responseTimeMs,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}

// Create singleton instance
export const tokenTracker = new TokenTracker();

// Convenience functions for common API calls
export const trackImageGeneration = (prompt: string, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'image_generation',
    '/api/replicate/predictions',
    sourceModal,
    10, // Estimated tokens for image generation
    async () => {
      // Your image generation API call here
      const response = await fetch('/api/replicate/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      return response.json();
    },
    { prompt }
  );
};

export const trackTextGeneration = (prompt: string, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'text_generation',
    '/api/openai/chat',
    sourceModal,
    5, // Estimated tokens for text generation
    async () => {
      // Your text generation API call here
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      return response.json();
    },
    { prompt }
  );
};

export const trackTextToSpeech = (text: string, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'text_to_speech',
    '/api/azure/tts',
    sourceModal,
    2, // Estimated tokens for TTS
    async () => {
      // Your TTS API call here
      const response = await fetch('/api/azure/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return response.json();
    },
    { text }
  );
};

export const trackSpeechToText = (audioData: any, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'speech_to_text',
    '/api/speech/recognize',
    sourceModal,
    1, // Estimated tokens for STT
    async () => {
      // Your STT API call here
      const response = await fetch('/api/speech/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData })
      });
      return response.json();
    },
    { audioData }
  );
};

export const trackTranslation = (text: string, targetLanguage: string, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'translation',
    '/api/translate',
    sourceModal,
    3, // Estimated tokens for translation
    async () => {
      // Your translation API call here
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage })
      });
      return response.json();
    },
    { text, targetLanguage }
  );
};

export const trackPdfProcessing = (pdfData: any, sourceModal: string) => {
  return tokenTracker.trackApiCall(
    'pdf_processing',
    '/api/pdf/analyze',
    sourceModal,
    8, // Estimated tokens for PDF processing
    async () => {
      // Your PDF processing API call here
      const response = await fetch('/api/pdf/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfData })
      });
      return response.json();
    },
    { pdfData }
  );
}; 
// TTS Utility Module - Implements lazy loading and best practices
import { apiUsageTracker } from '../lib/ApiUsageTracker';
class TTSService {
    static instance;
    serverAvailable = null;
    serverCheckPromise = null;
    constructor() { }
    static getInstance() {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }
    // Check server availability with caching
    async checkServerAvailability() {
        if (this.serverAvailable !== null) {
            return this.serverAvailable;
        }
        if (this.serverCheckPromise) {
            return this.serverCheckPromise;
        }
        this.serverCheckPromise = this.performServerCheck();
        this.serverAvailable = await this.serverCheckPromise;
        return this.serverAvailable;
    }
    async performServerCheck() {
        try {
            const response = await fetch('http://localhost:4000/api/azure-voices', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        }
        catch (error) {
            console.warn('TTS server not available:', error);
            return false;
        }
    }
    // Lazy fetch TTS audio only when explicitly requested
    async generateSpeech(options) {
        const { text, language, voice } = options;
        if (!text?.trim()) {
            return { success: false, error: 'No text provided' };
        }
        // Check server availability first
        const serverAvailable = await this.checkServerAvailability();
        if (!serverAvailable) {
            return {
                success: false,
                error: 'Voice server is not available. Please ensure the Azure TTS proxy is running on port 4000. You can start it by running: node azure-tts-proxy.js'
            };
        }
        try {
            const response = await fetch('http://localhost:4000/api/azure-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text.trim(),
                    language,
                    voice
                }),
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            // Track successful Azure TTS usage
            apiUsageTracker.trackAzureUsage('http://localhost:4000/api/azure-tts', text.trim().length, 'Text-to-Speech Generation', true);
            return { success: true, audioUrl };
        }
        catch (error) {
            console.error('TTS Error:', error);
            let errorMessage = 'Failed to generate speech';
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out. Please try again.';
                }
                else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                    this.serverAvailable = false; // Update server status
                    errorMessage = 'Voice server is down. Please ensure the Azure TTS proxy is running on port 4000. You can start it by running: node azure-tts-proxy.js';
                }
                else if (error.message.includes('No voice found')) {
                    errorMessage = 'Voice not available for this language. Please try a different language.';
                }
                else {
                    errorMessage = `Failed to generate speech: ${error.message}`;
                }
            }
            // Track failed Azure TTS usage
            apiUsageTracker.trackAzureUsage('http://localhost:4000/api/azure-tts', text.trim().length, 'Text-to-Speech Generation', false, errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    // Play audio with proper cleanup
    async playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (error) => {
                console.error('Audio playback error:', error);
                URL.revokeObjectURL(audioUrl);
                reject(new Error('Failed to play audio'));
            };
            audio.play().catch(reject);
        });
    }
    // Reset server status (useful for testing)
    resetServerStatus() {
        this.serverAvailable = null;
        this.serverCheckPromise = null;
    }
}
// Export singleton instance
export const ttsService = TTSService.getInstance();
// Convenience functions
export const generateAndPlaySpeech = async (options) => {
    const result = await ttsService.generateSpeech(options);
    if (result.success && result.audioUrl) {
        try {
            await ttsService.playAudio(result.audioUrl);
        }
        catch (error) {
            return { success: false, error: 'Failed to play audio' };
        }
    }
    return result;
};
export const checkTTSServer = () => ttsService.checkServerAvailability();

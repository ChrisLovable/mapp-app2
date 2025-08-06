// AI Processing Logic for Ask Me functionality
import { apiUsageTracker } from './ApiUsageTracker';
// Real-time question detection keywords and phrases
const REALTIME_TRIGGERS = [
    // Time-sensitive words
    'today', 'yesterday', 'tomorrow', 'now', 'currently', 'latest', 'recent', 'breaking',
    'this morning', 'this afternoon', 'this evening', 'tonight', 'right now',
    // Current events
    'news', 'current', 'happening', 'live', 'breaking news', 'updates',
    // Stock/Finance
    'stock price', 'market', 'trading', 'shares', 'cryptocurrency', 'bitcoin', 'stocks',
    // Weather
    'weather', 'temperature', 'forecast', 'raining', 'sunny', 'cloudy',
    // Sports scores
    'score', 'game', 'match', 'tournament', 'championship', 'league',
    // Technology
    'server status', 'website down', 'outage', 'system status',
    // Time-based phrases
    'what time', 'when is', 'how long until', 'countdown',
    // Real-time data
    'live data', 'real time', 'up to date', 'current status', 'right now'
];
export class AskMeLogic {
    static API_URL = 'https://api.openai.com/v1/chat/completions';
    /**
     * Detects if a question requires real-time or up-to-date information
     */
    static detectRealtimeQuestion(question) {
        const lowerQuestion = question.toLowerCase();
        const matchedTriggers = [];
        // Check for trigger words/phrases
        REALTIME_TRIGGERS.forEach(trigger => {
            if (lowerQuestion.includes(trigger.toLowerCase())) {
                matchedTriggers.push(trigger);
            }
        });
        // Calculate confidence based on number of matches and question length
        const confidence = Math.min(matchedTriggers.length / 3, 1);
        const isRealtime = matchedTriggers.length > 0;
        console.log('🔍 Real-time detection:', {
            question: question,
            isRealtime,
            confidence,
            matchedTriggers
        });
        return {
            isRealtime,
            confidence,
            matchedTriggers
        };
    }
    static async sendQuestionToAI(question, imageFile) {
        try {
            // Check if OpenAI API key is configured
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey || apiKey === 'your_openai_api_key_here') {
                return {
                    success: false,
                    error: 'OpenAI API key not configured. Please create a .env file with VITE_OPENAI_API_KEY=your_actual_api_key and restart the server.'
                };
            }
            console.log('🤖 Sending question to OpenAI:', question);
            // Convert image to base64 if provided
            let base64Image = null;
            if (imageFile) {
                base64Image = await this.fileToBase64(imageFile);
                console.log('📷 Image attached to question');
            }
            // Prepare message content
            const userMessage = {
                role: 'user',
                content: []
            };
            // Add text content
            userMessage.content.push({
                type: 'text',
                text: question
            });
            // Add image content if available
            if (base64Image) {
                userMessage.content.push({
                    type: 'image_url',
                    image_url: {
                        url: base64Image,
                        detail: 'auto'
                    }
                });
            }
            // If no image, use simple string format for backwards compatibility
            if (!imageFile) {
                userMessage.content = question;
            }
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: imageFile ? 'gpt-4o' : 'gpt-4o-mini', // Use vision model if image provided
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses to user questions. Be friendly and informative. If an image is provided, analyze it carefully and include relevant details in your response.'
                        },
                        userMessage
                    ],
                    max_tokens: imageFile ? 800 : 500, // More tokens for image analysis
                    temperature: 0.7
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            console.log('✅ OpenAI response received:', data);
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('No response received from OpenAI');
            }
            const aiResponse = data.choices[0].message.content;
            const tokensUsed = data.usage?.total_tokens || 0;
            // Cost will be calculated by ApiUsageTracker using proper Rand pricing
            // Track successful API usage
            console.log('🔍 [ASK ME LOGIC] Starting API usage tracking...');
            console.log('🔍 [ASK ME LOGIC] Total tokens used:', tokensUsed);
            // Split tokens roughly 50/50 between input and output for tracking
            const inputTokens = Math.floor(tokensUsed * 0.4); // Assume 40% input
            const outputTokens = tokensUsed - inputTokens; // Remaining as output
            console.log('🔍 [ASK ME LOGIC] Token split:', { inputTokens, outputTokens });
            console.log('🔍 [ASK ME LOGIC] Calling apiUsageTracker.trackOpenAIUsage...');
            apiUsageTracker.trackOpenAIUsage(this.API_URL, 'gpt-4o-mini', inputTokens, outputTokens, 'Ask Me Question', true);
            console.log('✅ [ASK ME LOGIC] API Usage tracking called successfully');
            console.log('📊 [ASK ME LOGIC] Usage details:', {
                endpoint: this.API_URL,
                model: 'gpt-4o-mini',
                tokens: tokensUsed,
                inputTokens,
                outputTokens,
                operation: 'Ask Me Question'
            });
            return {
                success: true,
                response: aiResponse,
                tokensUsed
            };
        }
        catch (error) {
            console.error('❌ Error sending question to AI:', error);
            // Track failed API usage
            apiUsageTracker.trackOpenAIUsage(this.API_URL, 'gpt-4o-mini', 0, // No input tokens used on failure
            0, // No output tokens used on failure
            'Ask Me Question', false, error instanceof Error ? error.message : 'Unknown error occurred');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    static formatResponse(response) {
        // Basic formatting for better display
        return response
            .replace(/\n\n/g, '\n\n') // Preserve paragraph breaks
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .trim();
    }
    /**
     * Converts a File object to base64 data URL for OpenAI Vision API
     */
    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                }
                else {
                    reject(new Error('Failed to convert file to base64'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}

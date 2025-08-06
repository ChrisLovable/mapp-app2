export class OpenAIService {
    apiKey;
    defaultModel;
    defaultMaxTokens;
    defaultTemperature;
    constructor() {
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        this.defaultModel = 'gpt-4o-mini';
        this.defaultMaxTokens = 1000;
        this.defaultTemperature = 0.7;
    }
    async getResponse(prompt, config) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not found. Please check your .env file.');
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: config?.model || this.defaultModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a personal finance assistant. Provide clear, concise, and accurate responses to user questions about their expense data. Be specific with amounts, dates, and details.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: config?.maxTokens || this.defaultMaxTokens,
                    temperature: config?.temperature || this.defaultTemperature
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
            }
            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content?.trim();
            if (!aiResponse) {
                throw new Error('No response received from OpenAI');
            }
            return {
                content: aiResponse,
                tokens: data.usage?.total_tokens || 0,
                model: data.model || this.defaultModel
            };
        }
        catch (error) {
            console.error('Error in OpenAIService.getResponse:', error);
            throw error;
        }
    }
    async getResponseWithRetry(prompt, config, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.getResponse(prompt, config);
            }
            catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }
    // Helper method for expense-specific prompts
    async analyzeExpenseData(prompt, expenseData) {
        const enhancedPrompt = `You are analyzing personal expense data. Please provide insights based on the following data:

${prompt}

Expense Data Summary:
${JSON.stringify(expenseData, null, 2)}

Please provide a clear, helpful response based on this data.`;
        return this.getResponse(enhancedPrompt, {
            maxTokens: 1500,
            temperature: 0.3 // More focused for data analysis
        });
    }
    // Helper method for quick questions
    async answerQuickQuestion(question, contextData) {
        const prompt = `Question: "${question}"

Context Data:
${JSON.stringify(contextData, null, 2)}

Please provide a specific, helpful answer based on this data. Be precise with amounts, dates, and details.`;
        return this.getResponse(prompt, {
            maxTokens: 1000,
            temperature: 0.5
        });
    }
    // Helper method for trend analysis
    async analyzeTrends(trendData) {
        const prompt = `Analyze the following spending trends and provide insights:

Trend Data:
${JSON.stringify(trendData, null, 2)}

Please provide insights about spending patterns, trends, and recommendations.`;
        return this.getResponse(prompt, {
            maxTokens: 1200,
            temperature: 0.4
        });
    }
    // Helper method for expense insights
    async generateInsights(insightData) {
        const prompt = `Based on the following expense data, provide personalized insights and recommendations:

Insight Data:
${JSON.stringify(insightData, null, 2)}

Please provide actionable insights and recommendations for better financial management.`;
        return this.getResponse(prompt, {
            maxTokens: 1500,
            temperature: 0.6
        });
    }
    // Token estimation (rough calculation)
    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
    // Check if prompt is within token limits
    isWithinTokenLimit(prompt, maxTokens = 4000) {
        const estimatedTokens = this.estimateTokens(prompt);
        return estimatedTokens <= maxTokens;
    }
    // Truncate prompt if it exceeds token limits
    truncatePrompt(prompt, maxTokens = 4000) {
        if (this.isWithinTokenLimit(prompt, maxTokens)) {
            return prompt;
        }
        // Simple truncation - in production, you'd want more sophisticated tokenization
        const maxChars = maxTokens * 4;
        return prompt.length > maxChars ? prompt.substring(0, maxChars) + '...' : prompt;
    }
}

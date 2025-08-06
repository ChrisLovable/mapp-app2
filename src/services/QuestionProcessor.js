import { ExpenseAnalytics } from './ExpenseAnalytics';
import { OpenAIService } from './OpenAIService';
export class QuestionProcessor {
    analytics;
    openAI;
    constructor(analytics, openAI) {
        this.analytics = analytics;
        this.openAI = openAI;
    }
    async processQuestion(context) {
        const startTime = Date.now();
        try {
            // 1. Classify question type
            const questionType = this.classifyQuestion(context.question);
            // 2. Get relevant data efficiently
            const relevantData = await this.getRelevantData(context.userId, questionType, context.filters);
            // 3. Build optimized prompt
            const prompt = this.buildPrompt(context.question, relevantData, questionType);
            // 4. Check token limits and truncate if necessary
            const optimizedPrompt = this.openAI.truncatePrompt(prompt);
            // 5. Generate AI response
            const aiResponse = await this.openAI.getResponseWithRetry(optimizedPrompt, {
                maxTokens: this.getMaxTokensForQuestionType(questionType),
                temperature: this.getTemperatureForQuestionType(questionType)
            });
            const processingTime = Date.now() - startTime;
            return {
                question: context.question,
                questionType,
                response: aiResponse.content,
                dataUsed: relevantData,
                tokensUsed: aiResponse.tokens,
                processingTime
            };
        }
        catch (error) {
            console.error('Error processing question:', error);
            throw error;
        }
    }
    classifyQuestion(question) {
        const lowerQuestion = question.toLowerCase();
        // Vendor-related questions
        if (lowerQuestion.includes('vendor') ||
            lowerQuestion.includes('store') ||
            lowerQuestion.includes('shop') ||
            lowerQuestion.includes('where') ||
            lowerQuestion.includes('merchant')) {
            return 'vendor';
        }
        // Category-related questions
        if (lowerQuestion.includes('category') ||
            lowerQuestion.includes('type') ||
            lowerQuestion.includes('spending on') ||
            lowerQuestion.includes('expenses in') ||
            lowerQuestion.includes('what category')) {
            return 'category';
        }
        // Trend-related questions
        if (lowerQuestion.includes('trend') ||
            lowerQuestion.includes('over time') ||
            lowerQuestion.includes('monthly') ||
            lowerQuestion.includes('growth') ||
            lowerQuestion.includes('increase') ||
            lowerQuestion.includes('decrease') ||
            lowerQuestion.includes('pattern')) {
            return 'trends';
        }
        // Comparison questions
        if (lowerQuestion.includes('compare') ||
            lowerQuestion.includes('vs') ||
            lowerQuestion.includes('versus') ||
            lowerQuestion.includes('difference') ||
            lowerQuestion.includes('higher') ||
            lowerQuestion.includes('lower')) {
            return 'comparison';
        }
        // Forecast/prediction questions
        if (lowerQuestion.includes('predict') ||
            lowerQuestion.includes('forecast') ||
            lowerQuestion.includes('next month') ||
            lowerQuestion.includes('future') ||
            lowerQuestion.includes('estimate')) {
            return 'forecast';
        }
        // Insights questions
        if (lowerQuestion.includes('insight') ||
            lowerQuestion.includes('recommend') ||
            lowerQuestion.includes('suggestion') ||
            lowerQuestion.includes('advice') ||
            lowerQuestion.includes('improve') ||
            lowerQuestion.includes('save money')) {
            return 'insights';
        }
        // Summary questions
        if (lowerQuestion.includes('total') ||
            lowerQuestion.includes('sum') ||
            lowerQuestion.includes('overall') ||
            lowerQuestion.includes('all time') ||
            lowerQuestion.includes('summary')) {
            return 'summary';
        }
        // Default to general
        return 'general';
    }
    async getRelevantData(userId, questionType, filters) {
        try {
            switch (questionType) {
                case 'vendor':
                    return await this.analytics.getVendorAnalysis(userId, filters);
                case 'category':
                    return await this.analytics.getCategoryAnalysis(userId, filters);
                case 'trends':
                    return await this.analytics.getTrendAnalysis(userId, filters);
                case 'insights':
                    const fullAnalysis = await this.analytics.analyzeExpenses(userId, filters);
                    return {
                        insights: fullAnalysis.insights,
                        summary: fullAnalysis.summary,
                        categories: fullAnalysis.categories,
                        vendors: fullAnalysis.vendors
                    };
                case 'summary':
                    return await this.analytics.getSummaryAnalysis(userId, filters);
                case 'comparison':
                    // For comparisons, we need multiple data points
                    const comparisonData = await this.analytics.analyzeExpenses(userId, filters);
                    return {
                        categories: comparisonData.categories,
                        vendors: comparisonData.vendors,
                        trends: comparisonData.trends,
                        summary: comparisonData.summary
                    };
                case 'forecast':
                    // For forecasting, we need trend data
                    return await this.analytics.getTrendAnalysis(userId, filters);
                case 'general':
                default:
                    // For general questions, get comprehensive data
                    return await this.analytics.analyzeExpenses(userId, filters);
            }
        }
        catch (error) {
            console.error(`Error getting relevant data for question type ${questionType}:`, error);
            throw error;
        }
    }
    buildPrompt(question, data, questionType) {
        const basePrompt = `Question: "${question}"

Available Data:
${JSON.stringify(data, null, 2)}

Please provide a specific, helpful answer based on this data. Be precise with amounts, dates, and details.`;
        switch (questionType) {
            case 'vendor':
                return `You are analyzing vendor spending patterns. ${basePrompt}
Focus on vendor-specific insights, spending patterns, and recommendations.`;
            case 'category':
                return `You are analyzing spending by category. ${basePrompt}
Focus on category breakdowns, spending patterns, and category-specific insights.`;
            case 'trends':
                return `You are analyzing spending trends over time. ${basePrompt}
Focus on trends, patterns, growth rates, and seasonal variations.`;
            case 'insights':
                return `You are providing financial insights and recommendations. ${basePrompt}
Focus on actionable insights, savings opportunities, and financial advice.`;
            case 'comparison':
                return `You are comparing different aspects of spending. ${basePrompt}
Focus on comparisons, differences, and relative performance.`;
            case 'forecast':
                return `You are making spending predictions and forecasts. ${basePrompt}
Focus on trends, predictions, and future spending estimates.`;
            case 'summary':
                return `You are providing a spending summary. ${basePrompt}
Focus on totals, averages, and key summary statistics.`;
            default:
                return basePrompt;
        }
    }
    getMaxTokensForQuestionType(questionType) {
        switch (questionType) {
            case 'insights':
            case 'forecast':
                return 1500; // More detailed responses
            case 'comparison':
            case 'trends':
                return 1200; // Medium detailed responses
            case 'vendor':
            case 'category':
            case 'summary':
            case 'general':
            default:
                return 1000; // Standard responses
        }
    }
    getTemperatureForQuestionType(questionType) {
        switch (questionType) {
            case 'insights':
            case 'forecast':
                return 0.6; // More creative for insights and predictions
            case 'comparison':
            case 'trends':
                return 0.4; // Balanced for analysis
            case 'vendor':
            case 'category':
            case 'summary':
            case 'general':
            default:
                return 0.3; // More focused for factual responses
        }
    }
    // Helper method for quick questions (backward compatibility)
    async answerQuickQuestion(userId, question) {
        const result = await this.processQuestion({
            userId,
            question,
            dataLimit: 50 // Limit for quick questions
        });
        return result.response;
    }
    // Helper method for comprehensive analysis
    async getComprehensiveAnalysis(userId, filters) {
        const question = "Provide a comprehensive analysis of my spending patterns, including insights, trends, and recommendations.";
        return this.processQuestion({
            userId,
            question,
            filters
        });
    }
    // Helper method for specific data queries
    async querySpecificData(userId, question, dataType) {
        try {
            switch (dataType) {
                case 'vendors':
                    return await this.analytics.getVendorAnalysis(userId);
                case 'categories':
                    return await this.analytics.getCategoryAnalysis(userId);
                case 'trends':
                    return await this.analytics.getTrendAnalysis(userId);
                case 'summary':
                    return await this.analytics.getSummaryAnalysis(userId);
                default:
                    throw new Error(`Unknown data type: ${dataType}`);
            }
        }
        catch (error) {
            console.error(`Error querying ${dataType} data:`, error);
            throw error;
        }
    }
}

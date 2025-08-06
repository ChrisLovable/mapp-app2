import { ExpenseAnalytics } from './ExpenseAnalytics';
import type { AnalysisFilters } from './ExpenseAnalytics';
import { OpenAIService } from './OpenAIService';
export interface QuestionContext {
    userId: string;
    question: string;
    filters?: AnalysisFilters;
    dataLimit?: number;
}
export interface ProcessedQuestion {
    question: string;
    questionType: string;
    response: string;
    dataUsed: any;
    tokensUsed: number;
    processingTime: number;
}
export type QuestionType = 'vendor' | 'category' | 'trends' | 'summary' | 'insights' | 'comparison' | 'forecast' | 'general';
export declare class QuestionProcessor {
    private analytics;
    private openAI;
    constructor(analytics: ExpenseAnalytics, openAI: OpenAIService);
    processQuestion(context: QuestionContext): Promise<ProcessedQuestion>;
    private classifyQuestion;
    private getRelevantData;
    private buildPrompt;
    private getMaxTokensForQuestionType;
    private getTemperatureForQuestionType;
    answerQuickQuestion(userId: string, question: string): Promise<string>;
    getComprehensiveAnalysis(userId: string, filters?: AnalysisFilters): Promise<ProcessedQuestion>;
    querySpecificData(userId: string, question: string, dataType: 'vendors' | 'categories' | 'trends' | 'summary'): Promise<any>;
}

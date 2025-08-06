import { SupabaseClient } from '@supabase/supabase-js';
type SupabaseClientType = SupabaseClient | any;
export interface Expense {
    id: string;
    expense_date: string;
    vendor: string;
    amount: number;
    quantity: number;
    description: string;
    category: string;
    user_id?: string;
    created_at?: string;
    receipt_image_id?: string;
}
export interface AnalysisFilters {
    startDate?: string;
    endDate?: string;
    category?: string;
    vendor?: string;
    minAmount?: number;
    maxAmount?: number;
}
export interface ExpenseSummary {
    totalExpenses: number;
    totalEntries: number;
    totalQuantity: number;
    averageAmount: number;
    dateRange: {
        earliest: string;
        latest: string;
    };
}
export interface CategoryAnalysis {
    topCategories: Array<{
        category: string;
        total: number;
        count: number;
        quantity: number;
        average: number;
    }>;
    categoryBreakdown: {
        [key: string]: number;
    };
}
export interface VendorAnalysis {
    topVendors: Array<{
        vendor: string;
        total: number;
        count: number;
        quantity: number;
        average: number;
    }>;
    vendorBreakdown: {
        [key: string]: number;
    };
}
export interface TrendAnalysis {
    monthlyTotals: {
        [key: string]: number;
    };
    monthlyAverages: {
        [key: string]: number;
    };
    growthRate: number;
    seasonalPatterns: Array<{
        month: string;
        average: number;
    }>;
}
export interface ExpenseInsights {
    topSpendingCategories: string[];
    mostFrequentVendors: string[];
    spendingTrends: string[];
    unusualExpenses: Array<{
        date: string;
        vendor: string;
        amount: number;
        reason: string;
    }>;
}
export declare class ExpenseAnalytics {
    private supabase;
    constructor(supabase: SupabaseClientType);
    analyzeExpenses(userId: string, filters?: AnalysisFilters): Promise<{
        summary: ExpenseSummary;
        categories: CategoryAnalysis;
        vendors: VendorAnalysis;
        trends: TrendAnalysis;
        insights: ExpenseInsights;
    }>;
    private processExpenseData;
    private calculateSummary;
    private analyzeCategories;
    private analyzeVendors;
    private calculateTrends;
    private generateInsights;
    getVendorAnalysis(userId: string, filters?: AnalysisFilters): Promise<VendorAnalysis>;
    getCategoryAnalysis(userId: string, filters?: AnalysisFilters): Promise<CategoryAnalysis>;
    getTrendAnalysis(userId: string, filters?: AnalysisFilters): Promise<TrendAnalysis>;
    getSummaryAnalysis(userId: string, filters?: AnalysisFilters): Promise<ExpenseSummary>;
    private getEmptySummary;
    private getEmptyCategoryAnalysis;
    private getEmptyVendorAnalysis;
    private getEmptyTrendAnalysis;
    private getEmptyInsights;
}
export {};

export interface ApiUsage {
    id: string;
    timestamp: number;
    api: 'openai' | 'azure' | 'supabase';
    endpoint: string;
    tokensUsed: number;
    costInRand: number;
    model?: string;
    operation: string;
    success: boolean;
    error?: string;
}
export interface LiveLogEntry {
    id: string;
    timestamp: number;
    api: 'openai' | 'azure' | 'supabase';
    operation: string;
    tokensUsed: number;
    model?: string;
    success: boolean;
    timeAgo: string;
}
export interface ApiCosts {
    openai: {
        'gpt-4': {
            input: number;
            output: number;
        };
        'gpt-4o': {
            input: number;
            output: number;
        };
        'gpt-4o-mini': {
            input: number;
            output: number;
        };
        'gpt-3.5-turbo': {
            input: number;
            output: number;
        };
    };
    azure: {
        tts: number;
    };
    supabase: {
        storage: number;
        database: number;
    };
}
export declare const API_COSTS: ApiCosts;
declare class ApiUsageTracker {
    private usage;
    private readonly STORAGE_KEY;
    private liveLogListeners;
    private dashboardBaseUrl;
    private dashboardEnabled;
    constructor();
    addLiveLogListener(listener: (entry: LiveLogEntry) => void): void;
    removeLiveLogListener(listener: (entry: LiveLogEntry) => void): void;
    getLiveLogEntries(limit?: number): LiveLogEntry[];
    private sendToSupabase;
    private sendToDashboard;
    private mapApiName;
    private getTimeAgo;
    trackOpenAIUsage(endpoint: string, model: string, inputTokens: number, outputTokens: number, operation: string, success?: boolean, error?: string): void;
    trackAzureUsage(endpoint: string, characters: number, operation: string, success?: boolean, error?: string): void;
    trackSupabaseUsage(endpoint: string, operation: string, dataSize?: number, // in bytes
    success?: boolean, error?: string): void;
    getUsageStats(timeRange?: 'day' | 'week' | 'month' | 'all'): {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        successRate: number;
        byApi: {
            openai: {
                requests: number;
                tokens: number;
                cost: number;
            };
            azure: {
                requests: number;
                tokens: number;
                cost: number;
            };
            supabase: {
                requests: number;
                tokens: number;
                cost: number;
            };
        };
        byModel: Record<string, {
            requests: 0;
            tokens: 0;
            cost: 0;
        }>;
        recentActivity: ApiUsage[];
    };
    getUsageHistory(limit?: number): ApiUsage[];
    clearOldData(): void;
    exportData(): {
        usage: ApiUsage[];
        stats: {
            totalRequests: number;
            totalTokens: number;
            totalCost: number;
            successRate: number;
            byApi: {
                openai: {
                    requests: number;
                    tokens: number;
                    cost: number;
                };
                azure: {
                    requests: number;
                    tokens: number;
                    cost: number;
                };
                supabase: {
                    requests: number;
                    tokens: number;
                    cost: number;
                };
            };
            byModel: Record<string, {
                requests: 0;
                tokens: 0;
                cost: 0;
            }>;
            recentActivity: ApiUsage[];
        };
        exportDate: string;
    };
    resetData(): void;
    enableDashboard(enabled?: boolean): void;
    setDashboardUrl(url: string): void;
    private addUsage;
    private generateId;
    private saveToStorage;
    private loadFromStorage;
    private notifyLiveLogListeners;
}
export declare const apiUsageTracker: ApiUsageTracker;
export {};

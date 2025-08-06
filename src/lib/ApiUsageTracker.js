// API Usage Tracker for monitoring token usage and costs
import { supabase } from './supabase';
// Current API costs in Rand (as of 2024)
export const API_COSTS = {
    openai: {
        'gpt-4': { input: 0.45, output: 1.35 }, // R0.45/R1.35 per 1K tokens
        'gpt-4o': { input: 0.15, output: 0.60 }, // R0.15/R0.60 per 1K tokens
        'gpt-4o-mini': { input: 0.003, output: 0.012 }, // R0.003/R0.012 per 1K tokens (converted from USD)
        'gpt-3.5-turbo': { input: 0.03, output: 0.06 } // R0.03/R0.06 per 1K tokens
    },
    azure: {
        tts: 0.16 // R0.16 per 1M characters
    },
    supabase: {
        storage: 0.023, // R0.023 per GB
        database: 0.0001 // R0.0001 per request
    }
};
class ApiUsageTracker {
    usage = [];
    STORAGE_KEY = 'api_usage_tracker';
    liveLogListeners = [];
    dashboardBaseUrl = 'http://localhost:3000/api';
    dashboardEnabled = true;
    constructor() {
        this.loadFromStorage();
    }
    // Add listener for live log updates
    addLiveLogListener(listener) {
        this.liveLogListeners.push(listener);
    }
    // Remove listener
    removeLiveLogListener(listener) {
        const index = this.liveLogListeners.indexOf(listener);
        if (index > -1) {
            this.liveLogListeners.splice(index, 1);
        }
    }
    // Get recent live log entries
    getLiveLogEntries(limit = 20) {
        const now = Date.now();
        return this.usage
            .slice(-limit)
            .reverse()
            .map(usage => ({
            id: usage.id,
            timestamp: usage.timestamp,
            api: usage.api,
            operation: usage.operation,
            tokensUsed: usage.tokensUsed,
            model: usage.model,
            success: usage.success,
            timeAgo: this.getTimeAgo(usage.timestamp, now)
        }));
    }
    // Send usage directly to Supabase (production-ready, no backend needed)
    async sendToSupabase(usage) {
        console.log('🔍 [API TRACKER] Starting sendToSupabase...');
        console.log('🔍 [API TRACKER] Dashboard enabled:', this.dashboardEnabled);
        if (!this.dashboardEnabled) {
            console.log('❌ [API TRACKER] Dashboard disabled, skipping Supabase');
            return;
        }
        try {
            // Convert to format expected by dashboard_api_usage table
            const supabaseEntry = {
                api: this.mapApiName(usage.api, usage.model),
                tokens: usage.tokensUsed,
                cost: usage.costInRand / 20, // Convert from Rand to USD
                status: usage.success ? 'success' : 'failed',
                response_time: 1000 + Math.floor(Math.random() * 2000), // Simulated response time
                time: new Date().toISOString()
            };
            console.log('🔍 [API TRACKER] Sending to Supabase:', {
                table: 'dashboard_api_usage',
                entry: supabaseEntry,
                originalUsage: usage
            });
            console.log('🔍 [API TRACKER] Attempting Supabase insert...');
            const { data, error } = await supabase
                .from('dashboard_api_usage')
                .insert([supabaseEntry])
                .select();
            if (error) {
                console.error('❌ [API TRACKER] Supabase insert failed:', error);
                console.log('🔄 [API TRACKER] Falling back to backend...');
                // Fallback to backend if Supabase fails
                await this.sendToDashboard(usage);
            }
            else {
                console.log('✅ [API TRACKER] Successfully inserted to Supabase:', data);
            }
        }
        catch (error) {
            console.error('❌ [API TRACKER] Supabase exception:', error);
            console.log('🔄 [API TRACKER] Falling back to backend...');
            // Fallback to backend
            await this.sendToDashboard(usage);
        }
    }
    // Send usage to dashboard backend (fallback method)
    async sendToDashboard(usage) {
        try {
            // Convert to format expected by dashboard
            const dashboardEntry = {
                api: this.mapApiName(usage.api, usage.model),
                tokens: usage.tokensUsed,
                cost: usage.costInRand / 20, // Convert from Rand to USD (dashboard expects USD)
                status: usage.success ? 'success' : 'failed',
                responseTime: 1000 + Math.floor(Math.random() * 2000), // Simulated response time
                endpoint: usage.endpoint
            };
            await fetch(`${this.dashboardBaseUrl}/log-usage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dashboardEntry),
            });
        }
        catch (error) {
            console.warn('Failed to send usage to dashboard backend:', error);
        }
    }
    // Map API names to dashboard format
    mapApiName(api, model) {
        switch (api) {
            case 'openai':
                return model?.includes('gpt') ? 'openai_gpt' : 'openai_other';
            case 'azure':
                return 'text_to_speech';
            case 'supabase':
                return 'database_query';
            default:
                return api;
        }
    }
    // Helper to format time ago
    getTimeAgo(timestamp, now) {
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (seconds < 60)
            return `${seconds}s ago`;
        if (minutes < 60)
            return `${minutes}m ago`;
        if (hours < 24)
            return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }
    // Track OpenAI API usage
    trackOpenAIUsage(endpoint, model, inputTokens, outputTokens, operation, success = true, error) {
        console.log('🔍 [API TRACKER] trackOpenAIUsage called with:', {
            endpoint,
            model,
            inputTokens,
            outputTokens,
            operation,
            success,
            error
        });
        const inputCost = (inputTokens / 1000) * API_COSTS.openai[model]?.input || 0;
        const outputCost = (outputTokens / 1000) * API_COSTS.openai[model]?.output || 0;
        const totalCost = inputCost + outputCost;
        const totalTokens = inputTokens + outputTokens;
        console.log('🔍 [API TRACKER] Cost calculation breakdown:', {
            inputTokens,
            outputTokens,
            totalTokens,
            inputCostPer1K: API_COSTS.openai[model]?.input,
            outputCostPer1K: API_COSTS.openai[model]?.output,
            inputCost: `${inputTokens}/1000 * ${API_COSTS.openai[model]?.input} = ${inputCost}`,
            outputCost: `${outputTokens}/1000 * ${API_COSTS.openai[model]?.output} = ${outputCost}`,
            totalCost,
            totalCostInRand: totalCost,
            totalCostInUSD: totalCost / 20,
            pricing: API_COSTS.openai[model]
        });
        const usageEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            api: 'openai',
            endpoint,
            tokensUsed: totalTokens,
            costInRand: totalCost,
            model,
            operation,
            success,
            error
        };
        console.log('🔍 [API TRACKER] Created usage entry:', usageEntry);
        console.log('🔍 [API TRACKER] Calling addUsage...');
        this.addUsage(usageEntry);
        console.log('✅ [API TRACKER] trackOpenAIUsage completed');
    }
    // Track Azure TTS usage
    trackAzureUsage(endpoint, characters, operation, success = true, error) {
        const cost = (characters / 1000000) * API_COSTS.azure.tts;
        this.addUsage({
            id: this.generateId(),
            timestamp: Date.now(),
            api: 'azure',
            endpoint,
            tokensUsed: characters, // Using characters as "tokens" for TTS
            costInRand: cost,
            operation,
            success,
            error
        });
    }
    // Track Supabase usage
    trackSupabaseUsage(endpoint, operation, dataSize, // in bytes
    success = true, error) {
        let cost = API_COSTS.supabase.database; // Base cost per request
        // Add storage cost if applicable
        if (dataSize && operation.includes('storage')) {
            const sizeInGB = dataSize / (1024 * 1024 * 1024);
            cost += sizeInGB * API_COSTS.supabase.storage;
        }
        this.addUsage({
            id: this.generateId(),
            timestamp: Date.now(),
            api: 'supabase',
            endpoint,
            tokensUsed: dataSize || 1, // Using data size as "tokens" for storage
            costInRand: cost,
            operation,
            success,
            error
        });
    }
    // Get usage statistics
    getUsageStats(timeRange = 'all') {
        const now = Date.now();
        const filteredUsage = this.usage.filter(usage => {
            switch (timeRange) {
                case 'day':
                    return now - usage.timestamp < 24 * 60 * 60 * 1000;
                case 'week':
                    return now - usage.timestamp < 7 * 24 * 60 * 60 * 1000;
                case 'month':
                    return now - usage.timestamp < 30 * 24 * 60 * 60 * 1000;
                default:
                    return true;
            }
        });
        const stats = {
            totalRequests: filteredUsage.length,
            totalTokens: 0,
            totalCost: 0,
            successRate: 0,
            byApi: {
                openai: { requests: 0, tokens: 0, cost: 0 },
                azure: { requests: 0, tokens: 0, cost: 0 },
                supabase: { requests: 0, tokens: 0, cost: 0 }
            },
            byModel: {},
            recentActivity: filteredUsage.slice(-10).reverse()
        };
        filteredUsage.forEach(usage => {
            stats.totalTokens += usage.tokensUsed;
            stats.totalCost += usage.costInRand;
            if (usage.success) {
                stats.successRate++;
            }
            // By API
            stats.byApi[usage.api].requests++;
            stats.byApi[usage.api].tokens += usage.tokensUsed;
            stats.byApi[usage.api].cost += usage.costInRand;
            // By Model (for OpenAI)
            if (usage.model) {
                if (!stats.byModel[usage.model]) {
                    stats.byModel[usage.model] = { requests: 0, tokens: 0, cost: 0 };
                }
                stats.byModel[usage.model].requests++;
                stats.byModel[usage.model].tokens += usage.tokensUsed;
                stats.byModel[usage.model].cost += usage.costInRand;
            }
        });
        stats.successRate = stats.totalRequests > 0 ? (stats.successRate / stats.totalRequests) * 100 : 0;
        return stats;
    }
    // Get detailed usage history
    getUsageHistory(limit = 50) {
        return this.usage.slice(-limit).reverse();
    }
    // Clear old usage data (older than 30 days)
    clearOldData() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.usage = this.usage.filter(usage => usage.timestamp > thirtyDaysAgo);
        this.saveToStorage();
    }
    // Export usage data
    exportData() {
        return {
            usage: this.usage,
            stats: this.getUsageStats('all'),
            exportDate: new Date().toISOString()
        };
    }
    // Reset all usage data
    resetData() {
        this.usage = [];
        this.saveToStorage();
    }
    // Dashboard integration controls
    enableDashboard(enabled = true) {
        this.dashboardEnabled = enabled;
    }
    setDashboardUrl(url) {
        this.dashboardBaseUrl = url;
    }
    addUsage(usage) {
        console.log('🔍 [API TRACKER] addUsage called with:', usage);
        console.log('🔍 [API TRACKER] Current usage array length:', this.usage.length);
        this.usage.push(usage);
        console.log('🔍 [API TRACKER] Added to usage array, new length:', this.usage.length);
        console.log('🔍 [API TRACKER] Saving to localStorage...');
        this.saveToStorage();
        console.log('🔍 [API TRACKER] Notifying live log listeners...');
        this.notifyLiveLogListeners(usage);
        console.log('🔍 [API TRACKER] Starting sendToSupabase...');
        // Send to Supabase first (production-ready), fallback to backend
        this.sendToSupabase(usage).catch(err => console.error('❌ [API TRACKER] API usage tracking failed:', err));
        console.log('✅ [API TRACKER] addUsage completed');
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usage));
        }
        catch (error) {
            console.error('Failed to save API usage data:', error);
        }
    }
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.usage = JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load API usage data:', error);
            this.usage = [];
        }
    }
    notifyLiveLogListeners(usage) {
        const entry = {
            id: usage.id,
            timestamp: usage.timestamp,
            api: usage.api,
            operation: usage.operation,
            tokensUsed: usage.tokensUsed,
            model: usage.model,
            success: usage.success,
            timeAgo: this.getTimeAgo(usage.timestamp, Date.now())
        };
        this.liveLogListeners.forEach(listener => listener(entry));
    }
}
// Create singleton instance
export const apiUsageTracker = new ApiUsageTracker();
// Auto-clean old data every day
setInterval(() => {
    apiUsageTracker.clearOldData();
}, 24 * 60 * 60 * 1000); // 24 hours 

// API Usage Tracker for monitoring token usage and costs
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

// Live log entry for real-time display
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
    'gpt-4': { input: number; output: number }; // per 1K tokens
    'gpt-4o': { input: number; output: number };
    'gpt-3.5-turbo': { input: number; output: number };
  };
  azure: {
    tts: number; // per 1M characters
  };
  supabase: {
    storage: number; // per GB
    database: number; // per request
  };
}

// Current API costs in Rand (as of 2024)
export const API_COSTS: ApiCosts = {
  openai: {
    'gpt-4': { input: 0.45, output: 1.35 }, // R0.45/R1.35 per 1K tokens
    'gpt-4o': { input: 0.15, output: 0.60 }, // R0.15/R0.60 per 1K tokens
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
  private usage: ApiUsage[] = [];
  private readonly STORAGE_KEY = 'api_usage_tracker';
  private liveLogListeners: ((entry: LiveLogEntry) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // Add listener for live log updates
  addLiveLogListener(listener: (entry: LiveLogEntry) => void) {
    this.liveLogListeners.push(listener);
  }

  // Remove listener
  removeLiveLogListener(listener: (entry: LiveLogEntry) => void) {
    const index = this.liveLogListeners.indexOf(listener);
    if (index > -1) {
      this.liveLogListeners.splice(index, 1);
    }
  }

  // Get recent live log entries
  getLiveLogEntries(limit: number = 20): LiveLogEntry[] {
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

  // Helper to format time ago
  private getTimeAgo(timestamp: number, now: number): string {
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  // Track OpenAI API usage
  trackOpenAIUsage(
    endpoint: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    operation: string,
    success: boolean = true,
    error?: string
  ) {
    const inputCost = (inputTokens / 1000) * API_COSTS.openai[model as keyof typeof API_COSTS.openai]?.input || 0;
    const outputCost = (outputTokens / 1000) * API_COSTS.openai[model as keyof typeof API_COSTS.openai]?.output || 0;
    const totalCost = inputCost + outputCost;
    const totalTokens = inputTokens + outputTokens;

    this.addUsage({
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
    });
  }

  // Track Azure TTS usage
  trackAzureUsage(
    endpoint: string,
    characters: number,
    operation: string,
    success: boolean = true,
    error?: string
  ) {
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
  trackSupabaseUsage(
    endpoint: string,
    operation: string,
    dataSize?: number, // in bytes
    success: boolean = true,
    error?: string
  ) {
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
  getUsageStats(timeRange: 'day' | 'week' | 'month' | 'all' = 'all') {
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
      byModel: {} as Record<string, { requests: 0, tokens: 0, cost: 0 }>,
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
  getUsageHistory(limit: number = 50) {
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

  private addUsage(usage: ApiUsage) {
    this.usage.push(usage);
    this.saveToStorage();
    this.notifyLiveLogListeners(usage);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usage));
    } catch (error) {
      console.error('Failed to save API usage data:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.usage = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load API usage data:', error);
      this.usage = [];
    }
  }

  private notifyLiveLogListeners(usage: ApiUsage) {
    const entry: LiveLogEntry = {
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
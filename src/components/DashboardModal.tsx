import React, { useState, useEffect } from 'react';
import { apiUsageTracker, type ApiUsage } from '../lib/ApiUsageTracker';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardModal({ isOpen, onClose }: DashboardModalProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState<any>(null);
  const [usageHistory, setUsageHistory] = useState<ApiUsage[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'history'>('overview');

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, timeRange]);

  const updateStats = () => {
    const currentStats = apiUsageTracker.getUsageStats(timeRange);
    const history = apiUsageTracker.getUsageHistory(20);
    setStats(currentStats);
    setUsageHistory(history);
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(4)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-ZA');
  };

  const getApiIcon = (api: string) => {
    switch (api) {
      case 'openai': return '🤖';
      case 'azure': return '☁️';
      case 'supabase': return '🗄️';
      default: return '🔗';
    }
  };

  const getApiColor = (api: string) => {
    switch (api) {
      case 'openai': return 'bg-green-600';
      case 'azure': return 'bg-blue-600';
      case 'supabase': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const exportData = () => {
    const data = apiUsageTracker.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all usage data? This action cannot be undone.')) {
      apiUsageTracker.resetData();
      updateStats();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="rounded-2xl bg-black p-0 w-full max-w-6xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white', position: 'relative', zIndex: 1 }}>
        {/* Modal Header */}
        <div 
          className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
            transform: 'translateZ(5px)'
          }}
        >
          <h2 
            className="text-white font-bold text-base text-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
              transform: 'translateZ(3px)'
            }}
          >
            📊 API Usage Dashboard
          </h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#000000', fontSize: '15px' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 px-4 pb-2 overflow-y-auto">
        <div className="space-y-6">

          {/* Time Range Selector */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {(['day', 'week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
              >
                📥 Export
              </button>
              <button
                onClick={resetData}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium"
              >
                🗑️ Reset
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            {(['overview', 'details', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          {stats && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Total Requests</div>
                      <div className="text-2xl font-bold text-white">{stats.totalRequests}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Total Tokens</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(stats.totalTokens)}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Total Cost</div>
                      <div className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalCost)}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm">Success Rate</div>
                      <div className="text-2xl font-bold text-blue-400">{stats.successRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* API Breakdown */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">API Usage Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(stats.byApi).map(([api, data]: [string, any]) => (
                        <div key={api} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getApiIcon(api)}</span>
                            <div>
                              <div className="font-semibold text-white capitalize">{api}</div>
                              <div className="text-sm text-gray-400">
                                {data.requests} requests • {formatNumber(data.tokens)} tokens
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-400">{formatCurrency(data.cost)}</div>
                            <div className="text-sm text-gray-400">
                              {((data.cost / stats.totalCost) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Model Breakdown (OpenAI) */}
                  {Object.keys(stats.byModel).length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">OpenAI Model Usage</h3>
                      <div className="space-y-3">
                        {Object.entries(stats.byModel).map(([model, data]: [string, any]) => (
                          <div key={model} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">🤖</span>
                              <div>
                                <div className="font-semibold text-white">{model}</div>
                                <div className="text-sm text-gray-400">
                                  {data.requests} requests • {formatNumber(data.tokens)} tokens
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-400">{formatCurrency(data.cost)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Cost Analysis */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Cost Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-3">Cost by API</h4>
                        <div className="space-y-2">
                          {Object.entries(stats.byApi).map(([api, data]: [string, any]) => (
                            <div key={api} className="flex justify-between items-center">
                              <span className="text-gray-400 capitalize">{api}</span>
                              <span className="font-semibold text-green-400">{formatCurrency(data.cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-3">Usage Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Avg Cost/Request</span>
                            <span className="font-semibold text-blue-400">
                              {stats.totalRequests > 0 ? formatCurrency(stats.totalCost / stats.totalRequests) : 'R0.0000'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Avg Tokens/Request</span>
                            <span className="font-semibold text-blue-400">
                              {stats.totalRequests > 0 ? Math.round(stats.totalTokens / stats.totalRequests) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-3xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</div>
                        <div className="text-gray-400">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-3xl font-bold text-blue-400">{stats.totalRequests}</div>
                        <div className="text-gray-400">Total Requests</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-3xl font-bold text-purple-400">{formatNumber(stats.totalTokens)}</div>
                        <div className="text-gray-400">Total Tokens</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {usageHistory.map((usage) => (
                        <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getApiIcon(usage.api)}</span>
                            <div>
                              <div className="font-semibold text-white">{usage.operation}</div>
                              <div className="text-sm text-gray-400">
                                {usage.endpoint} • {formatDate(usage.timestamp)}
                              </div>
                              {usage.error && (
                                <div className="text-sm text-red-400">Error: {usage.error}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-400">{formatCurrency(usage.costInRand)}</div>
                            <div className="text-sm text-gray-400">{formatNumber(usage.tokensUsed)} tokens</div>
                            <div className={`text-xs px-2 py-1 rounded ${usage.success ? 'bg-green-600' : 'bg-red-600'}`}>
                              {usage.success ? 'Success' : 'Failed'}
                            </div>
                          </div>
                        </div>
                      ))}
                      {usageHistory.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          No usage data available for the selected time range.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaRedo, FaChartLine, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

interface TokenStats {
  tokensAllocated: number;
  tokensRemaining: number;
  tokensUsed: number;
  totalRequests: number;
  totalCostUsd: number;
  apiUsage: ApiUsage[];
}

interface ApiUsage {
  name: string;
  requests: number;
  tokensUsed: number;
  estimatedCost: number;
  successCount: number;
  failureCount: number;
}

interface UsageEntry {
  id: number;
  api: string;
  endpoint: string;
  tokens: number;
  costUsd: number;
  responseStatus: string;
  responseTimeMs: number;
  timestamp: string;
  status: string;
  errorMessage?: string;
}

interface LiveTokenData {
  tokensRemaining: number;
  tokensUsed: number;
  updatedAt: string;
}

export default function AdminDashboard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [liveData, setLiveData] = useState<LiveTokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  const liveUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const apiBaseUrl = 'http://localhost:4002/api';

  // Fetch token statistics
  const fetchTokenStats = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/token-stats`);
      if (!response.ok) throw new Error('Failed to fetch token stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching token stats:', err);
      setError('Failed to load token statistics');
    }
  };

  // Fetch usage history
  const fetchUsageHistory = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/token-usage?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch usage history');
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      console.error('Error fetching usage history:', err);
      setError('Failed to load usage history');
    }
  };

  // Fetch live token data
  const fetchLiveTokenData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/token-live`);
      if (!response.ok) throw new Error('Failed to fetch live token data');
      const data = await response.json();
      setLiveData(data);
    } catch (err) {
      console.error('Error fetching live token data:', err);
    }
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchTokenStats(),
      fetchUsageHistory(),
      fetchLiveTokenData()
    ]);
    
    setLoading(false);
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Reset tokens
  const handleResetTokens = async () => {
    if (!confirm('Are you sure you want to reset tokens to 1000?')) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/reset-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokensAllocated: 1000 })
      });
      
      if (!response.ok) throw new Error('Failed to reset tokens');
      
      await loadData();
      alert('Tokens reset successfully!');
    } catch (err) {
      console.error('Error resetting tokens:', err);
      alert('Failed to reset tokens');
    }
  };

  // Export data
  const handleExportData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/export-usage?format=csv&days=30`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  // Log API usage (for testing)
  const logTestUsage = async (apiName: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/log-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiName,
          endpoint: `/api/${apiName}`,
          tokensUsed: 1,
          requestData: { test: true },
          responseStatus: 200,
          responseTimeMs: Math.floor(Math.random() * 1000) + 100,
          status: 'success'
        })
      });
      
      if (!response.ok) throw new Error('Failed to log usage');
      
      // Refresh data to show new usage
      await loadData();
    } catch (err) {
      console.error('Error logging test usage:', err);
    }
  };

  // Setup live updates
  useEffect(() => {
    if (isOpen) {
      loadData();
      
      // Start live updates every 5 seconds
      liveUpdateInterval.current = setInterval(fetchLiveTokenData, 5000);
      
      return () => {
        if (liveUpdateInterval.current) {
          clearInterval(liveUpdateInterval.current);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#111] border border-[var(--favourite-blue)] rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--favourite-blue)]"></div>
            <span className="ml-3 text-white text-lg">Loading Admin Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[var(--favourite-blue)] rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--favourite-blue)]">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-[var(--favourite-blue)] hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
                                  <FaRedo className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-500 rounded-lg text-red-100">
            <FaExclamationTriangle className="inline mr-2" />
            {error}
          </div>
        )}

        {/* Live Token Counter */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-900 to-purple-900 border border-[var(--favourite-blue)] rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Live Token Counter</h2>
              <div className="flex items-baseline gap-4">
                <div>
                  <span className="text-5xl font-mono font-bold text-white">
                    {liveData?.tokensRemaining || stats?.tokensRemaining || 0}
                  </span>
                  <span className="text-lg text-gray-300 ml-2">tokens remaining</span>
                </div>
                <div className="text-gray-300">
                  <div>Used: {liveData?.tokensUsed || stats?.tokensUsed || 0}</div>
                  <div>Total: {stats?.tokensAllocated || 1000}</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Usage</span>
                  <span>{Math.round(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-gray-300 mb-2">
                <div>Total Requests: {stats?.totalRequests || 0}</div>
                <div>Total Cost: ${(stats?.totalCostUsd || 0).toFixed(4)}</div>
              </div>
              <button
                onClick={handleResetTokens}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
              >
                Reset Tokens
              </button>
            </div>
          </div>
        </div>

        {/* API Usage Breakdown */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">API Usage Breakdown</h3>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 text-white rounded-lg"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.apiUsage.map((api) => (
              <div key={api.name} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{api.name.replace(/_/g, ' ').toUpperCase()}</h4>
                  <button
                    onClick={() => logTestUsage(api.name)}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  >
                    Test
                  </button>
                </div>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>Requests: {api.requests}</div>
                  <div>Tokens Used: {api.tokensUsed}</div>
                  <div>Cost: ${api.estimatedCost.toFixed(4)}</div>
                  <div className="flex items-center gap-2">
                    <span>Success: {api.successCount}</span>
                    <span>Failed: {api.failureCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage History */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Usage History</h3>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaDownload />
              Export Data
            </button>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold">Time</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">API</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Tokens</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Cost</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-300">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white">{entry.api}</td>
                      <td className="px-4 py-3 text-gray-300">{entry.tokens}</td>
                      <td className="px-4 py-3 text-gray-300">${entry.costUsd.toFixed(4)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          entry.status === 'success' 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {entry.status === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{entry.responseTimeMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="text-blue-400" />
              <h4 className="font-semibold text-white">Total Requests</h4>
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalRequests || 0}</div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaClock className="text-green-400" />
              <h4 className="font-semibold text-white">Total Cost</h4>
            </div>
            <div className="text-2xl font-bold text-white">${(stats?.totalCostUsd || 0).toFixed(4)}</div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="text-red-400" />
              <h4 className="font-semibold text-white">Success Rate</h4>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.apiUsage.length ? 
                Math.round((stats.apiUsage.reduce((acc, api) => acc + api.successCount, 0) / 
                           stats.apiUsage.reduce((acc, api) => acc + api.requests, 0)) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
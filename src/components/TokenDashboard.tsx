import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaRedo, FaChartLine, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';

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
  source_modal: string;
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

interface TokenDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TokenDashboard({ isOpen, onClose }: TokenDashboardProps) {
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
      if (!response.ok) {
        // If API fails, use mock data
        console.log('API not available, using mock data');
        setStats({
          tokensAllocated: 1000,
          tokensRemaining: 847,
          tokensUsed: 153,
          totalRequests: 25,
          totalCostUsd: 0.0153,
          apiUsage: [
            { name: 'image_generation', requests: 8, tokensUsed: 80, estimatedCost: 0.008, successCount: 7, failureCount: 1 },
            { name: 'text_generation', requests: 6, tokensUsed: 30, estimatedCost: 0.003, successCount: 5, failureCount: 1 },
            { name: 'text_to_speech', requests: 4, tokensUsed: 8, estimatedCost: 0.0008, successCount: 4, failureCount: 0 },
            { name: 'speech_to_text', requests: 3, tokensUsed: 3, estimatedCost: 0.0003, successCount: 3, failureCount: 0 },
            { name: 'translation', requests: 2, tokensUsed: 6, estimatedCost: 0.0006, successCount: 2, failureCount: 0 },
            { name: 'pdf_processing', requests: 2, tokensUsed: 10, estimatedCost: 0.001, successCount: 2, failureCount: 0 }
          ]
        });
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching token stats:', err);
      // Use mock data on error
      setStats({
        tokensAllocated: 1000,
        tokensRemaining: 847,
        tokensUsed: 153,
        totalRequests: 25,
        totalCostUsd: 0.0153,
        apiUsage: [
          { name: 'image_generation', requests: 8, tokensUsed: 80, estimatedCost: 0.008, successCount: 7, failureCount: 1 },
          { name: 'text_generation', requests: 6, tokensUsed: 30, estimatedCost: 0.003, successCount: 5, failureCount: 1 },
          { name: 'text_to_speech', requests: 4, tokensUsed: 8, estimatedCost: 0.0008, successCount: 4, failureCount: 0 },
          { name: 'speech_to_text', requests: 3, tokensUsed: 3, estimatedCost: 0.0003, successCount: 3, failureCount: 0 },
          { name: 'translation', requests: 2, tokensUsed: 6, estimatedCost: 0.0006, successCount: 2, failureCount: 0 },
          { name: 'pdf_processing', requests: 2, tokensUsed: 10, estimatedCost: 0.001, successCount: 2, failureCount: 0 }
        ]
      });
    }
  };

  // Fetch usage history
  const fetchUsageHistory = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/token-usage?limit=100`);
      if (!response.ok) {
        // If API fails, use mock data
        console.log('API not available, using mock usage data');
        setUsage([
          { id: 1, api: 'image_generation', endpoint: '/api/replicate/predictions', source_modal: 'Image Generation', tokens: 10, costUsd: 0.001, responseStatus: '200', responseTimeMs: 2500, timestamp: new Date().toISOString(), status: 'success' },
          { id: 2, api: 'text_generation', endpoint: '/api/openai/chat', source_modal: 'Text Generation', tokens: 5, costUsd: 0.0005, responseStatus: '200', responseTimeMs: 1200, timestamp: new Date(Date.now() - 300000).toISOString(), status: 'success' },
          { id: 3, api: 'text_to_speech', endpoint: '/api/azure/tts', source_modal: 'Text to Speech', tokens: 2, costUsd: 0.0002, responseStatus: '200', responseTimeMs: 800, timestamp: new Date(Date.now() - 600000).toISOString(), status: 'success' },
          { id: 4, api: 'speech_to_text', endpoint: '/api/speech/recognize', source_modal: 'Speech to Text', tokens: 1, costUsd: 0.0001, responseStatus: '200', responseTimeMs: 500, timestamp: new Date(Date.now() - 900000).toISOString(), status: 'success' },
          { id: 5, api: 'translation', endpoint: '/api/translate', source_modal: 'Translation', tokens: 3, costUsd: 0.0003, responseStatus: '200', responseTimeMs: 600, timestamp: new Date(Date.now() - 1200000).toISOString(), status: 'success' }
        ]);
        return;
      }
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      console.error('Error fetching usage history:', err);
      // Use mock data on error
      setUsage([
        { id: 1, api: 'image_generation', endpoint: '/api/replicate/predictions', source_modal: 'Image Generation', tokens: 10, costUsd: 0.001, responseStatus: '200', responseTimeMs: 2500, timestamp: new Date().toISOString(), status: 'success' },
        { id: 2, api: 'text_generation', endpoint: '/api/openai/chat', source_modal: 'Text Generation', tokens: 5, costUsd: 0.0005, responseStatus: '200', responseTimeMs: 1200, timestamp: new Date(Date.now() - 300000).toISOString(), status: 'success' },
        { id: 3, api: 'text_to_speech', endpoint: '/api/azure/tts', source_modal: 'Text to Speech', tokens: 2, costUsd: 0.0002, responseStatus: '200', responseTimeMs: 800, timestamp: new Date(Date.now() - 600000).toISOString(), status: 'success' },
        { id: 4, api: 'speech_to_text', endpoint: '/api/speech/recognize', source_modal: 'Speech to Text', tokens: 1, costUsd: 0.0001, responseStatus: '200', responseTimeMs: 500, timestamp: new Date(Date.now() - 900000).toISOString(), status: 'success' },
        { id: 5, api: 'translation', endpoint: '/api/translate', source_modal: 'Translation', tokens: 3, costUsd: 0.0003, responseStatus: '200', responseTimeMs: 600, timestamp: new Date(Date.now() - 1200000).toISOString(), status: 'success' }
      ]);
    }
  };

  // Fetch live token data
  const fetchLiveTokenData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/token-live`);
      if (!response.ok) {
        // If API fails, use mock data
        setLiveData({
          tokensRemaining: 847,
          tokensUsed: 153,
          updatedAt: new Date().toISOString()
        });
        return;
      }
      const data = await response.json();
      setLiveData(data);
    } catch (err) {
      console.error('Error fetching live token data:', err);
      // Use mock data on error
      setLiveData({
        tokensRemaining: 847,
        tokensUsed: 153,
        updatedAt: new Date().toISOString()
      });
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

  useEffect(() => {
    if (isOpen) {
      loadData();
      liveUpdateInterval.current = setInterval(fetchLiveTokenData, 5000); // Update live data every 5 seconds
    } else {
      if (liveUpdateInterval.current) {
        clearInterval(liveUpdateInterval.current);
      }
    }
    return () => {
      if (liveUpdateInterval.current) {
        clearInterval(liveUpdateInterval.current);
      }
    };
  }, [isOpen]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleResetTokens = async () => {
    if (!window.confirm('Are you sure you want to reset your tokens? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/reset-tokens`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset tokens');
      alert('Tokens reset successfully!');
      await loadData(); // Refresh data after reset
    } catch (err) {
      console.error('Error resetting tokens:', err);
      alert('Failed to reset tokens: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/export-usage?format=csv&days=365`);
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api_usage_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert('Usage data exported successfully!');
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Mock function to log test usage for demonstration
  const logTestUsage = async (apiName: string) => {
    try {
      const tokens = stats?.apiUsage.find(api => api.name === apiName)?.tokensUsed || 1;
      const response = await fetch(`${apiBaseUrl}/log-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiName,
          endpoint: `/api/mock/${apiName}`,
          sourceModal: 'TokenDashboard',
          tokensUsed: tokens,
          requestData: { test: true, api: apiName },
          responseStatus: '200',
          responseTimeMs: Math.floor(Math.random() * 1000) + 200,
          status: Math.random() > 0.1 ? 'success' : 'failed' // 10% failure rate
        })
      });
      if (!response.ok) throw new Error('Failed to log test usage');
      await loadData(); // Refresh data after logging
    } catch (err) {
      console.error('Error logging test usage:', err);
      alert('Failed to log test usage: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative bg-black border border-[var(--favourite-blue)] rounded-2xl shadow-lg p-6 w-full max-w-6xl h-[90vh] flex flex-col glassy-modal-bg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-300 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 z-10"
          aria-label="Close"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-[var(--favourite-blue)] mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">Token Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Monitor API Usage & Token Consumption</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-white text-xl">Loading dashboard data...</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 text-xl">Error: {error}</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {/* Live Token Counter */}
            <div className="glassy-btn neon-grid-btn p-6 mb-6 flex items-center justify-between rounded-xl shadow-lg border border-[var(--favourite-blue)]">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FaClock className="text-cyan-400" /> Your Tokens
                </h3>
                <div className="flex items-baseline">
                  <span className="text-5xl font-mono text-green-400 drop-shadow-md">
                    {liveData?.tokensRemaining ?? stats?.tokensRemaining ?? 0}
                  </span>
                  <span className="text-lg ml-2 text-gray-400">
                    of {stats?.tokensAllocated ?? 0}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((liveData?.tokensRemaining ?? stats?.tokensRemaining ?? 0) / (stats?.tokensAllocated || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right text-white">
                <div className="text-lg">Used: <span className="font-bold">{liveData?.tokensUsed ?? stats?.tokensUsed ?? 0}</span></div>
                <div className="text-lg">Total Requests: <span className="font-bold">{stats?.totalRequests ?? 0}</span></div>
                <div className="text-lg">Est. Cost: <span className="font-bold">${(stats?.totalCostUsd ?? 0).toFixed(4)}</span></div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={handleRefresh}
                    className="glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    disabled={refreshing}
                  >
                    <FaRedo className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={handleResetTokens}
                    className="glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 bg-red-600 hover:bg-red-700"
                  >
                    <FaRedo /> Reset Tokens
                  </button>
                </div>
              </div>
            </div>

            {/* API Usage Breakdown */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <FaChartLine className="text-purple-400" /> API Usage Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.apiUsage.length === 0 && (
                  <p className="text-gray-400 col-span-full text-center">No API usage data available yet. Make some API calls or log test usage!</p>
                )}
                {stats?.apiUsage.map((api) => (
                  <div key={api.name} className="glassy-btn neon-grid-btn p-4 rounded-xl shadow-md border border-[var(--favourite-blue)] flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2 capitalize">{api.name.replace(/_/g, ' ')}</h4>
                      <p className="text-gray-300 text-sm">Requests: <span className="font-medium">{api.requests}</span></p>
                      <p className="text-gray-300 text-sm">Tokens Used: <span className="font-medium">{api.tokensUsed}</span></p>
                      <p className="text-gray-300 text-sm">Est. Cost: <span className="font-medium">${api.estimatedCost.toFixed(4)}</span></p>
                      <div className="flex items-center text-sm mt-2">
                        <span className="text-green-400 flex items-center gap-1">
                          <FaCheckCircle /> {api.successCount} Success
                        </span>
                        <span className="text-red-400 ml-4 flex items-center gap-1">
                          <FaExclamationTriangle /> {api.failureCount} Failed
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => logTestUsage(api.name)}
                      className="mt-4 glassy-btn neon-grid-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                    >
                      Log Test Usage
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage History */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <FaClock className="text-green-400" /> Usage History
              </h3>
              <div className="bg-black border border-[var(--favourite-blue)] rounded-xl overflow-hidden shadow-lg">
                <table className="min-w-full divide-y divide-[var(--favourite-blue)]">
                  <thead className="bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">API</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Endpoint</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source Modal</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tokens</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost ($)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Response Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-black divide-y divide-[var(--favourite-blue)]">
                    {usage.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">No usage history available.</td>
                      </tr>
                    ) : (
                      usage.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-900 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{new Date(entry.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.api}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.endpoint}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.source_modal}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.tokens}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">${entry.costUsd.toFixed(4)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              entry.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {entry.status}
                            </span>
                            {entry.errorMessage && (
                              <p className="text-red-400 text-xs mt-1">{entry.errorMessage}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.responseTimeMs}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleExportData}
                className="mt-4 glassy-btn neon-grid-btn px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <FaDownload /> Export Data (CSV)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
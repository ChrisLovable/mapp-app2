import React, { useState, useEffect, useRef } from 'react';
import { FaRedo, FaChartLine, FaClock, FaExclamationTriangle, FaCheckCircle, FaDownload } from 'react-icons/fa';
import ThreeDComponent from './ThreeDComponent';
import { supabase } from '../lib/supabase';

// Reusable Modal Header Component with consistent styling
const ModalHeader: React.FC<{ title: string; onClose?: () => void }> = ({ title, onClose }) => (
  <ThreeDComponent
    backgroundColor="#333333"
    className="mb-6 px-5 py-3 flex items-center justify-between"
    style={{ 
      backgroundColor: '#333333 !important',
      background: '#333333 !important'
    }}
  >
    <h2 className="text-xl font-bold text-white" style={{ 
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 255, 255, 0.4), 0 0 16px rgba(255, 255, 255, 0.2)',
      filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
      transform: 'translateZ(10px)',
      position: 'relative',
      zIndex: 2
    }}>{title}</h2>
    {onClose && (
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center ml-auto force-black-button"
        style={{ 
          border: '2px solid white', 
          outline: 'none', 
          backgroundColor: '#000000 !important',
          background: '#000000 !important',
          backgroundImage: 'none !important',
          backgroundClip: 'padding-box !important',
          WebkitBackgroundClip: 'padding-box !important',
          transition: 'all 0.2s',
          marginRight: '-10px',
          boxShadow: 'inset 0 0 0 100px #000000 !important'
        }}
      >
        ×
      </button>
    )}
  </ThreeDComponent>
);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | 'today' | 'week' | 'month' | '30days' | 'all'>('1h');

  
  const liveUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const apiBaseUrl = 'http://localhost:3000/api';

  // Filter usage data based on selected time range
  const getFilteredUsage = () => {
    const now = new Date();
    const startTime = new Date();

    switch (selectedTimeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'today':
        startTime.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'month':
        startTime.setDate(1); // First day of current month
        startTime.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startTime.setDate(now.getDate() - 30);
        break;
      case 'all':
        return usage; // Return all data
    }

    return usage.filter(entry => new Date(entry.timestamp) >= startTime);
  };

  // Calculate totals for filtered data
  const getFilteredTotals = () => {
    const filteredData = getFilteredUsage();
    const totalRequests = filteredData.length;
    const totalCost = filteredData.reduce((sum, entry) => sum + (entry.costUsd || 0), 0);
    const totalTokens = filteredData.reduce((sum, entry) => sum + (entry.tokens || 0), 0);

    // Debug logging for cost calculation
    console.log('🔍 [DASHBOARD] Cost calculation debug:');
    console.log('🔍 [DASHBOARD] Filtered data entries:', filteredData.length);
    filteredData.forEach((entry, index) => {
      const individualCostUSD = entry.costUsd || 0;
      const individualCostRand = individualCostUSD * 20;
      console.log(`🔍 [DASHBOARD] Entry ${index + 1}:`, {
        api: entry.api,
        tokens: entry.tokens,
        costUsd: individualCostUSD,
        costRand: individualCostRand,
        costRandFormatted: `R${individualCostRand.toFixed(2)}`
      });
    });
    console.log('🔍 [DASHBOARD] Total cost (USD):', totalCost);
    console.log('🔍 [DASHBOARD] Total cost (Rand):', totalCost * 20);
    console.log('🔍 [DASHBOARD] Total cost (Rand formatted):', `R${(totalCost * 20).toFixed(2)}`);

    return {
      totalRequests,
      totalCost,
      totalTokens,
      filteredData
    };
  };

  // Fetch token statistics directly from Supabase
  const fetchTokenStats = async () => {
    console.log('🔍 [DASHBOARD] fetchTokenStats called');
    
    try {
      console.log('🔍 [DASHBOARD] Fetching from Supabase dashboard_api_usage table...');
      
      // Get usage data from Supabase
      const { data: usageData, error } = await supabase
        .from('dashboard_api_usage')
        .select('*')
        .order('time', { ascending: false });

      console.log('🔍 [DASHBOARD] Supabase query result:', { data: usageData, error });

      if (error) {
        console.error('❌ [DASHBOARD] Supabase query failed:', error);
        throw error;
      }

      if (!usageData || usageData.length === 0) {
        console.log('⚠️ [DASHBOARD] No data found in dashboard_api_usage table');
        // Use mock data if no real data exists
        setStats({
          tokensAllocated: 100000,
          tokensRemaining: 100000,
          tokensUsed: 0,
          totalRequests: 0,
          totalCostUsd: 0,
          apiUsage: []
        });
        return;
      }

      console.log('✅ [DASHBOARD] Found usage data:', usageData.length, 'entries');
      console.log('🔍 [DASHBOARD] Raw usage data:', usageData);
      
      // Log each entry for debugging
      usageData.forEach((entry, index) => {
        console.log(`🔍 [DASHBOARD] Entry ${index + 1}:`, {
          tokens: entry.tokens,
          cost: entry.cost,
          api: entry.api,
          status: entry.status,
          time: entry.time
        });
      });
      
      // Calculate stats from real data
      const totalTokens = usageData.reduce((sum, entry) => {
        const tokens = entry.tokens || 0;
        console.log(`🔍 [DASHBOARD] Adding tokens: ${tokens} (running total: ${sum + tokens})`);
        return sum + tokens;
      }, 0);
      
      const totalCost = usageData.reduce((sum, entry) => {
        const cost = entry.cost || 0;
        console.log(`🔍 [DASHBOARD] Adding cost: ${cost} (running total: ${sum + cost})`);
        return sum + cost;
      }, 0);
      
      const totalRequests = usageData.length;
      
      console.log('🔍 [DASHBOARD] Final calculations:', {
        totalTokens,
        totalCost,
        totalRequests,
        tokensAllocated: 100000,
        tokensRemaining: Math.max(0, 100000 - totalTokens)
      });
      
      const calculatedStats = {
        tokensAllocated: 100000,
        tokensRemaining: Math.max(0, 100000 - totalTokens),
        tokensUsed: totalTokens,
        totalRequests: totalRequests,
        totalCostUsd: totalCost,
        apiUsage: [
          { name: 'openai_gpt', requests: totalRequests, tokensUsed: totalTokens, estimatedCost: totalCost, successCount: totalRequests, failureCount: 0 }
        ]
      };

      console.log('📊 [DASHBOARD] Calculated stats:', calculatedStats);
      setStats(calculatedStats);
      
    } catch (err) {
      console.error('❌ [DASHBOARD] Error fetching token stats:', err);
      // Use empty data on error instead of showing mock data
      setStats({
        tokensAllocated: 100000,
        tokensRemaining: 100000,
        tokensUsed: 0,
        totalRequests: 0,
        totalCostUsd: 0,
        apiUsage: []
      });
    }
  };

  // Fetch usage history
  const fetchUsageHistory = async () => {
    console.log('🔍 [DASHBOARD] fetchUsageHistory called');
    
    try {
      console.log('🔍 [DASHBOARD] Fetching usage history from Supabase...');
      
      // Get usage data from Supabase
      const { data: usageData, error } = await supabase
        .from('dashboard_api_usage')
        .select('*')
        .order('time', { ascending: false })
        .limit(100);

      console.log('🔍 [DASHBOARD] Usage history query result:', { data: usageData, error });

      if (error) {
        console.error('❌ [DASHBOARD] Failed to fetch usage history from Supabase:', error);
        throw error;
      }

      if (!usageData || usageData.length === 0) {
        console.log('⚠️ [DASHBOARD] No usage history found in Supabase');
        setUsage([]);
        return;
      }

      console.log('✅ [DASHBOARD] Found usage history:', usageData.length, 'entries');
      
      // Transform Supabase data to expected format
      const transformedData = usageData.map(entry => ({
        id: entry.id,
        api: entry.api,
        endpoint: `/api/${entry.api}`,
        tokens: entry.tokens,
        costUsd: entry.cost,
        responseStatus: '200',
        responseTimeMs: entry.response_time,
        timestamp: entry.time,
        status: entry.status
      }));

      console.log('📊 [DASHBOARD] Raw Supabase data:', usageData);
      console.log('📊 [DASHBOARD] Transformed usage data:', transformedData);
      
      // Debug cost data specifically
      console.log('💰 [DASHBOARD] Cost debugging:');
      usageData.forEach((entry, index) => {
        console.log(`💰 [DASHBOARD] Raw entry ${index + 1}:`, {
          id: entry.id,
          api: entry.api,
          tokens: entry.tokens,
          costFromDB: entry.cost,
          costType: typeof entry.cost,
          costInRand: entry.cost * 20
        });
      });
      
      setUsage(transformedData);
      
    } catch (err) {
      console.error('❌ [DASHBOARD] Error fetching usage history:', err);
      console.log('🔄 [DASHBOARD] Using empty array as fallback');
      setUsage([]);
    }
  };



  // Load initial data
  const loadData = async () => {
    console.log('🔄 [DASHBOARD] loadData called - refreshing all data...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [DASHBOARD] Fetching stats and history...');
    await Promise.all([
      fetchTokenStats(),
        fetchUsageHistory()
    ]);
      console.log('✅ [DASHBOARD] All data refreshed successfully');
    } catch (err) {
      console.error('❌ [DASHBOARD] Failed to refresh data:', err);
      setError('Failed to load dashboard data');
    }
    
    setLoading(false);
  };

  // Refresh data
  const handleRefresh = async () => {
    console.log('🔄 [DASHBOARD] Manual refresh button clicked');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    console.log('✅ [DASHBOARD] Manual refresh completed');
  };

  // Get token color based on API type
  const getTokenColor = (apiType: string): string => {
    switch (apiType?.toLowerCase()) {
      case 'openai_gpt':
      case 'openai':
        return 'text-green-400'; // Green for OpenAI
      case 'image_generation':
      case 'replicate':
        return 'text-purple-400'; // Purple for image generation
      case 'text_to_speech':
      case 'azure':
        return 'text-blue-400'; // Blue for TTS
      case 'database_query':
      case 'supabase':
        return 'text-orange-400'; // Orange for database
      case 'translation':
        return 'text-pink-400'; // Pink for translation
      case 'search':
        return 'text-cyan-400'; // Cyan for search APIs
      default:
        return 'text-gray-300'; // Default gray for unknown APIs
    }
  };

  // Export usage data to CSV
  const exportToCSV = () => {
    try {
      const filteredData = getFilteredTotals().filteredData;
      
      if (filteredData.length === 0) {
        alert('No data to export for the selected time range.');
        return;
      }

      // Create CSV header
      const csvHeader = 'Time,API,Tokens\n';
      
      // Create CSV rows
      const csvRows = filteredData.map(entry => {
        const time = new Date(entry.timestamp).toLocaleString();
        const api = `"${entry.api.replace(/"/g, '""')}"`;  // Escape quotes in API names
        const tokens = entry.tokens;
        return `${time},${api},${tokens}`;
      }).join('\n');
      
      // Combine header and rows
      const csvContent = csvHeader + csvRows;
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with timestamp and time range
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `api-usage-${selectedTimeRange}-${timestamp}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ [DASHBOARD] Exported ${filteredData.length} records to ${filename}`);
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    }
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





  // Setup initial data load (removed automatic live updates)
  useEffect(() => {
    if (isOpen) {
      loadData();
      
      // Removed automatic live updates - use refresh button instead
      // liveUpdateInterval.current = setInterval(fetchLiveTokenData, 5000);
      
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
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
        <div className="w-full flex items-center justify-center">
          <div className="rounded-2xl bg-black p-0 w-full flex flex-col transition-all duration-300 relative" style={{ boxSizing: 'border-box', height: '90vh', maxHeight: '90vh', border: '2px solid white' }}>
            <div className="overflow-y-auto max-h-[90vh] flex items-center justify-center">
          <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <span className="ml-3 text-white text-lg">Loading Admin Dashboard...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="rounded-2xl bg-black p-0 w-full flex flex-col transition-all duration-300 relative" style={{ boxSizing: 'border-box', height: '90vh', width: '80vw', maxHeight: '90vh', border: '2px solid white' }}>
          <div className="flex-1 px-4 pb-2 overflow-y-auto">
        {/* Header */}
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
            Token Dashboard
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

            {/* Refresh Button */}
            <div className="flex justify-center mb-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
                className={`glassy-btn px-4 py-2 rounded-2xl text-white transition-colors flex items-center gap-2 border-0 animated-white-border ${
                  refreshing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                <FaRedo className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

            <div className="space-y-6">


        {error && (
                <div className="mb-4 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200">
            <FaExclamationTriangle className="inline mr-2" />
            {error}
          </div>
        )}

                             {/* Token Credits Remaining */}
               <div className="mb-4 p-4 border border-gray-600 rounded-lg" style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
                 <div className="text-center mb-3">
                   <h2 className="text-lg font-bold text-white mb-1">Token Credits Remaining</h2>
                   <p className="text-gray-300 text-xs">
                     {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Track API usage in real-time
                   </p>
                 </div>

                                 {/* Main Token Display */}
                <div className="text-center mb-4">
                  <div className="inline-block p-2 rounded" style={{ background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <div className="text-xl font-mono font-bold text-green-400 mb-1">
                    {(stats?.tokensRemaining || 0).toLocaleString()}
                  </div>
                    <div className="text-xs text-gray-300 font-medium">
                      Tokens Remaining
                    </div>
                  </div>
                </div>

                 {/* Token Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   {/* Used Tokens */}
                   <div className="text-center p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                       <div className="text-lg font-bold text-red-400">
                    {(stats?.tokensUsed || 0).toLocaleString()}
                  </div>
                     <div className="text-gray-300 text-xs">Used</div>
                   </div>

                   {/* Total Allocated */}
                   <div className="text-center p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                     <div className="text-lg font-bold text-blue-400">
                       {(stats?.tokensAllocated || 1000).toLocaleString()}
                     </div>
                     <div className="text-gray-300 text-xs">Allocated</div>
                </div>
              </div>
              
                 {/* Compact Progress Bar */}
                 <div className="mb-3">
                   <div className="flex justify-between text-sm text-white mb-1">
                     <span>Progress</span>
                  <span>{Math.round(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100)}%</span>
                </div>
                   <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                       className="h-3 rounded-full transition-all duration-1000"
                    style={{ 
                         width: `${Math.min(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100, 100)}%`,
                         background: `linear-gradient(90deg, 
                           ${((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 50 ? '#10b981' : 
                             ((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 80 ? '#f59e0b' : '#ef4444'} 0%, 
                           ${((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 50 ? '#059669' : 
                             ((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 80 ? '#d97706' : '#dc2626'} 100%)`
                    }}
                  ></div>
              </div>
            </div>
            
                 {/* Bottom Stats Row */}
                 <div className="flex justify-center gap-6 pt-2 border-t border-gray-600">
                   <div className="text-center">
                     <div className="text-lg font-bold text-blue-400">{stats?.totalRequests || 0}</div>
                     <div className="text-gray-300 text-xs">Requests</div>
              </div>
                   <div className="text-center">
                     <div className="text-lg font-bold text-yellow-400">R{((stats?.totalCostUsd || 0) * 20).toFixed(2)}</div>
                     <div className="text-gray-300 text-xs">Cost</div>
            </div>
          </div>
        </div>



              {/* Usage History with Time Controls */}
              <div className="mb-6 border border-gray-600 rounded-lg p-4" style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
                {/* Header with Time Selector */}
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">Usage History</h3>
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                      }}
                      title="Export usage data to CSV spreadsheet"
                    >
                      <FaDownload className="text-sm" />
                      Export CSV
                    </button>
                  </div>
                  
                  {/* Time Range Controls */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedTimeRange('1h')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === '1h' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Last Hour
                    </button>
                    <button 
                      onClick={() => setSelectedTimeRange('today')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === 'today' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setSelectedTimeRange('week')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === 'week' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      This Week
                    </button>
                    <button 
                      onClick={() => setSelectedTimeRange('month')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === 'month' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      This Month
                    </button>
                    <button 
                      onClick={() => setSelectedTimeRange('30days')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === '30days' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Last 30 Days
                    </button>
                  <button
                      onClick={() => setSelectedTimeRange('all')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeRange === 'all' 
                          ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      All Time
                  </button>
                  </div>
                </div>

                {/* Usage Summary for Selected Time Range */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{getFilteredTotals().totalRequests}</div>
                    <div className="text-xs text-gray-300">Total Requests</div>
              </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{getFilteredTotals().totalTokens.toLocaleString()}</div>
                    <div className="text-xs text-gray-300">Total Tokens</div>
          </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">R{(getFilteredTotals().totalCost * 20).toFixed(2)}</div>
                    <div className="text-xs text-gray-300">Total Cost</div>
        </div>
          </div>
          
                {/* Usage Table */}
                <div className="border border-gray-700 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' }}>
            <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' }}>
                        <tr>
                          <th className="px-2 py-2 text-left text-white font-semibold text-sm w-2/5">Time</th>
                          <th className="px-2 py-2 text-left text-white font-semibold text-sm w-2/5">API</th>
                          <th className="px-2 py-2 text-left text-white font-semibold text-sm w-1/5">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                        {getFilteredTotals().filteredData.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-700 hover:bg-gray-750">
                            <td className="px-2 py-2 text-gray-300 text-xs w-2/5">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                            <td className="px-2 py-2 text-white text-xs w-2/5 break-words overflow-hidden">{entry.api}</td>
                            <td className={`px-2 py-2 text-xs w-1/5 font-semibold ${getTokenColor(entry.api)}`}>{entry.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>



            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
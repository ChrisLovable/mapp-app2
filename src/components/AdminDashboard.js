import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { FaRedo, FaChartLine, FaClock, FaExclamationTriangle, FaCheckCircle, FaDownload } from 'react-icons/fa';
import ThreeDComponent from './ThreeDComponent';
import { supabase } from '../lib/supabase';
// Reusable Modal Header Component with consistent styling
const ModalHeader = ({ title, onClose }) => (_jsxs(ThreeDComponent, { backgroundColor: "#333333", className: "mb-6 px-5 py-3 flex items-center justify-between", style: {
        backgroundColor: '#333333 !important',
        background: '#333333 !important'
    }, children: [_jsx("h2", { className: "text-xl font-bold text-white", style: {
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.2), 0 0 8px rgba(255, 255, 255, 0.4), 0 0 16px rgba(255, 255, 255, 0.2)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
                transform: 'translateZ(10px)',
                position: 'relative',
                zIndex: 2
            }, children: title }), onClose && (_jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center ml-auto force-black-button", style: {
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
            }, children: "\u00D7" }))] }));
export default function AdminDashboard({ isOpen, onClose }) {
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
    const liveUpdateInterval = useRef(null);
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
    const getTokenColor = (apiType) => {
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
                const api = `"${entry.api.replace(/"/g, '""')}"`; // Escape quotes in API names
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
        }
        catch (error) {
            console.error('❌ [DASHBOARD] Error exporting CSV:', error);
            alert('Failed to export data. Please try again.');
        }
    };
    // Reset tokens
    const handleResetTokens = async () => {
        if (!confirm('Are you sure you want to reset tokens to 1000?'))
            return;
        try {
            const response = await fetch(`${apiBaseUrl}/reset-tokens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokensAllocated: 1000 })
            });
            if (!response.ok)
                throw new Error('Failed to reset tokens');
            await loadData();
            alert('Tokens reset successfully!');
        }
        catch (err) {
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
    if (!isOpen)
        return null;
    if (loading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4", children: _jsx("div", { className: "w-full flex items-center justify-center", children: _jsx("div", { className: "rounded-2xl bg-black p-0 w-full flex flex-col transition-all duration-300 relative", style: { boxSizing: 'border-box', height: '90vh', maxHeight: '90vh', border: '2px solid white' }, children: _jsx("div", { className: "overflow-y-auto max-h-[90vh] flex items-center justify-center", children: _jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400" }), _jsx("span", { className: "ml-3 text-white text-lg", children: "Loading Admin Dashboard..." })] }) }) }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4", children: _jsx("div", { className: "w-full flex items-center justify-center", children: _jsx("div", { className: "rounded-2xl bg-black p-0 w-full flex flex-col transition-all duration-300 relative", style: { boxSizing: 'border-box', height: '90vh', width: '80vw', maxHeight: '90vh', border: '2px solid white' }, children: _jsxs("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(10px)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                                transform: 'translateZ(5px)'
                            }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                        transform: 'translateZ(3px)'
                                    }, children: "Token Dashboard" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex justify-center mb-4", children: _jsxs("button", { onClick: handleRefresh, disabled: refreshing, className: `glassy-btn px-4 py-2 rounded-2xl text-white transition-colors flex items-center gap-2 border-0 animated-white-border ${refreshing
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''}`, children: [_jsx(FaRedo, { className: `text-sm ${refreshing ? 'animate-spin' : ''}` }), refreshing ? 'Refreshing...' : 'Refresh Data'] }) }), _jsxs("div", { className: "space-y-6", children: [error && (_jsxs("div", { className: "mb-4 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200", children: [_jsx(FaExclamationTriangle, { className: "inline mr-2" }), error] })), _jsxs("div", { className: "mb-4 p-4 border border-gray-600 rounded-lg", style: { background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }, children: [_jsxs("div", { className: "text-center mb-3", children: [_jsx("h2", { className: "text-lg font-bold text-white mb-1", children: "Token Credits Remaining" }), _jsxs("p", { className: "text-gray-300 text-xs", children: [new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), " - Track API usage in real-time"] })] }), _jsx("div", { className: "text-center mb-4", children: _jsxs("div", { className: "inline-block p-2 rounded", style: { background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' }, children: [_jsx("div", { className: "text-xl font-mono font-bold text-green-400 mb-1", children: (stats?.tokensRemaining || 0).toLocaleString() }), _jsx("div", { className: "text-xs text-gray-300 font-medium", children: "Tokens Remaining" })] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { className: "text-center p-2 rounded", style: { background: 'rgba(255, 255, 255, 0.05)' }, children: [_jsx("div", { className: "text-lg font-bold text-red-400", children: (stats?.tokensUsed || 0).toLocaleString() }), _jsx("div", { className: "text-gray-300 text-xs", children: "Used" })] }), _jsxs("div", { className: "text-center p-2 rounded", style: { background: 'rgba(255, 255, 255, 0.05)' }, children: [_jsx("div", { className: "text-lg font-bold text-blue-400", children: (stats?.tokensAllocated || 1000).toLocaleString() }), _jsx("div", { className: "text-gray-300 text-xs", children: "Allocated" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex justify-between text-sm text-white mb-1", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [Math.round(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100), "%"] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "h-3 rounded-full transition-all duration-1000", style: {
                                                            width: `${Math.min(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100, 100)}%`,
                                                            background: `linear-gradient(90deg, 
                           ${((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 50 ? '#10b981' :
                                                                ((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 80 ? '#f59e0b' : '#ef4444'} 0%, 
                           ${((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 50 ? '#059669' :
                                                                ((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1000)) * 100 < 80 ? '#d97706' : '#dc2626'} 100%)`
                                                        } }) })] }), _jsxs("div", { className: "flex justify-center gap-6 pt-2 border-t border-gray-600", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-bold text-blue-400", children: stats?.totalRequests || 0 }), _jsx("div", { className: "text-gray-300 text-xs", children: "Requests" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-lg font-bold text-yellow-400", children: ["R", ((stats?.totalCostUsd || 0) * 20).toFixed(2)] }), _jsx("div", { className: "text-gray-300 text-xs", children: "Cost" })] })] })] }), _jsxs("div", { className: "mb-6 border border-gray-600 rounded-lg p-4", style: { background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }, children: [_jsxs("div", { className: "flex flex-col items-center gap-4 mb-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: "Usage History" }), _jsxs("button", { onClick: exportToCSV, className: "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:scale-105", style: {
                                                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7))',
                                                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                                                backdropFilter: 'blur(10px)',
                                                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                                                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                                                            }, title: "Export usage data to CSV spreadsheet", children: [_jsx(FaDownload, { className: "text-sm" }), "Export CSV"] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { onClick: () => setSelectedTimeRange('1h'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === '1h'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "Last Hour" }), _jsx("button", { onClick: () => setSelectedTimeRange('today'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === 'today'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "Today" }), _jsx("button", { onClick: () => setSelectedTimeRange('week'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === 'week'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "This Week" }), _jsx("button", { onClick: () => setSelectedTimeRange('month'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === 'month'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "This Month" }), _jsx("button", { onClick: () => setSelectedTimeRange('30days'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === '30days'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "Last 30 Days" }), _jsx("button", { onClick: () => setSelectedTimeRange('all'), className: `px-3 py-1 rounded text-sm transition-colors ${selectedTimeRange === 'all'
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`, children: "All Time" })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg", style: { background: 'rgba(0, 0, 0, 0.2)' }, children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-bold text-blue-400", children: getFilteredTotals().totalRequests }), _jsx("div", { className: "text-xs text-gray-300", children: "Total Requests" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-bold text-green-400", children: getFilteredTotals().totalTokens.toLocaleString() }), _jsx("div", { className: "text-xs text-gray-300", children: "Total Tokens" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-lg font-bold text-yellow-400", children: ["R", (getFilteredTotals().totalCost * 20).toFixed(2)] }), _jsx("div", { className: "text-xs text-gray-300", children: "Total Cost" })] })] }), _jsx("div", { className: "border border-gray-700 rounded-lg overflow-hidden", style: { background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' }, children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full table-fixed", children: [_jsx("thead", { style: { background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' }, children: _jsxs("tr", { children: [_jsx("th", { className: "px-2 py-2 text-left text-white font-semibold text-sm w-2/5", children: "Time" }), _jsx("th", { className: "px-2 py-2 text-left text-white font-semibold text-sm w-2/5", children: "API" }), _jsx("th", { className: "px-2 py-2 text-left text-white font-semibold text-sm w-1/5", children: "Tokens" })] }) }), _jsx("tbody", { children: getFilteredTotals().filteredData.map((entry) => (_jsxs("tr", { className: "border-t border-gray-700 hover:bg-gray-750", children: [_jsx("td", { className: "px-2 py-2 text-gray-300 text-xs w-2/5", children: new Date(entry.timestamp).toLocaleString() }), _jsx("td", { className: "px-2 py-2 text-white text-xs w-2/5 break-words overflow-hidden", children: entry.api }), _jsx("td", { className: `px-2 py-2 text-xs w-1/5 font-semibold ${getTokenColor(entry.api)}`, children: entry.tokens })] }, entry.id))) })] }) }) })] })] })] }) }) }) }));
}

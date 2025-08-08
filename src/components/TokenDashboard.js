import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { TOKEN_API_BASE } from '../lib/config';
import { FaDownload, FaRedo, FaChartLine, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';
export default function TokenDashboard({ isOpen, onClose }) {
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState([]);
    const [liveData, setLiveData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [_timeRange, _setTimeRange] = useState('24h');
    const liveUpdateInterval = useRef(null);
    const apiBaseUrl = TOKEN_API_BASE;
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        else {
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
            if (!response.ok)
                throw new Error('Failed to reset tokens');
            alert('Tokens reset successfully!');
            await loadData(); // Refresh data after reset
        }
        catch (err) {
            console.error('Error resetting tokens:', err);
            alert('Failed to reset tokens: ' + (err instanceof Error ? err.message : String(err)));
        }
    };
    const handleExportData = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/export-usage?format=csv&days=365`);
            if (!response.ok)
                throw new Error('Failed to export data');
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
        }
        catch (err) {
            console.error('Error exporting data:', err);
            alert('Failed to export data: ' + (err instanceof Error ? err.message : String(err)));
        }
    };
    // Mock function to log test usage for demonstration
    const logTestUsage = async (apiName) => {
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
            if (!response.ok)
                throw new Error('Failed to log test usage');
            await loadData(); // Refresh data after logging
        }
        catch (err) {
            console.error('Error logging test usage:', err);
            alert('Failed to log test usage: ' + (err instanceof Error ? err.message : String(err)));
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-6xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "absolute left-0 right-0 px-4 py-3 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px) translateX(-50%)',
                        borderRadius: '10px',
                        top: '10px',
                        left: '50%',
                        width: '120%',
                        marginLeft: '-25px',
                        marginRight: '-25px'
                    }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(3px)'
                            }, children: "Token Dashboard" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: loading ? (_jsx("div", { className: "flex-1 flex items-center justify-center text-white text-xl", children: "Loading dashboard data..." })) : error ? (_jsxs("div", { className: "flex-1 flex items-center justify-center text-red-500 text-xl", children: ["Error: ", error] })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "p-6 mb-6 flex items-center justify-between rounded-xl", style: {
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7), rgba(59, 130, 246, 0.2))',
                                    backdropFilter: 'blur(20px)',
                                    border: '2px solid rgba(255, 255, 255, 0.4)',
                                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                                    filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                                    transform: 'translateZ(30px) perspective(1000px)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }, children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-xl font-bold text-white mb-2 flex items-center gap-2", children: [_jsx(FaClock, { className: "text-cyan-400" }), " Your Tokens"] }), _jsxs("div", { className: "flex items-baseline", children: [_jsx("span", { className: "text-5xl font-mono text-green-400 drop-shadow-md", children: liveData?.tokensRemaining ?? stats?.tokensRemaining ?? 0 }), _jsxs("span", { className: "text-lg ml-2 text-gray-400", children: ["of ", stats?.tokensAllocated ?? 0] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-2.5 mt-3", children: _jsx("div", { className: "bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out", style: { width: `${((liveData?.tokensRemaining ?? stats?.tokensRemaining ?? 0) / (stats?.tokensAllocated || 1)) * 100}%` } }) })] }), _jsxs("div", { className: "text-right text-white", children: [_jsxs("div", { className: "text-lg", children: ["Used: ", _jsx("span", { className: "font-bold", children: liveData?.tokensUsed ?? stats?.tokensUsed ?? 0 })] }), _jsxs("div", { className: "text-lg", children: ["Total Requests: ", _jsx("span", { className: "font-bold", children: stats?.totalRequests ?? 0 })] }), _jsxs("div", { className: "text-lg", children: ["Est. Cost: ", _jsxs("span", { className: "font-bold", children: ["$", (stats?.totalCostUsd ?? 0).toFixed(4)] })] }), _jsxs("div", { className: "flex gap-2 mt-4 justify-end", children: [_jsxs("button", { onClick: handleRefresh, className: "glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105", disabled: refreshing, children: [_jsx(FaRedo, { className: refreshing ? 'animate-spin' : '' }), " ", refreshing ? 'Refreshing...' : 'Refresh'] }), _jsxs("button", { onClick: handleResetTokens, className: "glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 bg-red-600 hover:bg-red-700", children: [_jsx(FaRedo, {}), " Reset Tokens"] })] })] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-2xl font-bold text-white mb-4 flex items-center gap-3", children: [_jsx(FaChartLine, { className: "text-purple-400" }), " API Usage Breakdown"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [stats?.apiUsage.length === 0 && (_jsx("p", { className: "text-gray-400 col-span-full text-center", children: "No API usage data available yet. Make some API calls or log test usage!" })), stats?.apiUsage.map((api) => (_jsxs("div", { className: "glassy-btn neon-grid-btn p-4 rounded-xl shadow-md border border-white flex flex-col justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-lg font-semibold text-white mb-2 capitalize", children: api.name.replace(/_/g, ' ') }), _jsxs("p", { className: "text-gray-300 text-sm", children: ["Requests: ", _jsx("span", { className: "font-medium", children: api.requests })] }), _jsxs("p", { className: "text-gray-300 text-sm", children: ["Tokens Used: ", _jsx("span", { className: "font-medium", children: api.tokensUsed })] }), _jsxs("p", { className: "text-gray-300 text-sm", children: ["Est. Cost: ", _jsxs("span", { className: "font-medium", children: ["$", api.estimatedCost.toFixed(4)] })] }), _jsxs("div", { className: "flex items-center text-sm mt-2", children: [_jsxs("span", { className: "text-green-400 flex items-center gap-1", children: [_jsx(FaCheckCircle, {}), " ", api.successCount, " Success"] }), _jsxs("span", { className: "text-red-400 ml-4 flex items-center gap-1", children: [_jsx(FaExclamationTriangle, {}), " ", api.failureCount, " Failed"] })] })] }), _jsx("button", { onClick: () => logTestUsage(api.name), className: "mt-4 glassy-btn neon-grid-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105", children: "Log Test Usage" })] }, api.name)))] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-2xl font-bold text-white mb-4 flex items-center gap-3", children: [_jsx(FaClock, { className: "text-green-400" }), " Usage History"] }), _jsx("div", { className: "bg-black border border-white rounded-xl overflow-hidden shadow-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-[var(--favourite-blue)]", children: [_jsx("thead", { className: "bg-gray-900", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Time" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "API" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Endpoint" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Source Modal" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Tokens" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Cost ($)" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Status" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider", children: "Response Time (ms)" })] }) }), _jsx("tbody", { className: "bg-black divide-y divide-[var(--favourite-blue)]", children: usage.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center", children: "No usage history available." }) })) : (usage.map((entry) => (_jsxs("tr", { className: "hover:bg-gray-900 transition-colors", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: new Date(entry.timestamp).toLocaleString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: entry.api }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: entry.endpoint }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: entry.source_modal }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: entry.tokens }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: ["$", entry.costUsd.toFixed(4)] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: [_jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: entry.status }), entry.errorMessage && (_jsx("p", { className: "text-red-400 text-xs mt-1", children: entry.errorMessage }))] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-200", children: entry.responseTimeMs })] }, entry.id)))) })] }) }), _jsxs("button", { onClick: handleExportData, className: "mt-4 glassy-btn neon-grid-btn px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105", children: [_jsx(FaDownload, {}), " Export Data (CSV)"] })] })] })) })] }) }));
}

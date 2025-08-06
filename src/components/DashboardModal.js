import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
export default function DashboardModal({ isOpen, onClose }) {
    const [timeRange, setTimeRange] = useState('all');
    const [stats, setStats] = useState(null);
    const [usageHistory, setUsageHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
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
    const formatCurrency = (amount) => {
        return `R${amount.toFixed(4)}`;
    };
    const formatNumber = (num) => {
        return num.toLocaleString();
    };
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-ZA');
    };
    const getApiIcon = (api) => {
        switch (api) {
            case 'openai': return '🤖';
            case 'azure': return '☁️';
            case 'supabase': return '🗄️';
            default: return '🔗';
        }
    };
    const getApiColor = (api) => {
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
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-6xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white', position: 'relative', zIndex: 1 }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                            }, children: "\uD83D\uDCCA API Usage Dashboard" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("div", { className: "flex space-x-2", children: ['day', 'week', 'month', 'all'].map((range) => (_jsx("button", { onClick: () => setTimeRange(range), className: `px-4 py-2 rounded-lg font-medium transition-colors ${timeRange === range
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`, children: range.charAt(0).toUpperCase() + range.slice(1) }, range))) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: exportData, className: "px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium", children: "\uD83D\uDCE5 Export" }), _jsx("button", { onClick: resetData, className: "px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium", children: "\uD83D\uDDD1\uFE0F Reset" })] })] }), _jsx("div", { className: "flex space-x-1 bg-gray-800 rounded-lg p-1", children: ['overview', 'details', 'history'].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `flex-1 py-2 px-4 rounded-md font-medium transition-colors ${activeTab === tab
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:text-white'}`, children: tab.charAt(0).toUpperCase() + tab.slice(1) }, tab))) }), stats && (_jsxs(_Fragment, { children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Total Requests" }), _jsx("div", { className: "text-2xl font-bold text-white", children: stats.totalRequests })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Total Tokens" }), _jsx("div", { className: "text-2xl font-bold text-white", children: formatNumber(stats.totalTokens) })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Total Cost" }), _jsx("div", { className: "text-2xl font-bold text-green-400", children: formatCurrency(stats.totalCost) })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("div", { className: "text-gray-400 text-sm", children: "Success Rate" }), _jsxs("div", { className: "text-2xl font-bold text-blue-400", children: [stats.successRate.toFixed(1), "%"] })] })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "API Usage Breakdown" }), _jsx("div", { className: "space-y-4", children: Object.entries(stats.byApi).map(([api, data]) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: getApiIcon(api) }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-white capitalize", children: api }), _jsxs("div", { className: "text-sm text-gray-400", children: [data.requests, " requests \u2022 ", formatNumber(data.tokens), " tokens"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "font-bold text-green-400", children: formatCurrency(data.cost) }), _jsxs("div", { className: "text-sm text-gray-400", children: [((data.cost / stats.totalCost) * 100).toFixed(1), "% of total"] })] })] }, api))) })] }), Object.keys(stats.byModel).length > 0 && (_jsxs("div", { className: "bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "OpenAI Model Usage" }), _jsx("div", { className: "space-y-3", children: Object.entries(stats.byModel).map(([model, data]) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-xl", children: "\uD83E\uDD16" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-white", children: model }), _jsxs("div", { className: "text-sm text-gray-400", children: [data.requests, " requests \u2022 ", formatNumber(data.tokens), " tokens"] })] })] }), _jsx("div", { className: "text-right", children: _jsx("div", { className: "font-bold text-green-400", children: formatCurrency(data.cost) }) })] }, model))) })] }))] })), activeTab === 'details' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Cost Analysis" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-300 mb-3", children: "Cost by API" }), _jsx("div", { className: "space-y-2", children: Object.entries(stats.byApi).map(([api, data]) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 capitalize", children: api }), _jsx("span", { className: "font-semibold text-green-400", children: formatCurrency(data.cost) })] }, api))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-300 mb-3", children: "Usage Metrics" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400", children: "Avg Cost/Request" }), _jsx("span", { className: "font-semibold text-blue-400", children: stats.totalRequests > 0 ? formatCurrency(stats.totalCost / stats.totalRequests) : 'R0.0000' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400", children: "Avg Tokens/Request" }), _jsx("span", { className: "font-semibold text-blue-400", children: stats.totalRequests > 0 ? Math.round(stats.totalTokens / stats.totalRequests) : 0 })] })] })] })] })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Performance Metrics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-gray-700 rounded-lg", children: [_jsxs("div", { className: "text-3xl font-bold text-green-400", children: [stats.successRate.toFixed(1), "%"] }), _jsx("div", { className: "text-gray-400", children: "Success Rate" })] }), _jsxs("div", { className: "text-center p-4 bg-gray-700 rounded-lg", children: [_jsx("div", { className: "text-3xl font-bold text-blue-400", children: stats.totalRequests }), _jsx("div", { className: "text-gray-400", children: "Total Requests" })] }), _jsxs("div", { className: "text-center p-4 bg-gray-700 rounded-lg", children: [_jsx("div", { className: "text-3xl font-bold text-purple-400", children: formatNumber(stats.totalTokens) }), _jsx("div", { className: "text-gray-400", children: "Total Tokens" })] })] })] })] })), activeTab === 'history' && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: [usageHistory.map((usage) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-700 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-xl", children: getApiIcon(usage.api) }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-white", children: usage.operation }), _jsxs("div", { className: "text-sm text-gray-400", children: [usage.endpoint, " \u2022 ", formatDate(usage.timestamp)] }), usage.error && (_jsxs("div", { className: "text-sm text-red-400", children: ["Error: ", usage.error] }))] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "font-bold text-green-400", children: formatCurrency(usage.costInRand) }), _jsxs("div", { className: "text-sm text-gray-400", children: [formatNumber(usage.tokensUsed), " tokens"] }), _jsx("div", { className: `text-xs px-2 py-1 rounded ${usage.success ? 'bg-green-600' : 'bg-red-600'}`, children: usage.success ? 'Success' : 'Failed' })] })] }, usage.id))), usageHistory.length === 0 && (_jsx("div", { className: "text-center text-gray-400 py-8", children: "No usage data available for the selected time range." }))] })] }) }))] }))] }) })] }) }));
}

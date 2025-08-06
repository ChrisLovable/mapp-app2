import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
export default function LiveApiLog({ isVisible }) {
    const [logEntries, setLogEntries] = useState([]);
    const logContainerRef = useRef(null);
    useEffect(() => {
        if (!isVisible)
            return;
        // Get initial log entries
        try {
            setLogEntries(apiUsageTracker.getLiveLogEntries(15));
        }
        catch (error) {
            console.error('Failed to get initial log entries:', error);
            setLogEntries([]);
        }
        // Add listener for new entries
        const handleNewEntry = (entry) => {
            setLogEntries(prev => {
                const newEntries = [entry, ...prev.slice(0, 14)]; // Keep max 15 entries
                return newEntries;
            });
        };
        try {
            apiUsageTracker.addLiveLogListener(handleNewEntry);
        }
        catch (error) {
            console.error('Failed to add live log listener:', error);
        }
        // Update time ago every 30 seconds
        const interval = setInterval(() => {
            try {
                setLogEntries(prev => prev.map(entry => ({
                    ...entry,
                    timeAgo: apiUsageTracker.getLiveLogEntries(1)[0]?.timeAgo || entry.timeAgo
                })));
            }
            catch (error) {
                console.error('Failed to update time ago:', error);
            }
        }, 30000);
        return () => {
            try {
                apiUsageTracker.removeLiveLogListener(handleNewEntry);
            }
            catch (error) {
                console.error('Failed to remove live log listener:', error);
            }
            clearInterval(interval);
        };
    }, [isVisible]);
    const copyAllText = () => {
        if (logContainerRef.current) {
            const textContent = logContainerRef.current.innerText;
            navigator.clipboard.writeText(textContent).then(() => {
                // Optional: Show a brief success message
                console.log('Log text copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    };
    const getApiIcon = (api) => {
        switch (api) {
            case 'openai': return '🤖';
            case 'azure': return '☁️';
            case 'supabase': return '🗄️';
            default: return '🔗';
        }
    };
    const getStatusColor = (success) => {
        return success ? 'text-green-400' : 'text-red-400';
    };
    const getApiColor = (api) => {
        switch (api) {
            case 'openai': return 'text-blue-400';
            case 'azure': return 'text-purple-400';
            case 'supabase': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };
    if (!isVisible)
        return null;
    return (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-700 z-40", children: _jsxs("div", { className: "max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-white", children: "\uD83D\uDCCA Live API Log" }), _jsxs("span", { className: "text-xs text-gray-400", children: ["(", logEntries.length, " requests)"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: copyAllText, className: "px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors", title: "Copy all log text", children: "\uD83D\uDCCB Copy All" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-xs text-gray-400", children: "Live" })] })] })] }), _jsx("div", { ref: logContainerRef, className: "max-h-32 overflow-y-auto", contentEditable: true, suppressContentEditableWarning: true, style: { outline: 'none' }, children: logEntries.length === 0 ? (_jsx("div", { className: "px-3 py-4 text-center text-gray-400 text-sm", children: "No API requests yet" })) : (_jsx("div", { className: "space-y-1 p-2", children: logEntries.map((entry) => (_jsxs("div", { className: "flex items-center justify-between text-xs bg-gray-800 rounded px-2 py-1 hover:bg-gray-700 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-1 min-w-0 flex-1", children: [_jsx("span", { className: "text-sm", children: getApiIcon(entry.api) }), _jsx("span", { className: `font-medium ${getApiColor(entry.api)} truncate`, children: entry.api.toUpperCase() })] }), _jsxs("div", { className: "flex-1 min-w-0 mx-2", children: [_jsx("div", { className: "truncate text-gray-300", children: entry.operation }), entry.model && (_jsx("div", { className: "text-xs text-gray-500 truncate", children: entry.model }))] }), _jsxs("div", { className: "flex items-center gap-2 text-right", children: [_jsxs("div", { className: "text-gray-300", children: [entry.tokensUsed.toLocaleString(), " tokens"] }), _jsx("div", { className: `font-bold ${getStatusColor(entry.success)}`, children: entry.success ? '✓' : '✗' }), _jsx("div", { className: "text-gray-500 text-xs", children: entry.timeAgo })] })] }, entry.id))) })) })] }) }));
}

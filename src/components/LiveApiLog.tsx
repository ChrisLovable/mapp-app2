import { useState, useEffect, useRef } from 'react';
import { apiUsageTracker } from '../lib/ApiUsageTracker';

// Define LiveLogEntry locally as fallback if import fails
interface LiveLogEntry {
  id: string;
  timestamp: number;
  api: 'openai' | 'azure' | 'supabase';
  operation: string;
  tokensUsed: number;
  model?: string;
  success: boolean;
  timeAgo: string;
}

interface LiveApiLogProps {
  isVisible: boolean;
}

export default function LiveApiLog({ isVisible }: LiveApiLogProps) {
  const [logEntries, setLogEntries] = useState<LiveLogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Get initial log entries
    try {
      setLogEntries(apiUsageTracker.getLiveLogEntries(15));
    } catch (error) {
      console.error('Failed to get initial log entries:', error);
      setLogEntries([]);
    }

    // Add listener for new entries
    const handleNewEntry = (entry: LiveLogEntry) => {
      setLogEntries(prev => {
        const newEntries = [entry, ...prev.slice(0, 14)]; // Keep max 15 entries
        return newEntries;
      });
    };

    try {
      apiUsageTracker.addLiveLogListener(handleNewEntry);
    } catch (error) {
      console.error('Failed to add live log listener:', error);
    }

    // Update time ago every 30 seconds
    const interval = setInterval(() => {
      try {
        setLogEntries(prev => 
          prev.map(entry => ({
            ...entry,
            timeAgo: apiUsageTracker.getLiveLogEntries(1)[0]?.timeAgo || entry.timeAgo
          }))
        );
      } catch (error) {
        console.error('Failed to update time ago:', error);
      }
    }, 30000);

    return () => {
      try {
        apiUsageTracker.removeLiveLogListener(handleNewEntry);
      } catch (error) {
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

  const getApiIcon = (api: string) => {
    switch (api) {
      case 'openai': return '🤖';
      case 'azure': return '☁️';
      case 'supabase': return '🗄️';
      default: return '🔗';
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getApiColor = (api: string) => {
    switch (api) {
      case 'openai': return 'text-blue-400';
      case 'azure': return 'text-purple-400';
      case 'supabase': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-700 z-40">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">📊 Live API Log</span>
            <span className="text-xs text-gray-400">({logEntries.length} requests)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAllText}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Copy all log text"
            >
              📋 Copy All
            </button>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Live</span>
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div 
          ref={logContainerRef}
          className="max-h-32 overflow-y-auto"
          contentEditable={true}
          suppressContentEditableWarning={true}
          style={{ outline: 'none' }}
        >
          {logEntries.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              No API requests yet
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {logEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs bg-gray-800 rounded px-2 py-1 hover:bg-gray-700 transition-colors"
                >
                  {/* API Icon and Name */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-sm">{getApiIcon(entry.api)}</span>
                    <span className={`font-medium ${getApiColor(entry.api)} truncate`}>
                      {entry.api.toUpperCase()}
                    </span>
                  </div>

                  {/* Operation */}
                  <div className="flex-1 min-w-0 mx-2">
                    <div className="truncate text-gray-300">
                      {entry.operation}
                    </div>
                    {entry.model && (
                      <div className="text-xs text-gray-500 truncate">
                        {entry.model}
                      </div>
                    )}
                  </div>

                  {/* Tokens and Status */}
                  <div className="flex items-center gap-2 text-right">
                    <div className="text-gray-300">
                      {entry.tokensUsed.toLocaleString()} tokens
                    </div>
                    <div className={`font-bold ${getStatusColor(entry.success)}`}>
                      {entry.success ? '✓' : '✗'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {entry.timeAgo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { X, Trash2, Eye, EyeOff, Download, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import logger, { LogEntry, LogLevel, LogImportance } from '../services/logger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [showPopups, setShowPopups] = useState(true);
  const [showOnlyImportant, setShowOnlyImportant] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to log updates
    const unsubscribe = logger.subscribe(setLogs);
    
    // Get initial logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, [isOpen]);

  const filteredLogs = logs.filter(log => {
    // Apply importance filter first
    const isImportant = !showOnlyImportant || isImportantLog(log);
    
    // Then apply level filter
    const matchesLevel = filter === 'all' || log.level === filter;
    
    return isImportant && matchesLevel;
  });

  // Helper function to check if log is important
  const isImportantLog = (log: LogEntry): boolean => {
    if (!log.importance) {
      // Default importance based on level
      return ['error', 'warning', 'success'].includes(log.level);
    }
    return ['high', 'critical'].includes(log.importance);
  };

  const getLogColor = (level: LogLevel) => {
    const colors = {
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      debug: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[level];
  };

  const getLogIcon = (level: LogLevel) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    return icons[level];
  };

  const getImportanceIcon = (importance?: LogImportance) => {
    if (!importance) return null;
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return icons[importance];
  };

  const exportLogs = () => {
    const logData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        source: log.source,
        details: log.details
      }))
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medalert-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Application Logs ({logs.length} total)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowOnlyImportant(!showOnlyImportant);
                logger.setShowOnlyImportant(!showOnlyImportant);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                showOnlyImportant 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showOnlyImportant ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {showOnlyImportant ? 'Important Only' : 'All Logs'}
            </button>
            <button
              onClick={() => setShowPopups(!showPopups)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                showPopups 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showPopups ? <Eye size={16} /> : <EyeOff size={16} />}
              {showPopups ? 'Popups On' : 'Popups Off'}
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={() => logger.clearLogs()}
              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
            >
              <Trash2 size={16} />
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
            {(['all', 'info', 'success', 'warning', 'error', 'debug'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === level
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No logs found for the selected filter.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getLogIcon(log.level)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.message}</span>
                          {getImportanceIcon(log.importance) && (
                            <span className="text-xs" title={`Importance: ${log.importance}`}>
                              {getImportanceIcon(log.importance)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs opacity-75">
                          <span>{log.timestamp.toLocaleString()}</span>
                          {log.source && <span>Source: {log.source}</span>}
                          <span className="uppercase font-medium">{log.level}</span>
                          {log.importance && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                              {log.importance}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium">
                              Show Details
                            </summary>
                            <pre className="mt-2 p-2 bg-white bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 rounded text-xs overflow-auto max-h-32">
                              {typeof log.details === 'string' 
                                ? log.details 
                                : JSON.stringify(log.details, null, 2)
                              }
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
          {showOnlyImportant && ` (${logs.filter(log => isImportantLog(log)).length} important)`}
          {filter !== 'all' && ` (filtered by ${filter})`}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;

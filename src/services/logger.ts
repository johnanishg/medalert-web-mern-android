import React from 'react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
export type LogImportance = 'low' | 'medium' | 'high' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
  source?: string;
  importance?: LogImportance;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private showPopups: boolean = true;
  private showOnlyImportant: boolean = true;

  // Subscribe to log updates
  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  // Toggle popup display
  setShowPopups(show: boolean) {
    this.showPopups = show;
  }

  // Toggle important-only display
  setShowOnlyImportant(show: boolean) {
    this.showOnlyImportant = show;
  }

  // Get important logs only
  getImportantLogs(): LogEntry[] {
    return this.logs.filter(log => this.isImportantLog(log));
  }

  // Check if a log is important
  private isImportantLog(log: LogEntry): boolean {
    if (!log.importance) {
      // Default importance based on level
      return ['error', 'warning', 'success'].includes(log.level);
    }
    return ['high', 'critical'].includes(log.importance);
  }

  // Add a log entry
  private addLog(level: LogLevel, message: string, details?: any, source?: string, importance?: LogImportance) {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      details,
      source,
      importance
    };

    this.logs.unshift(logEntry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notifyListeners();

    // Show popup if enabled and log is important (or show all is enabled)
    if (this.showPopups && (!this.showOnlyImportant || this.isImportantLog(logEntry))) {
      this.showLogPopup(logEntry);
    }

    // Also log to console for development
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  // Show popup notification
  private showLogPopup(log: LogEntry) {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = `fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out`;
    
    // Set colors based on log level
    const colors = {
      info: 'bg-blue-50 border-blue-500 text-blue-800',
      success: 'bg-green-50 border-green-500 text-green-800',
      warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
      error: 'bg-red-50 border-red-500 text-red-800',
      debug: 'bg-gray-50 border-gray-500 text-gray-800'
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    popup.className += ` ${colors[log.level]}`;
    
    popup.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-start">
          <span class="text-lg mr-2">${icons[log.level]}</span>
          <div class="flex-1">
            <div class="font-medium text-sm">${log.message}</div>
            ${log.source ? `<div class="text-xs opacity-75 mt-1">Source: ${log.source}</div>` : ''}
            <div class="text-xs opacity-60 mt-1">${log.timestamp.toLocaleTimeString()}</div>
            ${log.details ? `<details class="mt-2"><summary class="text-xs cursor-pointer">Details</summary><pre class="text-xs mt-1 bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-32">${JSON.stringify(log.details, null, 2)}</pre></details>` : ''}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg opacity-60 hover:opacity-100">×</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(popup);

    // Auto-remove after delay (longer for errors)
    const delay = log.level === 'error' ? 8000 : log.level === 'warning' ? 6000 : 4000;
    setTimeout(() => {
      if (popup.parentElement) {
        popup.style.transform = 'translateX(100%)';
        popup.style.opacity = '0';
        setTimeout(() => {
          if (popup.parentElement) {
            popup.remove();
          }
        }, 300);
      }
    }, delay);
  }

  // Public logging methods
  info(message: string, details?: any, source?: string, importance: LogImportance = 'medium') {
    this.addLog('info', message, details, source, importance);
  }

  success(message: string, details?: any, source?: string, importance: LogImportance = 'high') {
    this.addLog('success', message, details, source, importance);
  }

  warning(message: string, details?: any, source?: string, importance: LogImportance = 'high') {
    this.addLog('warning', message, details, source, importance);
  }

  error(message: string, details?: any, source?: string, importance: LogImportance = 'critical') {
    this.addLog('error', message, details, source, importance);
  }

  debug(message: string, details?: any, source?: string, importance: LogImportance = 'low') {
    this.addLog('debug', message, details, source, importance);
  }

  // API response logging
  apiCall(method: string, url: string, data?: any) {
    this.info(`API ${method.toUpperCase()} ${url}`, data, 'API', 'low');
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success';
    const importance = status >= 400 ? 'critical' : status >= 300 ? 'high' : 'medium';
    this.addLog(level, `API ${method.toUpperCase()} ${url} - ${status}`, data, 'API', importance);
  }

  // Database operations
  dbOperation(operation: string, collection: string, data?: any) {
    this.info(`DB ${operation} on ${collection}`, data, 'Database', 'low');
  }

  // User actions
  userAction(action: string, details?: any) {
    this.info(`User ${action}`, details, 'User', 'medium');
  }

  // System events
  systemEvent(event: string, details?: any) {
    this.info(`System: ${event}`, details, 'System', 'medium');
  }
}

// Create singleton instance
const logger = new LoggerService();

export default logger;

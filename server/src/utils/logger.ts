/**
 * @fileoverview Logger utility for ChatGPT-Buddy Server
 * @description Simple logging utility with multiple levels
 * @author rydnr
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

export class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(level: LogLevel = 'info') {
    this.logLevel = level;
  }

  public debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  public info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  public warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  public error(message: string, data?: any, context?: string): void {
    this.log('error', message, data, context);
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] < levels[this.logLevel]) {
      return; // Skip logs below current level
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context
    };

    // Add to internal log storage
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Output to console
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const context = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${context} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data || '');
        break;
      case 'info':
        console.info(message, entry.data || '');
        break;
      case 'warn':
        console.warn(message, entry.data || '');
        break;
      case 'error':
        console.error(message, entry.data || '');
        break;
    }
  }

  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);
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
export declare class Logger {
    private logLevel;
    private logs;
    private maxLogs;
    constructor(level?: LogLevel);
    debug(message: string, data?: any, context?: string): void;
    info(message: string, data?: any, context?: string): void;
    warn(message: string, data?: any, context?: string): void;
    error(message: string, data?: any, context?: string): void;
    private log;
    private outputToConsole;
    getLogs(level?: LogLevel, limit?: number): LogEntry[];
    clearLogs(): void;
    setLogLevel(level: LogLevel): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map
"use strict";
/**
 * @fileoverview Logger utility for ChatGPT-Buddy Server
 * @description Simple logging utility with multiple levels
 * @author rydnr
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
class Logger {
    constructor(level = 'info') {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = level;
    }
    debug(message, data, context) {
        this.log('debug', message, data, context);
    }
    info(message, data, context) {
        this.log('info', message, data, context);
    }
    warn(message, data, context) {
        this.log('warn', message, data, context);
    }
    error(message, data, context) {
        this.log('error', message, data, context);
    }
    log(level, message, data, context) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        if (levels[level] < levels[this.logLevel]) {
            return; // Skip logs below current level
        }
        const entry = {
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
    outputToConsole(entry) {
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
    getLogs(level, limit) {
        let filteredLogs = this.logs;
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }
        if (limit) {
            filteredLogs = filteredLogs.slice(-limit);
        }
        return filteredLogs;
    }
    clearLogs() {
        this.logs = [];
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
}
exports.Logger = Logger;
// Export singleton logger instance
exports.logger = new Logger(process.env.LOG_LEVEL || 'info');

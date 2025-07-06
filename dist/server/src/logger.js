"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// In a real application, you might use a more robust logging library like Winston or Pino
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
const logger = {
    info: (message, data) => log(LogLevel.INFO, message, data),
    warn: (message, data) => log(LogLevel.WARN, message, data),
    error: (message, error) => log(LogLevel.ERROR, message, error),
    debug: (message, data) => log(LogLevel.DEBUG, message, data),
};
function log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
    };
    console.log(JSON.stringify(logEntry, null, 2));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map
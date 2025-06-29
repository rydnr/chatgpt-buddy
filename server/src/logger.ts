// In a real application, you might use a more robust logging library like Winston or Pino
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

const logger = {
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
  error: (message: string, error?: any) => log(LogLevel.ERROR, message, error),
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
};

function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry, null, 2));
}

export default logger;

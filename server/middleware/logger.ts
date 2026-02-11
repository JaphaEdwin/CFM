import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current log level from environment
const currentLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;

// Log file path
const logDir = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'logs')
  : path.join(__dirname, '..', '..', 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

/**
 * Write to log file
 */
function writeToFile(message: string) {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `${date}.log`);
  
  fs.appendFileSync(logFile, message + '\n', 'utf8');
}

/**
 * Main log function
 */
function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const formattedMessage = formatMessage(level, message, meta);

  // Console output with colors
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';

  console.log(`${colors[level]}${formattedMessage}${reset}`);

  // Write to file in production
  if (process.env.NODE_ENV === 'production') {
    writeToFile(formattedMessage);
  }
}

/**
 * Logger interface
 */
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  
  // HTTP request logger middleware
  httpLogger: (req: { method: string; path: string; ip?: string }, res: { statusCode: number }, duration: number) => {
    const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log(level, `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
    });
  },
};

export default logger;

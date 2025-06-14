import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// Store original console methods before any potential overrides
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

let logFilePath: string;

export function getLogsDir(): string {
  const baseDir = app.isPackaged ? app.getPath('userData') : process.cwd();
  return path.join(baseDir, 'Console Logs');
}

export function initializeLogging(): void {
  try {
    const logsDir = getLogsDir();

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    logFilePath = path.join(logsDir, 'terminallogs.txt');

    // Clear the log file at the start of each session
    fs.writeFileSync(logFilePath, '', { encoding: 'utf8' });
    // Message will be logged from main.js after override

  } catch (error) {
    originalConsole.error('[Logging] Failed to initialize logging directory or clear log file:', error);
    // If setup fails, subsequent logging to file will be disabled by checks on logFilePath
  }
}

function getFormattedTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function logToFile(level: string, ...args: unknown[]): void {
  if (!logFilePath) { // Logging setup might have failed
    originalConsole.error('[Logging] Log file path not available. Skipping file log for:', ...args);
    // Still call original console method
    switch (level.toUpperCase()) {
      case 'WARN':
        originalConsole.warn(...args);
        break;
      case 'ERROR':
        originalConsole.error(...args);
        break;
      case 'INFO':
        originalConsole.info(...args);
        break;
      case 'DEBUG':
        originalConsole.debug(...args);
        break;
      default:
        originalConsole.log(...args);
    }
    return;
  }

  const timestamp = getFormattedTimestamp();
  const messageParts = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack || arg.message; // Log stack trace if available
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  });
  const message = messageParts.join(' ');
  const logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}\n`;

  try {
    fs.appendFileSync(logFilePath, logEntry, { encoding: 'utf8' });
  } catch (error) {
    originalConsole.error('[Logging] Failed to write to log file:', error);
    // Fallback to original console if file writing fails
  }

  // Call original console method
  switch (level.toUpperCase()) {
    case 'WARN':
      originalConsole.warn(...args);
      break;
    case 'ERROR':
      originalConsole.error(...args);
      break;
    case 'INFO':
      originalConsole.info(...args);
      break;
    case 'DEBUG':
      originalConsole.debug(...args);
      break;
    default:
      originalConsole.log(...args);
  }
}

export function overrideConsoleMethods(): void {
  console.log = (...args: unknown[]) => logToFile('log', ...args);
  console.warn = (...args: unknown[]) => logToFile('warn', ...args);
  console.error = (...args: unknown[]) => logToFile('error', ...args);
  console.info = (...args: unknown[]) => logToFile('info', ...args);
  console.debug = (...args: unknown[]) => logToFile('debug', ...args);
  // Message will be logged from main.js after override
}
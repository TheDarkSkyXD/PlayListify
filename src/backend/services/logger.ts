import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';

// Terminal color codes for better indicators
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground (text) colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Configuration
let logDir: string;
let consoleLogFilePath: string;
let terminalLogFilePath: string;
let isInitialized = false;
let originalConsoleLog: any;
let originalConsoleInfo: any;
let originalConsoleWarn: any;
let originalConsoleError: any;

/**
 * Initialize the logger
 */
export function initLogger() {
  if (isInitialized) return;

  // Log the paths for debugging
  const originalLog = console.log;

  // Create logs directory directly at the project root
  // Use process.cwd() which gives us the current working directory (project root in dev mode)
  try {
    logDir = path.join(process.cwd(), 'logs');
    fs.ensureDirSync(logDir);
    originalLog(`Created logs directory at: ${logDir}`);
  } catch (error) {
    originalLog(`Error creating logs directory: ${error}`);
    // Fallback to app data directory if we can't write to project root
    logDir = path.join(app.getPath('userData'), 'logs');
    fs.ensureDirSync(logDir);
    originalLog(`Using fallback logs directory: ${logDir}`);
  }

  // Set up log file paths
  consoleLogFilePath = path.join(logDir, 'consolelogs.txt');
  terminalLogFilePath = path.join(logDir, 'terminalconsole.txt');

  // Clear log files on startup
  try {
    // Clear and initialize console log file (for Electron app console)
    fs.writeFileSync(consoleLogFilePath, `=== PlayListify Electron Console Log - ${new Date().toISOString()} ===\n\n`);
    originalLog(`Electron console logs will be saved to: ${consoleLogFilePath}`);

    // Clear and initialize terminal log file (for terminal output)
    fs.writeFileSync(terminalLogFilePath, `=== PlayListify Terminal Log - ${new Date().toISOString()} ===\n\n`);
    originalLog(`Terminal logs will be saved to: ${terminalLogFilePath}`);
  } catch (error) {
    originalLog(`Error writing to log files: ${error}`);
  }

  // Store original console methods
  originalConsoleLog = console.log;
  originalConsoleInfo = console.info;
  originalConsoleWarn = console.warn;
  originalConsoleError = console.error;

  // Override console methods to capture output
  overrideConsoleMethods();

  // Log initialization
  console.log('🚀 Logger initialized');
  console.log(`📁 Log file stored at: ${consoleLogFilePath}`);

  isInitialized = true;
}

/**
 * Override console methods to capture output to file
 */
function overrideConsoleMethods() {
  // For the main process, we want to log to both files
  // The terminal logs will capture the original console output
  // The console logs will capture the Electron app console output

  console.log = function(...args) {
    // Log to terminal file first (this is the terminal output)
    logToTerminalFile('INFO', ...args);
    // Then call the original method (which will output to terminal)
    const result = originalConsoleLog.apply(console, args);
    return result;
  };

  console.info = function(...args) {
    logToTerminalFile('INFO', ...args);
    const result = originalConsoleInfo.apply(console, args);
    return result;
  };

  console.warn = function(...args) {
    logToTerminalFile('WARNING', ...args);
    const result = originalConsoleWarn.apply(console, args);
    return result;
  };

  console.error = function(...args) {
    logToTerminalFile('ERROR', ...args);
    const result = originalConsoleError.apply(console, args);
    return result;
  };
}

/**
 * Restore original console methods
 */
export function restoreConsoleMethods() {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
}

/**
 * Log to console.log file (for Electron app console)
 */
export function logToFile(level: string, ...args: any[]) {
  try {
    const timestamp = new Date().toISOString();

    // Format the message
    let message = `[${timestamp}] [${level}] `;

    // Process each argument
    args.forEach(arg => {
      if (typeof arg === 'object') {
        try {
          message += JSON.stringify(arg, null, 2);
        } catch (e) {
          message += `[Object: ${arg.toString()}]`;
        }
      } else if (typeof arg === 'string') {
        // Strip ANSI color codes for file logging
        message += arg.replace(/\x1b\[[0-9;]*m/g, '');
      } else {
        message += String(arg);
      }
      message += ' ';
    });

    // Append to console log file (for Electron app console)
    fs.appendFileSync(consoleLogFilePath, message + '\n');
  } catch (error) {
    // Use original console to avoid infinite recursion
    originalConsoleError(`Failed to write to console log file: ${error}`);
  }
}

/**
 * Log to terminal log file (for terminal output)
 */
export function logToTerminalFile(level: string, ...args: any[]) {
  try {
    const timestamp = new Date().toISOString();

    // Format the message
    let message = `[${timestamp}] [${level}] `;

    // Process each argument
    args.forEach(arg => {
      if (typeof arg === 'object') {
        try {
          message += JSON.stringify(arg, null, 2);
        } catch (e) {
          message += `[Object: ${arg.toString()}]`;
        }
      } else if (typeof arg === 'string') {
        // Strip ANSI color codes for file logging
        message += arg.replace(/\x1b\[[0-9;]*m/g, '');
      } else {
        message += String(arg);
      }
      message += ' ';
    });

    // Append to terminal log file (for terminal output)
    fs.appendFileSync(terminalLogFilePath, message + '\n');
  } catch (error) {
    // Use original console to avoid infinite recursion
    originalConsoleError(`Failed to write to terminal log file: ${error}`);
  }
}

/**
 * Get the path to the console log file
 */
export function getConsoleLogFilePath(): string {
  return consoleLogFilePath;
}

/**
 * Get the path to the terminal log file
 */
export function getTerminalLogFilePath(): string {
  return terminalLogFilePath;
}

// Styled console output helpers (similar to what's in main.ts)
export const c = {
  header: (text: string) => {
    return `${colors.bright}${colors.blue}${text}${colors.reset}`;
  },
  success: (text: string) => {
    return `${colors.bright}${colors.green}${text}${colors.reset}`;
  },
  warning: (text: string) => {
    return `${colors.bright}${colors.yellow}${text}${colors.reset}`;
  },
  error: (text: string) => {
    return `${colors.bright}${colors.red}${text}${colors.reset}`;
  },
  info: (text: string) => {
    return `${colors.white}${text}${colors.reset}`;
  },
  divider: () => {
    return `${colors.dim}-----------------------------------------------${colors.reset}`;
  },
  section: (emoji: string, text: string) => {
    return `${colors.bright}${colors.cyan}${emoji} ${text}${colors.reset}`;
  }
};

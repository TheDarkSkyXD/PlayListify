/**
 * This file contains utilities to capture console logs from the renderer process
 * It works with the logger utility to provide structured logging
 */

import { logger, LogLevel } from './logger';

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

/**
 * Format arguments for logging
 */
function formatArgs(args: any[]): string {
  try {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return '[Object]';
        }
      } else {
        return String(arg);
      }
    }).join(' ');
  } catch (error) {
    return '[Error formatting args]';
  }
}

/**
 * Send log to main process
 */
function sendLogToMain(level: string, ...args: any[]): void {
  try {
    // Format the message for file logging
    const formattedArgs = formatArgs(args);
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${level}] ${formattedArgs}`;

    // Try to send via IPC for file logging
    if ((window as any).api && (window as any).api.send) {
      try {
        // Send the log via IPC
        (window as any).api.send('renderer:log', { level, args: JSON.stringify(args) });
      } catch (ipcError) {
        // Silently fail
      }
    }
  } catch (error) {
    // Ignore all errors in the send function
  }
}

/**
 * Initialize console capture
 */
export function initConsoleCapture(): void {
  // Set the log level to INFO by default
  logger.setLogLevel(LogLevel.INFO);

  // Override console methods to capture output
  console.log = function(...args) {
    // Call original method first
    const result = originalConsoleLog.apply(console, args);

    // Send to main process for file logging
    sendLogToMain('INFO', ...args);

    return result;
  };

  console.info = function(...args) {
    // Call original method first
    const result = originalConsoleInfo.apply(console, args);

    // Send to main process for file logging
    sendLogToMain('INFO', ...args);

    return result;
  };

  console.warn = function(...args) {
    // Call original method first
    const result = originalConsoleWarn.apply(console, args);

    // Send to main process for file logging
    sendLogToMain('WARNING', ...args);

    return result;
  };

  console.error = function(...args) {
    // Call original method first
    const result = originalConsoleError.apply(console, args);

    // Send to main process for file logging
    sendLogToMain('ERROR', ...args);

    return result;
  };

  // Log that console capture is initialized
  logger.info('SYSTEM', 'Console capture initialized');
}

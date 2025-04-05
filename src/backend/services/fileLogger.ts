import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';

// Define the paths
let logsDir: string;
let consoleLogFilePath: string;

// Buffer for logs when file is locked
let logBuffer: string[] = [];
let isFileAccessible = true;
let flushInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

/**
 * Initialize the logger by setting up paths and clearing the console log file
 */
export function initFileLogger(): void {
  // Prevent multiple initializations
  if (isInitialized) return;

  try {
    // Just use the project root for simplicity
    logsDir = path.join(process.cwd(), 'logs');
    consoleLogFilePath = path.join(logsDir, 'consolelogs.txt');

    // Ensure the logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.ensureDirSync(logsDir);
    }

    // Check if we can write to the file
    try {
      // Try to clear the console log file
      fs.writeFileSync(consoleLogFilePath, `=== PlayListify Console Log - ${new Date().toISOString()} ===\n\n`);
      isFileAccessible = true;
    } catch (writeError) {
      // If we can't write to the file, it might be open in another program
      isFileAccessible = false;
    }

    // Set up a flush interval to periodically write buffered logs
    flushInterval = setInterval(() => flushLogBuffer(), 1000);

    // Mark as initialized
    isInitialized = true;
  } catch (error) {
    // If initialization fails, use memory only
    isFileAccessible = false;
    isInitialized = true;
  }
}

/**
 * Flush the log buffer to the file
 */
function flushLogBuffer(): void {
  if (logBuffer.length === 0) return;

  try {
    // Check if the logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.ensureDirSync(logsDir);
    }

    // Check if the file exists
    const fileExists = fs.existsSync(consoleLogFilePath);

    // If the file doesn't exist, create it
    if (!fileExists) {
      fs.writeFileSync(consoleLogFilePath, `=== PlayListify Console Log - ${new Date().toISOString()} ===\n\n`);
    }

    // Try to write the buffered logs to the file
    const logs = logBuffer.join('\n') + '\n';

    // Append to the file
    fs.appendFileSync(consoleLogFilePath, logs);

    // Clear the buffer if successful
    logBuffer = [];
    isFileAccessible = true;
  } catch (error) {
    isFileAccessible = false;

    // If the buffer gets too large, trim it to prevent memory issues
    if (logBuffer.length > 1000) {
      logBuffer = logBuffer.slice(-500); // Keep only the last 500 entries
    }
  }
}

/**
 * A utility to write logs to the consolelogs.txt file
 * If the file is locked, logs will be buffered and written later
 */
export function writeToConsoleLog(message: string): void {
  if (!isInitialized) {
    initFileLogger();
  }

  try {
    if (isFileAccessible) {
      // Try to write directly to the file
      try {
        fs.appendFileSync(consoleLogFilePath, message + '\n');
        return;
      } catch (error) {
        // If writing fails, fall back to buffering
        isFileAccessible = false;
      }
    }

    // Add to buffer if file is not accessible
    logBuffer.push(message);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Get the path to the console log file
 */
export function getConsoleLogFilePath(): string {
  return consoleLogFilePath;
}

/**
 * Clean up resources when the app is closing
 */
export function cleanupFileLogger(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
  }

  // Final flush of any buffered logs
  flushLogBuffer();
}

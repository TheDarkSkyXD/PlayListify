// Use try-catch for all requires to handle both main and renderer process
let fs;
let path;

try {
  fs = require('fs');
  path = require('path');
} catch (error) {
  console.error('Failed to require modules:', error);
}

// Only proceed if we have the required modules
if (fs && path) {
  // Get the logs directory
  const logsDir = path.join(process.cwd(), 'logs');
  const consoleLogFilePath = path.join(logsDir, 'consolelogs.txt');

  // Ensure the logs directory exists
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to create logs directory: ${error}`);
  }

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // Function to write to the console log file
  function writeToConsoleLog(level, ...args) {
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

      // Append to console log file
      fs.appendFileSync(consoleLogFilePath, message + '\n');
    } catch (error) {
      // Use original console to avoid infinite recursion
      originalConsoleError(`Failed to write to console log file: ${error}`);
    }
  }

  // Override console methods to capture output
  console.log = function(...args) {
    writeToConsoleLog('INFO', ...args);
    return originalConsoleLog.apply(console, args);
  };

  console.info = function(...args) {
    writeToConsoleLog('INFO', ...args);
    return originalConsoleInfo.apply(console, args);
  };

  console.warn = function(...args) {
    writeToConsoleLog('WARNING', ...args);
    return originalConsoleWarn.apply(console, args);
  };

  console.error = function(...args) {
    writeToConsoleLog('ERROR', ...args);
    return originalConsoleError.apply(console, args);
  };

  // Log that the direct logger has been loaded
  console.log('Direct logger initialized');
} else {
  console.error('Direct logger could not be initialized - missing required modules');
}

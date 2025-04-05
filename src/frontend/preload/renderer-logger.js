// This script will be injected into the renderer process to capture console logs
// and send them to the main process via IPC

// Function to initialize the logger
function initRendererLogger() {
  // Renderer logger initialization

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // Function to send logs to the main process
  function sendLogToMain(level, ...args) {
    try {
      // Try to use window.api if available
      if (window.api && window.api.send) {
        window.api.send('renderer:log', { level, args: JSON.stringify(args) });
      } else {
        // Fallback to direct fetch request if window.api is not available
        const timestamp = new Date().toISOString();
        let message = `[${timestamp}] [${level}] `;

        // Format the message
        args.forEach(arg => {
          if (typeof arg === 'object') {
            try {
              message += JSON.stringify(arg);
            } catch (e) {
              message += '[Object]';
            }
          } else {
            message += String(arg);
          }
          message += ' ';
        });

        // Send the log via fetch to a special endpoint
        fetch('app://app/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        }).catch(() => {
          // Ignore fetch errors
        });
      }
    } catch (error) {
      // Ignore errors in sending
    }
  }

  // Override console methods to capture output
  console.log = function(...args) {
    // Send to main process
    sendLogToMain('INFO', ...args);
    // Call original method
    return originalConsoleLog.apply(console, args);
  };

  console.info = function(...args) {
    // Send to main process
    sendLogToMain('INFO', ...args);
    // Call original method
    return originalConsoleInfo.apply(console, args);
  };

  console.warn = function(...args) {
    // Send to main process
    sendLogToMain('WARNING', ...args);
    // Call original method
    return originalConsoleWarn.apply(console, args);
  };

  console.error = function(...args) {
    // Send to main process
    sendLogToMain('ERROR', ...args);
    // Call original method
    return originalConsoleError.apply(console, args);
  };

  // Logger initialized
}

// Initialize immediately
initRendererLogger();

// Also wait for DOMContentLoaded in case the script is loaded before the DOM
window.addEventListener('DOMContentLoaded', initRendererLogger);

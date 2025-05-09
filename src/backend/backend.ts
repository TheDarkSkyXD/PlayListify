import * as fs from 'fs';
import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { registerFileHandlers } from './ipc/fileHandlers';

let mainWindow: BrowserWindow | null;

// --- START LOGGING SETUP ---
const logsDirName = 'Console Logs';
// Use app.getPath('userData') for logs in production, or process.cwd() for development flexibility
// For simplicity in this immediate request, we'll use process.cwd() and create 'Console Logs' there.
// A more robust solution would differentiate between dev and prod.
const projectRoot = process.cwd(); // Or use app.getAppPath() once app is ready
const logsDirPath = path.join(projectRoot, logsDirName);
const logFilePath = path.join(logsDirPath, 'terminallogs.txt');

// Ensure logs directory exists
try {
  if (!fs.existsSync(logsDirPath)) {
    fs.mkdirSync(logsDirPath, { recursive: true });
  }
} catch (error) {
  // Fallback to original console if directory creation fails
  console.error('[Logger] Failed to create logs directory:', error);
}

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

function writeToLogFile(level: string, ...args: any[]) {
  try {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Unserializable Object]';
        }
      }
      return String(arg);
    }).join(' ');
    const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    // If logging to file fails, still output to original console
    originalConsole.error('[Logger] Failed to write to log file:', error);
  }
}

console.log = (...args: any[]) => {
  originalConsole.log(...args);
  writeToLogFile('log', ...args);
};
console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  writeToLogFile('warn', ...args);
};
console.error = (...args: any[]) => {
  originalConsole.error(...args);
  writeToLogFile('error', ...args);
};
console.info = (...args: any[]) => {
  originalConsole.info(...args);
  writeToLogFile('info', ...args);
};
console.debug = (...args: any[]) => {
  originalConsole.debug(...args);
  writeToLogFile('debug', ...args);
};

// Initial log message to confirm setup
console.log('[Logger] Console logging to file initialized.');
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // @ts-ignore - Webpack constant injected by Electron Forge, type checker doesn't see it
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // Use the Electron Forge Webpack constant
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the URL
  // @ts-ignore - Webpack constant injected by Electron Forge, type checker doesn't see it
  const urlToLoad = MAIN_WINDOW_WEBPACK_ENTRY;
    
  try {
    await mainWindow.loadURL(urlToLoad);
  } catch (error) {
    console.error(`Failed to load URL: ${urlToLoad}`, error);
    // Handle loading error appropriately, maybe show an error page or message
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', () => {
  createWindow();
  registerSettingsHandlers();
  registerFileHandlers();
  // Register other IPC handlers as they are created
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Basic IPC setup example (will be expanded in Phase 1.6)
// import './ipc/appHandlers'; // Commented out for now 
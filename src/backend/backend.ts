import fs from 'fs-extra'; // Use fs-extra consistently
import * as path from 'path';
import { app, BrowserWindow, session, shell } from 'electron';
import { initializeDB } from './databases/db'; // Import initializeDB
import { registerSettingsHandlers } from './ipc/settings-handlers';
import { registerFileHandlers } from './ipc/file-handlers';
import { registerAppHandlers } from './ipc/app-handlers';
import { registerDownloadHandlers } from './ipc/download-handlers';
import { registerPlaylistHandlers } from './ipc/playlist-handlers';
import { registerThumbnailHandlers } from './ipc/thumbnail-handlers';
import { registerYtDlpHandlers } from './ipc/yt-dlp-handlers';
import { registerShellHandlers } from './ipc/shell-handlers';

let mainWindow: BrowserWindow | null;

// --- START LOGGING SETUP ---
const logsDirName = 'Console Logs';
// Use app.getPath('userData') for logs in production, or process.cwd() for development flexibility
// For simplicity in this immediate request, we'll use process.cwd() and create 'Console Logs' there.
// A more robust solution would differentiate between dev and prod.
const logsDirPath = path.join(app.getPath('userData'), logsDirName);
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

// Clear the log file at startup
if (fs.existsSync(logFilePath)) { // Check before attempting to unlink
try {
    fs.unlinkSync(logFilePath);
} catch (error) {
  console.error('[Logger] Failed to clear log file:', error);
  }
}

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

async function writeToLogFile(level: string, ...args: any[]) {
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
    // Use asynchronous appendFile
    await fs.promises.appendFile(logFilePath, logMessage);
  } catch (error) {
    // If logging to file fails, still output to original console
    originalConsole.error('[Logger] Failed to write to log file asynchronously:', error);
  }
}

console.log = (...args: any[]) => {
  originalConsole.log(...args);
  writeToLogFile('log', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  writeToLogFile('warn', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.error = (...args: any[]) => {
  originalConsole.error(...args);
  writeToLogFile('error', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.info = (...args: any[]) => {
  originalConsole.info(...args);
  writeToLogFile('info', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.debug = (...args: any[]) => {
  originalConsole.debug(...args);
  writeToLogFile('debug', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
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
  let urlToLoad = MAIN_WINDOW_WEBPACK_ENTRY;
  
  // Ensure the base URL for the main window ends with a slash
  // This helps with root path matching in client-side routers like TanStack Router
  if (urlToLoad.endsWith('/main_window')) {
    urlToLoad += '/';
  }
    
  try {
    await mainWindow.loadURL(urlToLoad);
  } catch (error) {
    console.error(`Failed to load URL: ${urlToLoad}`, error);
    // Handle loading error appropriately, maybe show an error page or message
  }

  // Handle requests to open new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Check if the URL is external (http or https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // If it is, open it in the system's default browser
      setImmediate(() => { // Use setImmediate to avoid potential issues with sync shell.openExternal in handler
        shell.openExternal(url).catch(err =>
          console.error('[WindowOpenHandler] Failed to open URL:', err)
        );
      });
      console.info(`[WindowOpenHandler] Opening external URL in default browser: ${url}`);
      // And prevent Electron from creating a new window for it
      return { action: 'deny' };
    }

    // Block potentially unsafe URLs like javascript: or file://
    // Add any other schemes you explicitly want to allow or deny.
    // For now, we default to denying anything not http/https.
    if (url.startsWith('javascript:') || url.startsWith('file:') || url.startsWith('blob:') || url.startsWith('data:')) {
      console.warn(`[WindowOpenHandler] Blocked potentially unsafe URL scheme: ${url}`);
      return { action: 'deny' };
    }
    
    // If we haven't explicitly denied it, and it's not http/https, then what is it?
    // It might be an internal protocol or something specific to Electron/Webpack during development.
    // For stricter security, one might default to deny here and explicitly whitelist internal URLs.
    // For now, we'll log a warning for unhandled schemes but still deny them to be safe.
    // If you find legitimate internal URLs are being blocked, they should be added to an allow-list.
    console.warn(`[WindowOpenHandler] Denying unhandled URL scheme: ${url}. If this URL is legitimate, consider adding it to an allow-list.`);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

function handleDevelopmentAssets() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DevAssets] In development mode, checking for assets to handle.');
    // Example: Copying assets from a './dev_assets' directory to userData for testing
    // This is just a placeholder. Actual implementation depends on specific needs.
    const sourceDir = path.join(process.cwd(), 'dev_specific_assets'); // Example source
    const destDir = path.join(app.getPath('userData'), 'dev_copied_assets'); // Example destination

    try {
      if (fs.existsSync(sourceDir)) {
        fs.copySync(sourceDir, destDir, { overwrite: true });
        console.log(`[DevAssets] Copied assets from ${sourceDir} to ${destDir}`);
      } else {
        console.log(`[DevAssets] Source directory not found, no assets copied: ${sourceDir}`);
      }
    } catch (error) {
      console.error(`[DevAssets] Error copying development assets:`, error);
    }
  }
}

app.on('ready', async () => {
  // Initialize the database first
  try {
    await initializeDB();
    console.log('[Backend] Database initialized successfully.');
  } catch (dbError) {
    console.error('[Backend] CRITICAL: Database initialization failed. Application might not function correctly.', dbError);
    // Optionally, you could show an error dialog to the user and quit the app
    // For example: dialog.showErrorBox('Database Error', 'Failed to initialize the database. The application will now close.');
    // app.quit();
    // return; // Prevent further execution if DB init fails critically
  }

  // Configure CSP when the default session is ready
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const newHeaders = { ...details.responseHeaders };
    newHeaders['Content-Security-Policy'] = [
      [
        `default-src 'self';`,
        `script-src 'self' ${isDevelopment ? "'unsafe-eval'" : "''"};`,
        `style-src 'self' 'unsafe-inline';`,
        `font-src 'self' data:;`,
        `img-src 'self' data: https://*.ytimg.com https://*.youtube.com https://via.placeholder.com https://lh3.googleusercontent.com;`,
        `connect-src 'self';`,
        `media-src 'self' blob: data:;`,
        `object-src 'none';`,
        `frame-src 'self' https://www.youtube.com;`
      ].join(' ').trim() // Join all directives into a single string policy
    ];

    callback({ responseHeaders: newHeaders });
  });
  
  await createWindow();
  handleDevelopmentAssets();

  // Register IPC Handlers after window and session setup if they depend on mainWindow or session features
  // If they don't, their current placement is fine.
  registerSettingsHandlers();
  registerFileHandlers();
  registerAppHandlers();
  registerDownloadHandlers();
  registerPlaylistHandlers();
  registerThumbnailHandlers();
  registerYtDlpHandlers();
  registerShellHandlers();
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
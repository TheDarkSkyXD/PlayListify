import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { initYtDlp } from './services/ytDlpManager';
import { registerIpcHandlers } from './ipc/handlers';
import { initializeSettings } from './services/settingsManager';
import { initializeDatabase } from './services/playlistServiceProvider';
import { initializeDatabaseAndMigrate } from './services/migrationManager';
import { runDatabaseOptimization } from './services/databaseManager';
import { downloadManager } from './services/downloadManager/index';
import fs from 'fs-extra';
import { initLogger, c as loggerC, logToFile, getTerminalLogFilePath } from './services/logger';
import { writeToConsoleLog, initFileLogger, cleanupFileLogger } from './services/fileLogger';
import { initFFmpeg } from './services/ytDlp/binary';

// These are injected by Electron Forge's Webpack plugin
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Use the logger's styled console output helpers
const c = loggerC;

export let mainWindow: BrowserWindow | null = null;

// Ensure static assets folder for development
export async function ensureDevAssets() {
  if (process.env.NODE_ENV === 'development') {
    // Create assets directory for development server - try multiple possible locations
    const devAssetsDirs = [
      path.join(process.cwd(), 'dist', 'assets', 'images'),
      path.join(process.cwd(), '.webpack', 'renderer', 'assets', 'images'),
      path.join(process.cwd(), '.webpack', 'main', 'assets', 'images')
    ];

    // Copy default playlist image to all potential asset directories
    const srcImage = path.join(process.cwd(), 'public', 'assets', 'images', 'playlist-default.jpg');

    for (const dir of devAssetsDirs) {
      await fs.ensureDir(dir);
      const destImage = path.join(dir, 'playlist-default.jpg');

      if (await fs.pathExists(srcImage)) {
        await fs.copy(srcImage, destImage, { overwrite: true });
        console.log('Default playlist image copied to:', dir);
      } else {
        console.warn('Could not find default playlist image at:', srcImage);
      }
    }

    // Also, create the assets directory directly in the current working directory
    // as the dev server might serve from the root
    const rootAssetsDir = path.join(process.cwd(), 'assets', 'images');
    await fs.ensureDir(rootAssetsDir);
    const rootDestImage = path.join(rootAssetsDir, 'playlist-default.jpg');

    if (await fs.pathExists(srcImage)) {
      await fs.copy(srcImage, rootDestImage, { overwrite: true });
      console.log('Default playlist image copied to root assets folder');
    }
  }
}

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: true,
    },
  });

  // Load the renderer logger script in the renderer process
  // Make sure mainWindow is not null before accessing its properties
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      // Get the path to the renderer-logger.js file
      const rendererLoggerPath = path.join(__dirname, 'renderer-logger.js');

      // Read the renderer-logger.js file
      try {
        const rendererLoggerContent = fs.readFileSync(rendererLoggerPath, 'utf8');

        // Inject the renderer-logger.js script directly
        // Check again that mainWindow is not null (it could have been closed during the file read)
        if (mainWindow) {
          mainWindow.webContents.executeJavaScript(rendererLoggerContent)
            .then(() => {
              console.log('Renderer logger script injected successfully');

              // Logger script injected successfully
            })
            .catch(error => {
              console.error('Failed to inject renderer logger script:', error);
            });
        } else {
          console.error('mainWindow is null when trying to inject script');
        }
      } catch (error) {
        console.error('Failed to read renderer logger script:', error);
      }
    });
  } else {
    console.error('mainWindow is null when trying to set up did-finish-load handler');
  }

  // Set Content Security Policy to allow YouTube domains and app:// protocol
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: https://*.youtube.com https://www.youtube.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.youtube.com https://www.youtube.com https://s.ytimg.com https://www.google.com https://static.doubleclick.net https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.gstatic.com; " +
          "img-src 'self' data: https://* http://* blob:; " +
          "media-src 'self' https://* http://* blob:; " +
          "connect-src 'self' https://* http://* blob: app:; " +
          "frame-src 'self' https://*.youtube.com https://www.youtube.com https://*.doubleclick.net https://googleads.g.doubleclick.net; " +
          "font-src 'self' data: https://*.youtube.com https://www.youtube.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "style-src 'self' 'unsafe-inline' https://*.youtube.com https://www.youtube.com https://fonts.googleapis.com;"
        ]
      }
    });
  });

  // Load the entry point
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize the application
app.whenReady().then(async () => {
  // Initialize loggers first
  initLogger(); // For terminal logs
  initFileLogger(); // For console logs
  console.log('\n');
  console.log(`Terminal logs are being saved to: ${getTerminalLogFilePath()}`);
  console.log('\n');



  // Initialize application
  c.section('🛠️', 'INITIALIZING ELECTRON APPLICATION');

  // Initialize settings before creating window
  c.info('⚙️  Loading application settings...');
  initializeSettings();
  c.success('✅ Settings initialized successfully');

  // Initialize database and run migration if needed
  c.info('🗄️  Initializing database...');
  initializeDatabase();
  await initializeDatabaseAndMigrate();

  // Optimize database for better performance
  c.info('🔧 Optimizing database...');
  if (runDatabaseOptimization()) {
    c.success('✅ Database optimized successfully');
  } else {
    c.warning('⚠️ Database optimization failed, continuing anyway');
  }

  c.success('✅ Database initialized successfully');

  // Ensure development assets
  c.info('\n📂 Checking development assets...');
  await ensureDevAssets();
  c.success('✅ Development assets verified');

  // Initialize yt-dlp - our setup script has already installed it if needed
  console.log('\n');
  c.section('🔌', 'INITIALIZING EXTERNAL DEPENDENCIES');
  try {
    // Check if there's a custom yt-dlp path
    const customYtDlpPath = path.join(process.cwd(), 'ytdlp', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(customYtDlpPath)) {
      c.info('🎬 yt-dlp: Custom installation detected');
      c.info(`📂 Path: ${customYtDlpPath}`);
      await initYtDlp(customYtDlpPath);
      c.success('✅ yt-dlp initialized successfully with custom binary');
    } else {
      c.info('🎬 yt-dlp: Using system installation');
      await initYtDlp();
      c.success('✅ yt-dlp initialized with system binary');
    }
  } catch (error) {
    c.error(`❌ yt-dlp initialization failed: ${error}`);
    c.warning('⚠️ YouTube features will be limited');
  }

  // Initialize FFmpeg
  try {
    c.info('🎬 FFmpeg: Checking installation...');
    const ffmpegPath = await initFFmpeg();

    if (ffmpegPath) {
      if (ffmpegPath === 'ffmpeg') {
        c.success('✅ FFmpeg initialized successfully from system PATH');
      } else {
        c.success(`✅ FFmpeg initialized successfully from: ${ffmpegPath}`);
      }
    } else {
      c.warning('⚠️ FFmpeg not found, will be downloaded when needed');
      c.info('ℹ️ Video downloads will use best single format until FFmpeg is available');
    }
  } catch (error) {
    c.error(`❌ FFmpeg initialization failed: ${error}`);
    c.warning('⚠️ Some video download features will be limited');
  }

  // Create the main window
  console.log('\n');
  c.section('🖥️', 'CREATING APPLICATION WINDOW');
  c.info('🔄 Preparing main application window...');
  createWindow();
  c.success('✅ Application window created successfully');

  // Initialize the download manager and set the main window
  if (mainWindow) {
    try {
      // First initialize the download manager
      downloadManager.initialize();
      c.info('🔄 Download manager initialized');
      logToFile('INFO', 'Download manager initialized in main.ts');

      // Then set the main window
      downloadManager.setMainWindow(mainWindow);
      c.info('🔄 Download manager configured with main window');
      logToFile('INFO', 'Download manager configured with main window in main.ts');

      // Log the current state of the download manager
      const downloads = downloadManager.getAllDownloads();
      c.info(`🔄 Download manager has ${downloads.length} downloads`);
      logToFile('INFO', `Download manager has ${downloads.length} downloads in main.ts`);

      // Verify the download manager is initialized
      if (!downloadManager.isInitialized()) {
        c.error('❌ Download manager is not initialized after initialization call');
        logToFile('ERROR', 'Download manager is not initialized after initialization call in main.ts');
      }
    } catch (error) {
      c.error(`❌ Error initializing download manager: ${error}`);
      logToFile('ERROR', `Error initializing download manager in main.ts: ${error}`);
    }
  } else {
    c.error('❌ Main window is null, cannot configure download manager');
    logToFile('ERROR', 'Main window is null, cannot configure download manager in main.ts');
  }

  // Register IPC handlers
  c.info('\n🔌 Setting up IPC communication...');
  registerIpcHandlers();

  // Set up IPC handler for console logs from renderer process
  ipcMain.on('console:log', (_event, level, ...args) => {
    // Log to console log file (Electron app console)
    logToFile(level, ...args);
  });

  // Set up IPC handler for renderer logs
  ipcMain.on('renderer:log', (_event, data) => {
    try {
      // Extract level and args from the data
      const { level, args } = data;

      // Parse the args
      let parsedArgs;
      try {
        parsedArgs = JSON.parse(args);
      } catch (error) {
        parsedArgs = [args];
      }

      // Format the log message
      const timestamp = new Date().toISOString();
      let message = `[${timestamp}] [${level}] `;

      // Add each argument to the message
      if (Array.isArray(parsedArgs)) {
        parsedArgs.forEach(arg => {
          if (typeof arg === 'object') {
            try {
              message += JSON.stringify(arg);
            } catch (e) {
              message += `[Object]`;
            }
          } else {
            message += String(arg);
          }
          message += ' ';
        });
      } else {
        message += String(parsedArgs);
      }

      // Write to the console log file
      writeToConsoleLog(message);
    } catch (error) {
      // Silently fail
    }
  });

  // Set up a special endpoint for logs from the renderer process
  // This is used as a fallback when window.api is not available
  try {
    // Register the protocol
    session.defaultSession.protocol.registerStringProtocol('app', (request, callback) => {
      try {
        const url = new URL(request.url);

        // Handle log requests
        if (url.pathname === '/api/log') {
          try {
            // Parse the request body
            const body = JSON.parse(request.uploadData?.[0]?.bytes.toString() || '{}');
            const { message } = body;

            // Write to the console log file
            if (message) {
              writeToConsoleLog(message);
            }
          } catch (error) {
            // Silently fail
          }

          // Return a success response
          callback({ data: 'ok' });
          return;
        }

        // Return a 404 for other requests
        callback({ data: 'Not found', statusCode: 404 });
      } catch (error) {
        callback({ data: 'Error', statusCode: 500 });
      }
    });
  } catch (protocolError) {
    // Silently fail
  }

  c.success('✅ IPC handlers registered');

  console.log('\n');
  c.section('🎉', 'APPLICATION READY');
  c.success('✨ PlayListify is now running');
  c.info(`⏱️  Started at: ${new Date().toLocaleTimeString()}`);
  console.log('\n');

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up resources when the app is closing
app.on('will-quit', () => {
  console.log('App is closing, cleaning up resources...');

  // Clean up file logger
  cleanupFileLogger();
});
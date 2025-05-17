/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/backend/backend.ts":
/*!********************************!*\
  !*** ./src/backend/backend.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function () {
  var ownKeys = function (o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
      var ar = [];
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
  };
}();
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra")); // Use fs-extra consistently
const path = __importStar(__webpack_require__(/*! path */ "path"));
const electron_1 = __webpack_require__(/*! electron */ "electron");
const db_1 = __webpack_require__(/*! ./databases/db */ "./src/backend/databases/db.ts"); // Import initializeDB
const settings_handlers_1 = __webpack_require__(/*! ./ipc/settings-handlers */ "./src/backend/ipc/settings-handlers.ts");
const file_handlers_1 = __webpack_require__(/*! ./ipc/file-handlers */ "./src/backend/ipc/file-handlers.ts");
const app_handlers_1 = __webpack_require__(/*! ./ipc/app-handlers */ "./src/backend/ipc/app-handlers.ts");
const download_handlers_1 = __webpack_require__(/*! ./ipc/download-handlers */ "./src/backend/ipc/download-handlers.ts");
const playlist_handlers_1 = __webpack_require__(/*! ./ipc/playlist-handlers */ "./src/backend/ipc/playlist-handlers.ts");
const thumbnail_handlers_1 = __webpack_require__(/*! ./ipc/thumbnail-handlers */ "./src/backend/ipc/thumbnail-handlers.ts");
const yt_dlp_handlers_1 = __webpack_require__(/*! ./ipc/yt-dlp-handlers */ "./src/backend/ipc/yt-dlp-handlers.ts");
const shell_handlers_1 = __webpack_require__(/*! ./ipc/shell-handlers */ "./src/backend/ipc/shell-handlers.ts");
let mainWindow;
// --- START LOGGING SETUP ---
const logsDirName = 'Console Logs';
let logFilePath; // Deferred initialization
let logBuffer = [];
let isLogStreamInitialized = false;
// Ensure logs directory exists - This will be done in initializeLogStream
// try {
//   if (!fs.existsSync(logsDirPath)) {
//     fs.mkdirSync(logsDirPath, { recursive: true });
//   }
// } catch (error) {
//   // Fallback to original console if directory creation fails
//   console.error('[Logger] Failed to create logs directory:', error);
// }
// Clear the log file at startup - This will be done in initializeLogStream
// if (fs.existsSync(logFilePath)) { // Check before attempting to unlink
// try {
//     fs.unlinkSync(logFilePath);
// } catch (error) {
//   console.error('[Logger] Failed to clear log file:', error);
//   }
// }
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};
async function initializeLogStream() {
  if (isLogStreamInitialized) return;
  try {
    const userDataPath = electron_1.app.getPath('userData');
    if (!userDataPath) {
      originalConsole.error('[Logger] Failed to get userData path. Logging to file will be disabled.');
      isLogStreamInitialized = true; // Prevent further attempts
      // Optionally, process any buffered logs to originalConsole only
      logBuffer.forEach(entry => originalConsole[entry.level](...entry.args));
      logBuffer = []; // Clear buffer
      return;
    }
    const logsDirPath = path.join(userDataPath, logsDirName);
    logFilePath = path.join(logsDirPath, 'terminallogs.txt');
    if (!fs_extra_1.default.existsSync(logsDirPath)) {
      fs_extra_1.default.mkdirSync(logsDirPath, {
        recursive: true
      });
    }
    // Clear the log file at startup
    if (fs_extra_1.default.existsSync(logFilePath)) {
      fs_extra_1.default.unlinkSync(logFilePath);
    }
    globalThis._logStream = fs_extra_1.default.createWriteStream(logFilePath, {
      flags: 'a'
    });
    isLogStreamInitialized = true;
    originalConsole.log(`[Logger] Log stream initialized. Path: ${logFilePath}`);
    // Flush buffered logs
    const bufferToFlush = [...logBuffer];
    logBuffer = []; // Clear buffer before writing to prevent race conditions if new logs come in
    for (const entry of bufferToFlush) {
      await writeToLogFileInternal(entry.level, ...entry.args);
    }
    originalConsole.log('[Logger] Flushed buffered logs.');
  } catch (error) {
    originalConsole.error('[Logger] CRITICAL: Failed to initialize log stream or flush buffer:', error);
    isLogStreamInitialized = true; // Mark as initialized to prevent retries, even on failure
    // Log remaining buffer to original console if stream setup failed
    logBuffer.forEach(entry => originalConsole[entry.level](...entry.args));
    logBuffer = [];
  }
}
async function writeToLogFileInternal(level) {
  // This internal function assumes _logStream is initialized and logFilePath is set
  if (!globalThis._logStream || !logFilePath) {
    originalConsole.error('[Logger Internal Error] Attempted to write with uninitialized stream/path.');
    return;
  }
  try {
    const timestamp = new Date().toISOString();
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
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
    globalThis._logStream.write(logMessage);
  } catch (error) {
    // If logging to file fails, still output to original console
    originalConsole.error('[Logger] Failed to write to log file (internal):', error);
  }
}
async function writeToLogFile(level) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  if (!isLogStreamInitialized) {
    logBuffer.push({
      level,
      args
    });
    // If app is already ready, try to initialize. Otherwise, it will be called on 'ready'.
    // This handles logs that might occur between app start and 'ready' event.
    if (electron_1.app.isReady() && !globalThis._logStream) {
      // Check _logStream to prevent race if already initializing
      initializeLogStream().catch(originalConsole.error);
    }
    return; // Buffering, actual write will happen after stream init
  }
  // If stream is initialized, write directly
  if (globalThis._logStream) {
    await writeToLogFileInternal(level, ...args);
  } else {
    // Should not happen if isLogStreamInitialized is true and init was successful
    // but as a fallback, log to original console.
    originalConsole.error('[Logger] Log stream marked initialized but is not available. Logging to console only for:', level, ...args);
  }
}
console.log = function () {
  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }
  originalConsole.log(...args);
  writeToLogFile('log', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.warn = function () {
  for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }
  originalConsole.warn(...args);
  writeToLogFile('warn', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.error = function () {
  for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }
  originalConsole.error(...args);
  writeToLogFile('error', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.info = function () {
  for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    args[_key6] = arguments[_key6];
  }
  originalConsole.info(...args);
  writeToLogFile('info', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
console.debug = function () {
  for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
    args[_key7] = arguments[_key7];
  }
  originalConsole.debug(...args);
  writeToLogFile('debug', ...args).catch(originalConsole.error); // Non-blocking, catch potential errors
};
// Initial log message to confirm setup
console.log('[Logger] Console logging to file initialized.');
// --- END LOGGING SETUP ---
async function createWindow() {
  mainWindow = new electron_1.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // @ts-ignore - Webpack constant injected by Electron Forge, type checker doesn't see it
      preload: 'F:\\My Github Repos\\Open Source Repos\\Playlistify\\.webpack\\renderer\\main_window\\preload.js',
      // Use the Electron Forge Webpack constant
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  // Load the URL
  // @ts-ignore - Webpack constant injected by Electron Forge, type checker doesn't see it
  let urlToLoad = 'http://localhost:3000/main_window';
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
  mainWindow.webContents.setWindowOpenHandler(_ref => {
    let {
      url
    } = _ref;
    // Check if the URL is external (http or https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // If it is, open it in the system's default browser
      setImmediate(() => {
        electron_1.shell.openExternal(url).catch(err => console.error('[WindowOpenHandler] Failed to open URL:', err));
      });
      console.info(`[WindowOpenHandler] Opening external URL in default browser: ${url}`);
      // And prevent Electron from creating a new window for it
      return {
        action: 'deny'
      };
    }
    // Block potentially unsafe URLs like javascript: or file://
    // Add any other schemes you explicitly want to allow or deny.
    // For now, we default to denying anything not http/https.
    if (url.startsWith('javascript:') || url.startsWith('file:') || url.startsWith('blob:') || url.startsWith('data:')) {
      console.warn(`[WindowOpenHandler] Blocked potentially unsafe URL scheme: ${url}`);
      return {
        action: 'deny'
      };
    }
    // If we haven't explicitly denied it, and it's not http/https, then what is it?
    // It might be an internal protocol or something specific to Electron/Webpack during development.
    // For stricter security, one might default to deny here and explicitly whitelist internal URLs.
    // For now, we'll log a warning for unhandled schemes but still deny them to be safe.
    // If you find legitimate internal URLs are being blocked, they should be added to an allow-list.
    console.warn(`[WindowOpenHandler] Denying unhandled URL scheme: ${url}. If this URL is legitimate, consider adding it to an allow-list.`);
    return {
      action: 'deny'
    };
  });
  mainWindow.on('closed', () => mainWindow = null);
}
function handleDevelopmentAssets() {
  if (true) {
    console.log('[DevAssets] In development mode, checking for assets to handle.');
    // Example: Copying assets from a './dev_assets' directory to userData for testing
    // This is just a placeholder. Actual implementation depends on specific needs.
    const sourceDir = path.join(process.cwd(), 'dev_specific_assets'); // Example source
    const destDir = path.join(electron_1.app.getPath('userData'), 'dev_copied_assets'); // Example destination
    try {
      if (fs_extra_1.default.existsSync(sourceDir)) {
        fs_extra_1.default.copySync(sourceDir, destDir, {
          overwrite: true
        });
        console.log(`[DevAssets] Copied assets from ${sourceDir} to ${destDir}`);
      } else {
        console.log(`[DevAssets] Source directory not found, no assets copied: ${sourceDir}`);
      }
    } catch (error) {
      console.error(`[DevAssets] Error copying development assets:`, error);
    }
  }
}
electron_1.app.on('ready', async () => {
  // Initialize the log stream first
  await initializeLogStream(); // Ensure logger is ready before other operations that might log
  // Initialize the database first
  try {
    await (0, db_1.initializeDB)();
    console.log('[Backend] Database initialized successfully.');
  } catch (dbError) {
    console.error('[Backend] CRITICAL: Database initialization failed. Application might not function correctly.', dbError);
    // Optionally, you could show an error dialog to the user and quit the app
    // For example: dialog.showErrorBox('Database Error', 'Failed to initialize the database. The application will now close.');
    // app.quit();
    // return; // Prevent further execution if DB init fails critically
  }
  // Configure CSP when the default session is ready
  electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDevelopment = "development" === 'development';
    const newHeaders = {
      ...details.responseHeaders
    };
    newHeaders['Content-Security-Policy'] = [[`default-src 'self';`, `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ''};`, `style-src 'self' 'unsafe-inline';`, `font-src 'self' data:;`, `img-src 'self' data: https://*.ytimg.com https://*.youtube.com https://via.placeholder.com https://lh3.googleusercontent.com;`, `connect-src 'self';`, `media-src 'self' blob: data:;`, `object-src 'none';`, `frame-src 'self' https://www.youtube.com;`].join(' ').trim() // Join all directives into a single string policy
    ];
    callback({
      responseHeaders: newHeaders
    });
  });
  await createWindow();
  handleDevelopmentAssets();
  // Register IPC Handlers after window and session setup if they depend on mainWindow or session features
  // If they don't, their current placement is fine.
  (0, settings_handlers_1.registerSettingsHandlers)();
  (0, file_handlers_1.registerFileHandlers)();
  (0, app_handlers_1.registerAppHandlers)();
  (0, download_handlers_1.registerDownloadHandlers)();
  (0, playlist_handlers_1.registerPlaylistHandlers)();
  (0, thumbnail_handlers_1.registerThumbnailHandlers)();
  (0, yt_dlp_handlers_1.registerYtDlpHandlers)();
  (0, shell_handlers_1.registerShellHandlers)();
  // Register other IPC handlers as they are created
});
electron_1.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron_1.app.quit();
  }
});
electron_1.app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
// Basic IPC setup example (will be expanded in Phase 1.6)
// import './ipc/appHandlers'; // Commented out for now

/***/ }),

/***/ "./src/backend/databases/db.ts":
/*!*************************************!*\
  !*** ./src/backend/databases/db.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initializeDB = initializeDB;
exports.getDB = getDB;
exports.closeDB = closeDB;
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra"));
const electron_1 = __webpack_require__(/*! electron */ "electron");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
let dbInstance = null;
const MIGRATIONS_DIR_NAME = 'migrations';
const better_sqlite3_1 = __importDefault(__webpack_require__(/*! better-sqlite3 */ "better-sqlite3"));
function applyMigrations(db, migrationsPath) {
  logger_1.logger.info('[DB Migrations] Starting migration check...');
  // --- TEMPORARY DEBUG LOGGING ---
  // const specificMigrationFile = '001_add_sourceurl_to_playlists.sql';
  // const specificMigrationPath = path.join(migrationsPath, specificMigrationFile);
  // if (fsExtra.existsSync(specificMigrationPath)) {
  //   logger.info(`[DB Migrations - DEBUG] CONFIRMED: Migration file exists at: ${specificMigrationPath}`);
  // } else {
  //   logger.error(`[DB Migrations - DEBUG] NOT FOUND: Migration file NOT found at: ${specificMigrationPath}`);
  //   // Log contents of the migrations directory if it exists
  //   if (fsExtra.existsSync(migrationsPath)) {
  //     try {
  //       const filesInDir = fsExtra.readdirSync(migrationsPath);
  //       logger.info(`[DB Migrations - DEBUG] Files in migrations dir (${migrationsPath}): ${filesInDir.join(', ')}`);
  //     } catch (readDirError: any) {
  //       logger.error(`[DB Migrations - DEBUG] Error reading migrations directory ${migrationsPath}: ${readDirError.message}`);
  //     }
  //   } else {
  //     logger.error(`[DB Migrations - DEBUG] Migrations directory itself also not found at ${migrationsPath}`);
  //   }
  // }
  // --- END TEMPORARY DEBUG LOGGING ---
  try {
    if (!fs_extra_1.default.existsSync(migrationsPath)) {
      logger_1.logger.info(`[DB Migrations] Migrations directory not found at ${migrationsPath}, skipping migrations.`);
      fs_extra_1.default.ensureDirSync(migrationsPath);
      logger_1.logger.info(`[DB Migrations] Created migrations directory at ${migrationsPath}.`);
      // continue to look for migration files (there may already be some on disk)
    }
    const migrationFiles = fs_extra_1.default.readdirSync(migrationsPath).filter(file => file.endsWith('.sql')).sort(); // Ensure migrations are applied in order
    if (migrationFiles.length === 0) {
      logger_1.logger.info('[DB Migrations] No migration files found, skipping migrations.');
      return;
    }
    // Check for user_version pragma. If not set, initialize to 0.
    let currentVersion = db.pragma('user_version', {
      simple: true
    });
    if (currentVersion === undefined || currentVersion === null) {
      // SQLite might return null
      logger_1.logger.info('[DB Migrations] user_version not set, initializing to 0.');
      db.pragma(`user_version = 0`);
      currentVersion = 0;
    }
    logger_1.logger.info(`[DB Migrations] Current database schema version: ${currentVersion}`);
    for (const file of migrationFiles) {
      const fileVersion = parseInt(file.split('_')[0]);
      if (isNaN(fileVersion)) {
        logger_1.logger.warn(`[DB Migrations] Migration file ${file} has an invalid version prefix. Skipping.`);
        continue;
      }
      if (fileVersion > currentVersion) {
        logger_1.logger.info(`[DB Migrations] Applying migration: ${file}`);
        try {
          const migrationSql = fs_extra_1.default.readFileSync(path_1.default.join(migrationsPath, file), 'utf-8');
          db.exec(migrationSql); // Execute the whole SQL file
          db.pragma(`user_version = ${fileVersion}`); // Update schema version
          logger_1.logger.info(`[DB Migrations] Successfully applied ${file}. Database schema version now: ${fileVersion}`);
        } catch (err) {
          logger_1.logger.error(`[DB Migrations] Error applying migration ${file}: ${err.message}`);
          // Decide on error handling: stop all migrations or continue with others?
          // For now, let's stop to prevent further issues.
          throw new Error(`Migration ${file} failed: ${err.message}`);
        }
      }
    }
    logger_1.logger.info('[DB Migrations] All applicable migrations processed.');
  } catch (error) {
    logger_1.logger.error(`[DB Migrations] Failed to apply migrations: ${error.message}`);
    // Optionally re-throw or handle as appropriate for your application's startup
    // throw error; 
  }
}
function initializeDB() {
  if (dbInstance) {
    logger_1.logger.info('[DB] Database already initialized.');
    return dbInstance;
  }
  // Determine the project root. app.getAppPath() is reliable once the app is packaged.
  // For development, process.cwd() might be more appropriate if running from the project root.
  // Let's try to be robust.
  const projectRoot = electron_1.app.isPackaged ? path_1.default.dirname(electron_1.app.getAppPath()) : process.cwd();
  // --- MODIFIED PATH --- 
  // Point directly to the database file in the project's src/backend/databases directory
  const dbPath = path_1.default.join(projectRoot, 'src', 'backend', 'databases', 'playlistify.db');
  // --- END MODIFIED PATH ---
  const schemaPath = path_1.default.join(projectRoot, 'src', 'backend', 'databases', 'schema.sql');
  const migrationsPath = path_1.default.join(projectRoot, 'src', 'backend', 'databases', MIGRATIONS_DIR_NAME);
  logger_1.logger.info(`[DB] PROJECT ROOT determined as: ${projectRoot}`);
  logger_1.logger.info(`[DB] Initializing database connection at (PROJECT RELATIVE): ${dbPath}`);
  logger_1.logger.info(`[DB] Expecting schema file at (PROJECT RELATIVE): ${schemaPath}`);
  logger_1.logger.info(`[DB] Expecting migrations directory at (PROJECT RELATIVE): ${migrationsPath}`);
  try {
    // Ensure the schema file exists as a sanity check for correct pathing
    if (!fs_extra_1.default.existsSync(schemaPath)) {
      logger_1.logger.error(`[DB] Schema file NOT FOUND at: ${schemaPath}. This indicates a serious pathing or project structure issue.`);
      throw new Error(`Schema file not found at ${schemaPath}. Cannot initialize database.`);
    }
    // Ensure the directory for the DB exists (src/backend/databases/)
    const dbFileDir = path_1.default.dirname(dbPath);
    fs_extra_1.default.ensureDirSync(dbFileDir); // Create it if it doesn't exist
    // Log whether the DB file itself already existed before opening
    // const dbAlreadyExisted = fsExtra.existsSync(dbPath);
    dbInstance = new better_sqlite3_1.default(dbPath, {
      verbose: logger_1.logger.info
    }); // Log all statements
    // if (!dbAlreadyExisted) {
    //   logger.info('[DB] New database file created at project path.');
    // } else {
    //   logger.info('[DB] Opened existing database file at project path.');
    // }
    dbInstance.pragma('journal_mode = WAL');
    logger_1.logger.info('[DB] Database connection established and WAL mode set.');
    // Create tables based on schema.sql if they don't exist
    logger_1.logger.info(`[DB] Attempting to apply schema from: ${schemaPath}`);
    const schemaSql = fs_extra_1.default.readFileSync(schemaPath, 'utf-8');
    if (dbInstance) {
      const currentDB = dbInstance; // Assign to a new constant for type narrowing
      currentDB.transaction(() => {
        currentDB.exec(schemaSql);
      })(); // Immediately invoke the transaction
    } else {
      // This case should ideally not be reached if initialization logic is correct
      logger_1.logger.error('[DB] dbInstance is null before attempting to apply schema. This is unexpected.');
      throw new Error('Database instance is null before schema application.');
    }
    logger_1.logger.info('[DB] Database schema applied successfully (or tables already existed).');
    // Attempt to create the specific index separately
    if (dbInstance) {
      try {
        const indexSql = 'CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id_position ON playlist_videos (playlist_id, position);';
        dbInstance.exec(indexSql);
        logger_1.logger.info('[DB] Successfully created idx_playlist_videos_playlist_id_position index.');
      } catch (indexError) {
        logger_1.logger.error(`[DB] Error creating idx_playlist_videos_playlist_id_position index: ${indexError.message}`);
        // Decide if this is critical enough to throw. For now, just log.
      }
    }
    // Apply migrations
    applyMigrations(dbInstance, migrationsPath);
    logger_1.logger.info('[DB] Database initialized successfully.');
    return dbInstance;
  } catch (error) {
    logger_1.logger.error(`[DB] Failed to initialize database: ${error.message}`, error);
    throw error; // Re-throw the error to halt app initialization if DB setup fails
  }
}
function getDB() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDB first.');
  }
  return dbInstance;
}
function closeDB() {
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      logger_1.logger.info('[DB] Database connection closed.');
    } catch (error) {
      logger_1.logger.error(`[DB] Error closing the database: ${error.message}`, error);
    }
  }
}

/***/ }),

/***/ "./src/backend/ipc/app-handlers.ts":
/*!*****************************************!*\
  !*** ./src/backend/ipc/app-handlers.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerAppHandlers = registerAppHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
function registerAppHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_APP_VERSION, () => {
    return electron_1.app.getVersion();
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_APP_PATH, (event, pathName) => {
    try {
      return electron_1.app.getPath(pathName);
    } catch (error) {
      console.error(`[AppHandlers] Error getting path "${pathName}":`, error);
      return null; // Or throw an error to be caught by the invoker
    }
  });
  // Add other general app-related IPC handlers here
  // For example, getting app path, user data path, etc.
  console.log('IPC app handlers registered.');
}

/***/ }),

/***/ "./src/backend/ipc/download-handlers.ts":
/*!**********************************************!*\
  !*** ./src/backend/ipc/download-handlers.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function () {
  var ownKeys = function (o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
      var ar = [];
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
  };
}();
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerDownloadHandlers = registerDownloadHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
const downloadManager = __importStar(__webpack_require__(/*! ../services/download-manager */ "./src/backend/services/download-manager.ts"));
// Function to get the main window (you might have a more robust way to manage this)
function getMainWindow() {
  return electron_1.BrowserWindow.getAllWindows()[0] || null;
}
function registerDownloadHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_ADD_ITEM, async (event, itemDetails) => {
    console.log('IPC: DOWNLOAD_ADD_ITEM received', itemDetails);
    const newItem = downloadManager.addItemToQueue(itemDetails);
    if (newItem) {
      return {
        success: true,
        data: {
          downloadId: newItem.id
        }
      };
    }
    return {
      success: false,
      error: 'Failed to add item to download queue. Download manager may not be initialized.'
    };
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_PAUSE_ITEM, async (event, downloadId) => {
    console.log('IPC: DOWNLOAD_PAUSE_ITEM received for ID:', downloadId);
    return downloadManager.pauseItem(downloadId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_RESUME_ITEM, async (event, downloadId) => {
    console.log('IPC: DOWNLOAD_RESUME_ITEM received for ID:', downloadId);
    return downloadManager.resumeItem(downloadId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_CANCEL_ITEM, async (event, downloadId) => {
    console.log('IPC: DOWNLOAD_CANCEL_ITEM received for ID:', downloadId);
    return downloadManager.cancelItem(downloadId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_RETRY_ITEM, async (event, downloadId) => {
    console.log('IPC: DOWNLOAD_RETRY_ITEM received for ID:', downloadId);
    return downloadManager.retryItem(downloadId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_REMOVE_ITEM, async (event, downloadId) => {
    console.log('IPC: DOWNLOAD_REMOVE_ITEM received for ID:', downloadId);
    return downloadManager.removeItem(downloadId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_GET_ALL_ITEMS, async () => {
    console.log('IPC: DOWNLOAD_GET_ALL_ITEMS received');
    return downloadManager.getAllItems();
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED, async () => {
    console.log('IPC: DOWNLOAD_CLEAR_COMPLETED received');
    return downloadManager.clearCompleted();
  });
  // Setup listener for progress events from downloadManager (if using EventEmitter approach)
  // This is a conceptual setup. The actual event emission needs to be in downloadManager.
  // downloadManager.downloadEvents?.on('progress', (progressData: Partial<DownloadQueueItem>) => {
  //   const mainWindow = getMainWindow();
  //   if (mainWindow && !mainWindow.isDestroyed()) {
  //     mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS_UPDATE, progressData);
  //   }
  // });
  console.log('IPC download handlers registered and calling DownloadManager.');
}

/***/ }),

/***/ "./src/backend/ipc/file-handlers.ts":
/*!******************************************!*\
  !*** ./src/backend/ipc/file-handlers.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerFileHandlers = registerFileHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const fileUtils_1 = __webpack_require__(/*! ../utils/fileUtils */ "./src/backend/utils/fileUtils.ts"); // Assuming fileUtils.ts exists and is correct
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
function registerFileHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.CREATE_PLAYLIST_DIR, async (event, playlistName) => {
    return (0, fileUtils_1.createPlaylistDir)(playlistName);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.WRITE_PLAYLIST_METADATA, async (event, playlistName, playlistData) => {
    await (0, fileUtils_1.writePlaylistMetadata)(playlistName, playlistData);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.READ_PLAYLIST_METADATA, async (event, playlistName) => {
    return (0, fileUtils_1.readPlaylistMetadata)(playlistName);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DELETE_PLAYLIST_DIR, async (event, playlistName) => {
    return (0, fileUtils_1.deletePlaylistDir)(playlistName);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_VIDEO_PATH, async function (event, playlistName, videoId) {
    let format = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'mp4';
    return (0, fileUtils_1.getVideoPath)(playlistName, videoId, format);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.VIDEO_FILE_EXISTS, async function (event, playlistName, videoId) {
    let format = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'mp4';
    return (0, fileUtils_1.videoFileExists)(playlistName, videoId, format);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.DELETE_VIDEO_FILE, async function (event, playlistName, videoId) {
    let format = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'mp4';
    await (0, fileUtils_1.deleteVideoFile)(playlistName, videoId, format);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.OPEN_DIRECTORY_DIALOG, async (event, options) => {
    const result = await electron_1.dialog.showOpenDialog(options);
    return result;
  });
  console.log('IPC file handlers registered.'); // Updated log message
}

/***/ }),

/***/ "./src/backend/ipc/playlist-handlers.ts":
/*!**********************************************!*\
  !*** ./src/backend/ipc/playlist-handlers.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerPlaylistHandlers = registerPlaylistHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
// Import from new custom playlist service
const custom_playlist_service_1 = __webpack_require__(/*! ../services/custom-playlist-service */ "./src/backend/services/custom-playlist-service.ts");
// Import from new YouTube import service
const youtube_import_service_1 = __webpack_require__(/*! ../services/youtube-import-service */ "./src/backend/services/youtube-import-service.ts");
// Import remaining generic functions from playlist-manager
const playlist_manager_1 = __webpack_require__(/*! ../services/playlist-manager */ "./src/backend/services/playlist-manager.ts");
function registerPlaylistHandlers() {
  // Handler for creating a NEW CUSTOM playlist
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_CREATE, async (_event, details) => {
    return (0, custom_playlist_service_1.createNewCustomPlaylist)(details);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_GET_ALL, async () => {
    return (0, playlist_manager_1.getAllPlaylists)();
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_GET_BY_ID, async (_event, id) => {
    return (0, playlist_manager_1.getPlaylistById)(id);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_UPDATE_DETAILS, async (_event, payload) => {
    return (0, playlist_manager_1.updatePlaylistDetails)(payload);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_DELETE, async (_event, id) => {
    return (0, playlist_manager_1.deletePlaylist)(id);
  });
  // Handler for adding a video to an IMPORTED playlist (uses junction table)
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_ADD_VIDEO, async (_event, playlistId, videoDetails) => {
    return (0, playlist_manager_1.addVideoToPlaylist)(playlistId, videoDetails);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_REMOVE_VIDEO, async (_event, playlistId, videoId) => {
    return (0, playlist_manager_1.removeVideoFromPlaylist)(playlistId, videoId);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_REORDER_VIDEOS, async (_event, playlistId, videoIdsInOrder) => {
    return (0, playlist_manager_1.reorderVideosInPlaylist)(playlistId, videoIdsInOrder);
  });
  // Handler for IMPORTING a playlist from YouTube URL
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_IMPORT_FROM_URL, async (_event, url) => {
    return (0, youtube_import_service_1.importPlaylistFromUrl)(url);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_GET_ALL_VIDEOS, async (_event, playlistId) => {
    try {
      const videos = await (0, playlist_manager_1.getAllVideosForPlaylist)(playlistId);
      // Ensure a consistent IpcResponse structure
      if (videos === null) {
        // Check if getAllVideosForPlaylist returned null (e.g. playlist not found)
        return {
          success: false,
          error: 'Playlist not found or no videos.',
          data: null
        };
      }
      return {
        success: true,
        data: videos
      };
    } catch (error) {
      console.error(`Error getting all videos for playlist ${playlistId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to get videos for playlist',
        data: null
      };
    }
  });
  // Handler for adding a video BY URL to a CUSTOM playlist
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.PLAYLIST_ADD_VIDEO_BY_URL, async (_event, payload) => {
    try {
      if (!payload || typeof payload.playlistId !== 'string' || typeof payload.videoUrl !== 'string') {
        return {
          success: false,
          error: 'Invalid payload: playlistId and videoUrl are required.',
          data: null
        };
      }
      return (0, custom_playlist_service_1.addVideoToCustomPlaylistByUrl)(payload.playlistId, payload.videoUrl);
    } catch (error) {
      console.error(`Error adding video by URL to playlist ${payload?.playlistId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to add video by URL',
        data: null
      };
    }
  });
  console.log('[IPC Handlers] Playlist handlers registered with updated service calls.');
}

/***/ }),

/***/ "./src/backend/ipc/settings-handlers.ts":
/*!**********************************************!*\
  !*** ./src/backend/ipc/settings-handlers.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerSettingsHandlers = registerSettingsHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const settingsService_1 = __webpack_require__(/*! ../services/settingsService */ "./src/backend/services/settingsService.ts"); // Assuming settingsService.ts exists and is correct
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
function registerSettingsHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_SETTING, (event, key, defaultValue) => {
    return (0, settingsService_1.getSetting)(key, defaultValue);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.SET_SETTING, (event, key, value) => {
    (0, settingsService_1.setSetting)(key, value);
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_ALL_SETTINGS, () => {
    return (0, settingsService_1.getAllSettings)();
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.RESET_ALL_SETTINGS, () => {
    (0, settingsService_1.resetSettings)();
  });
  console.log('IPC settings handlers registered.'); // Updated log message slightly for consistency
}

/***/ }),

/***/ "./src/backend/ipc/shell-handlers.ts":
/*!*******************************************!*\
  !*** ./src/backend/ipc/shell-handlers.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerShellHandlers = registerShellHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts"); // Corrected path
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
/**
 * Registers IPC handlers for shell-related operations.
 */
function registerShellHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.SHELL_OPEN_EXTERNAL, async (_event, url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http://') && !url.startsWith('https://')) {
      logger_1.logger.warn(`[ShellHandler] Attempted to open invalid or non-HTTP(S) URL: ${url}`);
      throw new Error('Invalid URL. Only http and https protocols are allowed.');
    }
    try {
      logger_1.logger.info(`[ShellHandler] Opening external URL: ${url}`);
      await electron_1.shell.openExternal(url);
      // shell.openExternal does not return a value that indicates success/failure directly in all cases,
      // but it throws an error on failure for some OS/protocol combinations.
      // If it doesn't throw, we assume success.
    } catch (error) {
      logger_1.logger.error(`[ShellHandler] Failed to open external URL "${url}": ${error.message}`);
      // Rethrow to let the frontend know it failed, or return a structured error response
      throw new Error(`Failed to open URL: ${error.message}`);
    }
  });
  logger_1.logger.info('[IPC Handlers] Shell handlers registered.');
}

/***/ }),

/***/ "./src/backend/ipc/thumbnail-handlers.ts":
/*!***********************************************!*\
  !*** ./src/backend/ipc/thumbnail-handlers.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerThumbnailHandlers = registerThumbnailHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
const thumbnail_manager_1 = __webpack_require__(/*! ../services/thumbnail-manager */ "./src/backend/services/thumbnail-manager.ts"); // Corrected import path
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts"); // Import logger
function registerThumbnailHandlers() {
  /*
  // Commenting out as previews now use direct URL from metadata
  // and caching logic is deferred until video download implementation.
  ipcMain.handle(
    IPC_CHANNELS.THUMBNAIL_GET_FOR_VIDEO,
    async (
      _event: IpcMainInvokeEvent,
      videoId: string,
      thumbnailUrl?: string
    ): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => {
      logger.info('[IPC:THUMBNAIL_GET_FOR_VIDEO] Received for video ID:', videoId, 'Thumbnail URL:', thumbnailUrl);
         if (!thumbnailUrl) {
        logger.warn('[IPC:THUMBNAIL_GET_FOR_VIDEO] No thumbnail URL provided for video ID:', videoId);
        return { success: false, error: 'No thumbnail URL provided from frontend.', data: { thumbnailPathOrUrl: null } };
      }
         const serviceResponse = await getThumbnailForVideo(videoId, thumbnailUrl === null ? undefined : thumbnailUrl);
         type ResponseDataType = { thumbnailPathOrUrl: string | null };
         if (serviceResponse.success) {
        const pathValue: string | null = serviceResponse.data ?? null;
        const responseData: ResponseDataType = { thumbnailPathOrUrl: pathValue };
        return {
          success: true,
          data: responseData
        };
      } else {
        const responseData: ResponseDataType = { thumbnailPathOrUrl: null };
        return {
          success: false,
          error: serviceResponse.error,
          data: responseData
        };
      }
    }
  );
  */
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.THUMBNAIL_GET_FOR_PLAYLIST, async (_event, playlistId) => {
    logger_1.logger.info('IPC: THUMBNAIL_GET_FOR_PLAYLIST received for playlist ID:', playlistId);
    const serviceResponse = await (0, thumbnail_manager_1.getThumbnailForPlaylist)(playlistId);
    if (serviceResponse.success) {
      const pathValue = serviceResponse.data ?? null;
      const responseData = {
        thumbnailPathOrUrl: pathValue
      };
      return {
        success: true,
        data: responseData
      };
    } else {
      const responseData = {
        thumbnailPathOrUrl: null
      };
      return {
        success: false,
        error: serviceResponse.error,
        data: responseData
      };
    }
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.THUMBNAIL_CLEAR_CACHE, async () => {
    console.log('IPC: THUMBNAIL_CLEAR_CACHE received');
    return (0, thumbnail_manager_1.clearThumbnailCache)();
  });
  console.log('IPC thumbnail handlers registered and calling ThumbnailManager.');
}

/***/ }),

/***/ "./src/backend/ipc/yt-dlp-handlers.ts":
/*!********************************************!*\
  !*** ./src/backend/ipc/yt-dlp-handlers.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.registerYtDlpHandlers = registerYtDlpHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const ipc_channels_1 = __webpack_require__(/*! ../../shared/constants/ipc-channels */ "./src/shared/constants/ipc-channels.ts");
const ytDlpManager_1 = __webpack_require__(/*! ../services/ytDlpManager */ "./src/backend/services/ytDlpManager.ts");
const youtube_playlist_preview_service_1 = __webpack_require__(/*! ../services/youtube-playlist-preview-service */ "./src/backend/services/youtube-playlist-preview-service.ts"); // Import the new service
const youtube_video_preview_service_1 = __webpack_require__(/*! ../services/youtube-video-preview-service */ "./src/backend/services/youtube-video-preview-service.ts"); // Import the video preview service
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
function registerYtDlpHandlers() {
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.YTDLP_GET_PLAYLIST_METADATA, async (_event, playlistUrl, _maxItems) => {
    logger_1.logger.info(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Received request for URL: ${playlistUrl}`);
    try {
      const playlistData = await (0, ytDlpManager_1.getPlaylistMetadata)(playlistUrl /*, pass overrideArgs here if needed [] */);
      if (!playlistData) {
        logger_1.logger.warn(`[IPC:YTDLP_GET_PLAYLIST_METADATA] No metadata returned for URL: ${playlistUrl}`);
        return {
          success: false,
          error: 'No playlist metadata found.',
          data: []
        };
      }
      const videoEntries = Array.isArray(playlistData.entries) ? playlistData.entries : [];
      logger_1.logger.info(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Successfully fetched ${videoEntries.length} metadata entries for URL: ${playlistUrl}`);
      return {
        success: true,
        data: videoEntries
      };
    } catch (error) {
      logger_1.logger.error(`[IPC:YTDLP_GET_PLAYLIST_METADATA] Error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to fetch playlist metadata from yt-dlp',
        data: []
      };
    }
  });
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.YTDLP_GET_QUICK_PLAYLIST_PREVIEW, async (_event, url) => {
    logger_1.logger.info(`[IPC Handler] YTDLP_GET_QUICK_PLAYLIST_PREVIEW received for URL: ${url}`);
    try {
      const previewData = await (0, youtube_playlist_preview_service_1.fetchYouTubePlaylistPreview)(url);
      if (!previewData) {
        logger_1.logger.warn(`[IPC Handler] No preview data returned from YouTubePlaylistPreviewService for ${url}`);
        return {
          success: false,
          error: 'Could not fetch playlist preview information.'
        };
      }
      logger_1.logger.info(`[IPC Handler] Successfully prepared quick preview via service for ${previewData.title} (${previewData.id})`);
      return {
        success: true,
        data: previewData
      };
    } catch (error) {
      logger_1.logger.error(`[IPC Handler] Error in YTDLP_GET_QUICK_PLAYLIST_PREVIEW for ${url}: ${error.message}`, error);
      // The service might return null for handled errors, or throw for unexpected ones.
      // This catch block handles errors thrown by the service or other unexpected issues.
      if (error.message && error.message.includes('This playlist type is unviewable')) {
        return {
          success: false,
          error: 'This type of YouTube playlist (e.g., Mixes or Radio) cannot be imported or previewed.'
        };
      }
      return {
        success: false,
        error: error.message || 'An unexpected error occurred while fetching playlist preview.'
      };
    }
  });
  // Handler for fetching single video metadata for preview
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.GET_VIDEO_METADATA_FOR_PREVIEW, async (_event, videoUrl) => {
    logger_1.logger.info(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Received request for URL: ${videoUrl}`);
    // Input validation is handled by the service, but can also be here for an early exit.
    if (!videoUrl || typeof videoUrl !== 'string') {
      logger_1.logger.warn('[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Invalid videoUrl received.');
      return {
        success: false,
        error: 'Invalid video URL provided.'
      };
    }
    try {
      const metadata = await (0, youtube_video_preview_service_1.fetchYouTubeVideoPreview)(videoUrl);
      if (metadata) {
        logger_1.logger.info(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Successfully fetched metadata via service for: ${metadata.title}`);
        return {
          success: true,
          data: metadata
        };
      } else {
        // The service returns null on errors (e.g., yt-dlp error or no metadata found)
        logger_1.logger.warn(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] No metadata returned from service for URL: ${videoUrl}`);
        return {
          success: false,
          error: 'No metadata found for the provided URL or an error occurred.'
        };
      }
    } catch (error) {
      // This catch is for unexpected errors not handled by the service returning null
      logger_1.logger.error(`[IPC:GET_VIDEO_METADATA_FOR_PREVIEW] Unexpected error fetching metadata for ${videoUrl}: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Failed to fetch video metadata for preview due to an unexpected error.'
      };
    }
  });
  // Placeholder for the existing YTDLP_DOWNLOAD_VIDEO handler to resolve linter error contextually
  electron_1.ipcMain.handle(ipc_channels_1.IPC_CHANNELS.YTDLP_DOWNLOAD_VIDEO, async (_event, options) => {
    logger_1.logger.info('[IPC:YTDLP_DOWNLOAD_VIDEO] Received request with options:', options ? Object.keys(options) : 'null');
    // Actual implementation for YTDLP_DOWNLOAD_VIDEO would go here.
    // For now, returning a placeholder response.
    return {
      success: false,
      error: 'YTDLP_DOWNLOAD_VIDEO handler not fully implemented in this refactor step.'
    };
  });
  // ... other handlers like YTDLP_CHECK_AVAILABILITY, YTDLP_GET_AVAILABLE_QUALITIES ...
  console.log('[IPC Handlers] yt-dlp handlers registered.');
}

/***/ }),

/***/ "./src/backend/services/custom-playlist-service.ts":
/*!*********************************************************!*\
  !*** ./src/backend/services/custom-playlist-service.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function () {
  var ownKeys = function (o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
      var ar = [];
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
  };
}();
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createNewCustomPlaylist = createNewCustomPlaylist;
exports.addVideoToCustomPlaylistByUrl = addVideoToCustomPlaylistByUrl;
const db_1 = __webpack_require__(/*! ../databases/db */ "./src/backend/databases/db.ts");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const ytDlpManager = __importStar(__webpack_require__(/*! ./ytDlpManager */ "./src/backend/services/ytDlpManager.ts"));
const youtube_video_preview_service_1 = __webpack_require__(/*! ./youtube-video-preview-service */ "./src/backend/services/youtube-video-preview-service.ts");
/**
 * Helper function to convert YYYYMMDD to MMDDYYYY format
 */
function convertYtDlpDateToMMDDYYYY(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) {
    return undefined;
  }
  try {
    // Ensure the input is purely numeric and 8 digits
    if (!/^\d{8}$/.test(yyyymmdd)) {
      logger_1.logger.warn(`[CustomPlaylistService] Invalid characters in yyyymmdd string: ${yyyymmdd}`);
      return undefined;
    }
    const year = yyyymmdd.substring(0, 4);
    const month = yyyymmdd.substring(4, 6);
    const day = yyyymmdd.substring(6, 8);
    // Basic validation for month and day ranges
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      logger_1.logger.warn(`[CustomPlaylistService] Invalid month or day in yyyymmdd string: ${yyyymmdd}`);
      return undefined;
    }
    return `${month}${day}${year}`;
  } catch (error) {
    logger_1.logger.error(`[CustomPlaylistService] Error parsing date string ${yyyymmdd} to MMDDYYYY: ${error.message}`);
    return undefined;
  }
}
/**
 * Creates a new, empty custom playlist.
 * @param details Payload containing name, description, and privacy status.
 * @returns An IpcResponse containing the new playlist ID or an error.
 */
async function createNewCustomPlaylist(details) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`Attempting to create custom playlist: ${details.name}`);
  const newPlaylistId = (0, uuid_1.v4)();
  const now = new Date().toISOString();
  const playlistForDb = {
    id: newPlaylistId,
    name: details.name,
    description: details.description || null,
    thumbnail: null,
    // Custom playlists start with no thumbnail initially
    source: 'custom',
    item_count: 0,
    created_at: now,
    updated_at: now,
    source_url: null,
    // Custom playlists do not have a source URL
    youtube_playlist_id: null,
    total_duration_seconds: 0,
    // Added for completeness, though videos are empty initially
    videos: JSON.stringify([]) // Store videos as JSON string for custom playlists
  };
  try {
    const stmt = db.prepare(`INSERT INTO playlists (id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id, total_duration_seconds, videos)
       VALUES (@id, @name, @description, @thumbnail, @source, @item_count, @created_at, @updated_at, @source_url, @youtube_playlist_id, @total_duration_seconds, @videos)`);
    stmt.run(playlistForDb);
    logger_1.logger.info(`[CustomPlaylistService] Custom playlist "${details.name}" (ID: ${newPlaylistId}) created successfully.`);
    return {
      success: true,
      data: {
        playlistId: newPlaylistId
      }
    };
  } catch (error) {
    logger_1.logger.error(`[CustomPlaylistService] Error creating custom playlist "${details.name}": ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: {
        playlistId: newPlaylistId
      }
    };
  }
}
/**
 * Adds a video to a custom playlist by its URL.
 * Fetches video metadata, stores video in 'videos' table, and associates with playlist in 'playlist_videos'.
 * @param playlistId The ID of the custom playlist.
 * @param videoUrl The URL of the video to add.
 * @returns An IpcResponse containing the added video data or null if failed.
 */
async function addVideoToCustomPlaylistByUrl(playlistId, videoUrl) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[CustomPlaylistService] addVideoToCustomPlaylistByUrl called for playlist ID: ${playlistId}, RAW URL: ${videoUrl}`);
  try {
    const playlistRow = db.prepare("SELECT id, name, source FROM playlists WHERE id = ?").get(playlistId);
    if (!playlistRow) {
      return {
        success: false,
        error: 'Playlist not found.',
        data: null
      };
    }
    if (playlistRow.source !== 'custom') {
      return {
        success: false,
        error: 'This function can only add videos to custom playlists.',
        data: null
      };
    }
    const cleanedVideoUrl = (0, youtube_video_preview_service_1.cleanYouTubeVideoUrl)(videoUrl);
    logger_1.logger.info(`[CustomPlaylistService] Cleaned video URL for metadata fetch: ${cleanedVideoUrl}`);
    const rawVideoMetadata = await ytDlpManager.getVideoMetadata(cleanedVideoUrl);
    if (!rawVideoMetadata || !rawVideoMetadata.id) {
      return {
        success: false,
        error: 'Failed to fetch video metadata.',
        data: null
      };
    }
    const videoId = rawVideoMetadata.id;
    const now = new Date().toISOString();
    const existingEntryStmt = db.prepare("SELECT video_id FROM playlist_videos WHERE playlist_id = ? AND video_id =?");
    const existingEntry = existingEntryStmt.get(playlistId, videoId);
    if (existingEntry) {
      logger_1.logger.warn(`[CustomPlaylistService] Video ${videoId} already exists in playlist ${playlistId}.`);
      const existingVideoDataFromDb = db.prepare("SELECT * FROM videos WHERE id = ?").get(videoId);
      let finalVideoObject = null;
      if (existingVideoDataFromDb) {
        // Ensure we have a base object of type Video
        const videoBase = {
          ...existingVideoDataFromDb
        };
        const playlistContext = db.prepare("SELECT position, added_to_playlist_at FROM playlist_videos WHERE playlist_id = ? AND video_id =?").get(playlistId, videoId);
        if (playlistContext) {
          videoBase.position_in_playlist = playlistContext.position;
          videoBase.added_to_playlist_at = playlistContext.added_to_playlist_at;
        }
        finalVideoObject = videoBase;
      }
      return {
        success: false,
        error: 'Video already exists in this playlist.',
        data: finalVideoObject
      };
    }
    // --- Robust videoForDb construction ---
    let duration = null;
    if (typeof rawVideoMetadata.duration === 'number') {
      duration = rawVideoMetadata.duration;
    } else if (typeof rawVideoMetadata.duration === 'string') {
      const parsedDuration = parseFloat(rawVideoMetadata.duration);
      duration = isNaN(parsedDuration) ? null : parsedDuration;
    }
    let thumbnail_url = null;
    if (typeof rawVideoMetadata.thumbnail === 'string') {
      thumbnail_url = rawVideoMetadata.thumbnail;
    } else if (Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0) {
      const bestThumb = rawVideoMetadata.thumbnails[rawVideoMetadata.thumbnails.length - 1];
      if (bestThumb && typeof bestThumb.url === 'string') {
        thumbnail_url = bestThumb.url;
      }
    }
    if (!thumbnail_url && Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0 && typeof rawVideoMetadata.thumbnails[0]?.url === 'string') {
      thumbnail_url = rawVideoMetadata.thumbnails[0].url;
    }
    const videoForDb = {
      id: videoId,
      url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : typeof rawVideoMetadata.original_url === 'string' ? rawVideoMetadata.original_url : videoUrl,
      title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
      channel: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null,
      duration: duration,
      thumbnail_url: thumbnail_url,
      is_available: 1,
      is_downloaded: 0,
      local_file_path: null,
      download_status: null,
      download_progress: null,
      last_watched_at: null,
      watch_progress: null,
      added_at: now,
      channel_title: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null,
      upload_date: typeof rawVideoMetadata.upload_date === 'string' ? rawVideoMetadata.upload_date : null,
      description: typeof rawVideoMetadata.description === 'string' ? rawVideoMetadata.description : null,
      channel_id: rawVideoMetadata.channel_id || null,
      uploader_id: rawVideoMetadata.uploader_id || null
    };
    // --- End robust videoForDb construction ---
    const insertVideoQuery = `INSERT INTO videos (
      id, url, title, channel, duration, thumbnail_url, 
      is_available, is_downloaded, local_file_path, download_status, download_progress, 
      last_watched_at, watch_progress, added_at, 
      channel_title, upload_date, description, channel_id, uploader_id
    ) VALUES (
      @id, @url, @title, @channel, @duration, @thumbnail_url, 
      @is_available, @is_downloaded, @local_file_path, @download_status, @download_progress, 
      @last_watched_at, @watch_progress, @added_at, 
      @channel_title, @upload_date, @description, @channel_id, @uploader_id
    ) ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        channel = excluded.channel,
        duration = excluded.duration,
        thumbnail_url = excluded.thumbnail_url,
        is_available = excluded.is_available,
        channel_title = excluded.channel_title,
        upload_date = excluded.upload_date,
        description = excluded.description,
        channel_id = excluded.channel_id,
        uploader_id = excluded.uploader_id
    `;
    const insertVideoStmt = db.prepare(insertVideoQuery);
    insertVideoStmt.run(videoForDb);
    // Add to playlist_videos junction table
    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlist_id = ?");
    const result = orderQuery.get(playlistId);
    const nextOrder = result && typeof result.max_order === 'number' ? result.max_order + 1 : 0;
    db.prepare("INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at) VALUES (?, ?, ?, ?)").run(playlistId, videoId, nextOrder, now);
    // Determine the new playlist thumbnail based on the video at position 0
    const firstVideoThumbnailStmt = db.prepare(`SELECT v.thumbnail_url 
       FROM videos v
       JOIN playlist_videos pv ON v.id = pv.video_id
       WHERE pv.playlist_id = ? AND pv.position = 0
       LIMIT 1`);
    const firstVideoResult = firstVideoThumbnailStmt.get(playlistId);
    const newPlaylistThumbnail = firstVideoResult ? firstVideoResult.thumbnail_url : null;
    logger_1.logger.info(`[CustomPlaylistService] Determined new playlist thumbnail for ${playlistId}: ${newPlaylistThumbnail}`);
    const playlistUpdateStmt = db.prepare("UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = @id), updated_at = @updated_at, thumbnail = @newThumbnail WHERE id = @id");
    playlistUpdateStmt.run({
      id: playlistId,
      updated_at: now,
      newThumbnail: newPlaylistThumbnail // Use the thumbnail of the video at position 0
    });
    // After updating itemCount and thumbnail, now update total_duration_seconds
    let total_duration_for_playlist = 0;
    try {
      const durationResult = db.prepare(`SELECT SUM(v.duration) as total
         FROM videos v
         JOIN playlist_videos pv ON v.id = pv.video_id
         WHERE pv.playlist_id = ?`).get(playlistId);
      if (durationResult && durationResult.total !== null) {
        total_duration_for_playlist = durationResult.total;
      }
      db.prepare("UPDATE playlists SET total_duration_seconds = ? WHERE id = ?").run(total_duration_for_playlist, playlistId);
      logger_1.logger.info(`[CustomPlaylistService] Updated total_duration_seconds for playlist ${playlistId} to ${total_duration_for_playlist}`);
    } catch (durationError) {
      logger_1.logger.error(`[CustomPlaylistService] Error updating total_duration_seconds for playlist ${playlistId}: ${durationError.message}`);
      // Continue without failing the whole operation if duration update fails
    }
    logger_1.logger.info(`[CustomPlaylistService] Successfully added video ${videoId} to custom playlist ${playlistId} at position ${nextOrder}.`);
    // Construct the Video object to return for the IPC response
    const addedVideo = {
      id: videoId,
      url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : cleanedVideoUrl,
      title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
      channel: rawVideoMetadata.uploader || rawVideoMetadata.channel || null || undefined,
      duration: duration === null ? undefined : duration,
      thumbnail_url: thumbnail_url || undefined,
      description: rawVideoMetadata.description || null || undefined,
      channel_title: rawVideoMetadata.uploader || rawVideoMetadata.channel || null || undefined,
      upload_date: rawVideoMetadata.upload_date || null || undefined,
      added_to_playlist_at: now,
      position_in_playlist: nextOrder,
      is_available: true,
      is_downloaded: false,
      local_file_path: undefined,
      download_status: undefined,
      download_progress: undefined,
      last_watched_at: undefined,
      watch_progress: undefined,
      added_at: now,
      channel_id: rawVideoMetadata.channel_id || null || undefined,
      uploader_id: rawVideoMetadata.uploader_id || null || undefined
    };
    return {
      success: true,
      data: addedVideo
    };
  } catch (error) {
    logger_1.logger.error(`[CustomPlaylistService] Error in addVideoToCustomPlaylistByUrl for playlist ${playlistId}: ${error.message}`);
    logger_1.logger.error(`[CustomPlaylistService] Full error object: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/***/ }),

/***/ "./src/backend/services/download-manager.ts":
/*!**************************************************!*\
  !*** ./src/backend/services/download-manager.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addItemToQueue = exports.downloadEvents = void 0;
exports.pauseItem = pauseItem;
exports.resumeItem = resumeItem;
exports.cancelItem = cancelItem;
exports.retryItem = retryItem;
exports.removeItem = removeItem;
exports.getAllItems = getAllItems;
exports.clearCompleted = clearCompleted;
const events_1 = __webpack_require__(/*! events */ "events");
const p_queue_1 = __importDefault(__webpack_require__(/*! p-queue */ "p-queue"));
const yt_dlp_wrap_1 = __importDefault(__webpack_require__(/*! yt-dlp-wrap */ "yt-dlp-wrap"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path")); // For path manipulations
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra")); // For ensuring directory exists
const electron_1 = __webpack_require__(/*! electron */ "electron");
// Assuming settingsService provides a getSetting function
const settingsService_1 = __webpack_require__(/*! ./settingsService */ "./src/backend/services/settingsService.ts"); // Corrected path
// Assuming pathUtils provides functions to get binary paths
const pathUtils_1 = __webpack_require__(/*! ../utils/pathUtils */ "./src/backend/utils/pathUtils.ts"); // Corrected function names
// In-memory store for downloads
const downloads = new Map();
exports.downloadEvents = new events_1.EventEmitter();
let ytDlpWrap = null;
let downloadQueue = null;
let ffmpegPathExternal = null; // Renamed to avoid conflict with node 'path' module
async function initializeDownloadManager() {
  if (downloadQueue && ytDlpWrap) {
    return; // Already initialized
  }
  try {
    const ytDlpPath = await (0, pathUtils_1.getManagedYtDlpPath)();
    ffmpegPathExternal = await (0, pathUtils_1.getManagedFfmpegPath)();
    if (!ytDlpPath) {
      console.error('[DownloadManager] yt-dlp binary path not found. Downloads will fail.');
      throw new Error('yt-dlp binary path not found.');
    }
    if (!ffmpegPathExternal) {
      console.warn('[DownloadManager] FFmpeg path not found. Merging formats might fail.');
    }
    ytDlpWrap = new yt_dlp_wrap_1.default(ytDlpPath);
    console.log(`[DownloadManager] YTDlpWrap initialized with binary at: ${ytDlpPath}`);
    // Use the correct key 'maxConcurrentDownloads' from the Settings/UserSettings type
    const concurrency = await (0, settingsService_1.getSetting)('maxConcurrentDownloads', 3);
    downloadQueue = new p_queue_1.default({
      concurrency
    });
    console.log(`[DownloadManager] PQueue initialized with concurrency: ${concurrency}`);
  } catch (error) {
    console.error('[DownloadManager] Initialization failed:', error);
  }
}
initializeDownloadManager();
async function processDownload(downloadId) {
  const item = downloads.get(downloadId);
  if (!item || !ytDlpWrap || !downloadQueue) {
    console.error(`[DownloadManager] Cannot process download ${downloadId}, item or manager not ready.`);
    if (item) {
      item.status = 'error';
      downloads.set(downloadId, item);
      exports.downloadEvents.emit('statusChanged', item);
    }
    return;
  }
  item.status = 'downloading';
  downloads.set(downloadId, item);
  exports.downloadEvents.emit('statusChanged', item);
  exports.downloadEvents.emit('progress', {
    downloadId,
    progress: 0,
    status: 'downloading'
  });
  try {
    const fallbackDownloadDir = electron_1.app.getPath('videos'); // Electron's default videos path
    const defaultDownloadDir = (await (0, settingsService_1.getSetting)('downloadLocation', fallbackDownloadDir)) || fallbackDownloadDir;
    const finalOutputPath = item.outputPath || path_1.default.join(defaultDownloadDir, `${item.id}.%(ext)s`);
    item.outputPath = finalOutputPath; // Update the item with the resolved path
    // Use finalOutputPath directly as it's guaranteed to be a string here
    await fs_extra_1.default.ensureDir(path_1.default.dirname(finalOutputPath));
    const qualityToUse = item.requestedQuality || (await (0, settingsService_1.getSetting)('defaultQuality', '1080p'));
    const formatToUse = item.requestedFormat || (await (0, settingsService_1.getSetting)('downloadFormat', 'mp4'));
    let formatSelection = '';
    if (qualityToUse === 'best') {
      formatSelection = `bestvideo[ext=${formatToUse}]+bestaudio[ext=m4a]/best[ext=${formatToUse}]/best`;
    } else {
      // Ensure qualityToUse is not undefined and is a string with 'p' before calling replace
      const height = qualityToUse ? qualityToUse.replace('p', '') : '1080'; // Default height if undefined
      formatSelection = `bestvideo[ext=${formatToUse}][height<=?${height}]+bestaudio[ext=m4a]/bestvideo[ext=${formatToUse}]+bestaudio/best[ext=${formatToUse}]/best`;
    }
    const args = [item.url];
    args.push('-f', formatSelection);
    args.push('-o', item.outputPath);
    if (ffmpegPathExternal) {
      args.push('--ffmpeg-location', ffmpegPathExternal);
    }
    console.log(`[DownloadManager] Starting download for ${item.title} with args:`, args.join(' '));
    ytDlpWrap.exec(args).on('progress', progress => {
      item.progress = progress.percent || 0;
      item.eta = progress.eta;
      item.speed = progress.currentSpeed;
      downloads.set(downloadId, item);
      exports.downloadEvents.emit('progress', {
        downloadId,
        ...progress,
        status: 'downloading'
      });
    }).on('ytDlpEvent', (eventType, eventData) => {}).on('error', error => {
      console.error(`[DownloadManager] Error downloading ${item.title} (ID: ${downloadId}):`, error);
      item.status = 'error';
      downloads.set(downloadId, item);
      exports.downloadEvents.emit('statusChanged', item);
      exports.downloadEvents.emit('error', {
        downloadId,
        error: error.message
      });
    }).on('close', () => {
      if (item.status === 'downloading') {
        item.status = 'completed';
        item.progress = 100;
        console.log(`[DownloadManager] Download completed for ${item.title} (ID: ${downloadId})`);
        downloads.set(downloadId, item);
        exports.downloadEvents.emit('statusChanged', item);
        exports.downloadEvents.emit('completed', {
          downloadId
        });
      }
    });
  } catch (error) {
    console.error(`[DownloadManager] Failed to start download for ${item.title} (ID: ${downloadId}):`, error);
    item.status = 'error';
    downloads.set(downloadId, item);
    exports.downloadEvents.emit('statusChanged', item);
    exports.downloadEvents.emit('error', {
      downloadId,
      error: error.message
    });
  }
}
const addItemToQueue = itemDetails => {
  if (!ytDlpWrap) {
    console.error('[DownloadManager] YTDlpWrap instance not initialized.');
    return null;
  }
  // Use itemDetails.id if provided, otherwise generate one.
  // The ID from itemDetails usually comes from the Video object (e.g., YouTube video ID)
  const downloadId = itemDetails.id || `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newItem = {
    id: downloadId,
    url: itemDetails.url,
    title: itemDetails.title,
    thumbnailUrl: itemDetails.thumbnail_url,
    playlistId: itemDetails.playlistId,
    outputPath: itemDetails.outputPath,
    status: 'pending',
    progress: 0,
    addedAt: new Date().toISOString(),
    duration: itemDetails.duration,
    requestedFormat: itemDetails.requestedFormat,
    requestedQuality: itemDetails.requestedQuality
  };
  downloads.set(downloadId, newItem);
  exports.downloadEvents.emit('statusChanged', newItem);
  downloadQueue?.add(() => processDownload(downloadId)).catch(error => {
    console.error(`[DownloadManager] Unhandled error in PQueue for download ${downloadId}:`, error);
    const item = downloads.get(downloadId);
    if (item) {
      item.status = 'error';
      downloads.set(downloadId, item);
      exports.downloadEvents.emit('statusChanged', item);
    }
  });
  console.log(`[DownloadManager] Item ${downloadId} added to queue. Title: ${newItem.title}`);
  return newItem;
};
exports.addItemToQueue = addItemToQueue;
async function pauseItem(downloadId) {
  console.log('[DownloadManager] pauseItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item && item.status === 'downloading') {
    item.status = 'paused';
    downloads.set(downloadId, item);
    exports.downloadEvents.emit('statusChanged', item);
    console.log(`[DownloadManager] Item ${downloadId} marked as paused (actual process pause not implemented).`);
    return {
      success: true
    };
  }
  return {
    success: false,
    error: 'Item not found or not downloadable.'
  };
}
async function resumeItem(downloadId) {
  console.log('[DownloadManager] resumeItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item && item.status === 'paused') {
    item.status = 'pending';
    downloads.set(downloadId, item);
    exports.downloadEvents.emit('statusChanged', item);
    console.log(`[DownloadManager] Item ${downloadId} marked as resumed/re-queued (actual process resume not implemented).`);
    return {
      success: true
    };
  }
  return {
    success: false,
    error: 'Item not found or not paused.'
  };
}
async function cancelItem(downloadId) {
  console.log('[DownloadManager] cancelItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item) {
    item.status = 'cancelled';
    downloads.set(downloadId, item);
    exports.downloadEvents.emit('statusChanged', item);
    downloadQueue?.clear();
    console.log(`[DownloadManager] Item ${downloadId} marked as cancelled (actual process cancellation not implemented).`);
    return {
      success: true
    };
  }
  return {
    success: false,
    error: 'Item not found.'
  };
}
async function retryItem(downloadId) {
  console.log('[DownloadManager] retryItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item && (item.status === 'error' || item.status === 'cancelled')) {
    item.status = 'pending';
    item.progress = 0;
    downloads.set(downloadId, item);
    exports.downloadEvents.emit('statusChanged', item);
    downloadQueue?.add(() => processDownload(downloadId)).catch(error => {
      console.error(`[DownloadManager] Unhandled error in PQueue for retry ${downloadId}:`, error);
    });
    console.log(`[DownloadManager] Item ${downloadId} re-queued for retry.`);
    return {
      success: true
    };
  }
  return {
    success: false,
    error: 'Item not found or not in a retryable state.'
  };
}
async function removeItem(downloadId) {
  console.log('[DownloadManager] removeItem called for ID:', downloadId);
  if (downloads.has(downloadId)) {
    downloads.delete(downloadId);
    exports.downloadEvents.emit('removed', {
      downloadId
    });
    console.log(`[DownloadManager] Item ${downloadId} removed from tracking.`);
    return {
      success: true
    };
  }
  return {
    success: false,
    error: 'Item not found.'
  };
}
async function getAllItems() {
  console.log('[DownloadManager] getAllItems called');
  return {
    success: true,
    data: Array.from(downloads.values())
  };
}
async function clearCompleted() {
  console.log('[DownloadManager] clearCompleted called');
  let changed = false;
  downloads.forEach((item, id) => {
    if (item.status === 'completed') {
      downloads.delete(id);
      changed = true;
    }
  });
  if (changed) {
    exports.downloadEvents.emit('clearedCompleted');
  }
  console.log('[DownloadManager] Completed items cleared.');
  return {
    success: true
  };
}
// For emitting progress, the DownloadManager would typically use an EventEmitter
// or have a way to send updates to the main process/IPC handlers,
// which then forward to the renderer.
// e.g., using something like:
// import { EventEmitter } from 'events';
// export const downloadEvents = new EventEmitter();
// downloadEvents.emit('progress', { downloadId: 'some-id', progress: 50 });

/***/ }),

/***/ "./src/backend/services/playlist-manager.ts":
/*!**************************************************!*\
  !*** ./src/backend/services/playlist-manager.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getAllPlaylists = getAllPlaylists;
exports.getPlaylistById = getPlaylistById;
exports.updatePlaylistDetails = updatePlaylistDetails;
exports.deletePlaylist = deletePlaylist;
exports.addVideoToPlaylist = addVideoToPlaylist;
exports.removeVideoFromPlaylist = removeVideoFromPlaylist;
exports.reorderVideosInPlaylist = reorderVideosInPlaylist;
exports.getAllVideosForPlaylist = getAllVideosForPlaylist;
// import * as ytDlpManager from './ytDlpManager'; // ytDlpManager might not be needed here anymore if all its uses were in removed functions
const db_1 = __webpack_require__(/*! ../databases/db */ "./src/backend/databases/db.ts");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
// import { getPlaylistMetadata } from './ytDlpManager'; // No longer needed here
// import { v4 as uuidv4 } from 'uuid'; // No longer needed here
// Removed: createPlaylist
// Removed: addVideoToCustomPlaylistByUrl
// Remove the temporary global type definition as we are using a direct import now
// declare global {
//   var services: {
//     ytDlp: {
//       getPlaylistInfoWithEntries: (url: string) => Promise<any>; 
//     };
//   };
// }
async function getAllPlaylists() {
  const db = (0, db_1.getDB)();
  logger_1.logger.info('[PlaylistManager] getAllPlaylists called');
  try {
    const rows = db.prepare("SELECT id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id FROM playlists").all();
    const playlists = rows.map(row => {
      let total_duration_seconds = 0;
      try {
        const durationResult = db.prepare(`SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.video_id
           WHERE pv.playlist_id = ?`).get(row.id);
        if (durationResult && durationResult.total !== null) {
          total_duration_seconds = durationResult.total;
        }
      } catch (durationError) {
        logger_1.logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${row.id}: ${durationError.message}`);
      }
      return {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: [],
        source_url: row.source_url === null ? undefined : row.source_url,
        source: row.source,
        item_count: row.item_count,
        total_duration_seconds: total_duration_seconds,
        created_at: row.created_at,
        updated_at: row.updated_at,
        youtube_playlist_id: row.youtube_playlist_id === null ? undefined : row.youtube_playlist_id
      };
    });
    return {
      success: true,
      data: playlists
    };
  } catch (error) {
    logger_1.logger.error('[PlaylistManager] Error fetching all playlists:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}
async function getPlaylistById(id) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[PlaylistManager] getPlaylistById called with ID: ${id}`);
  try {
    const row = db.prepare("SELECT id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id FROM playlists WHERE id = ?").get(id);
    if (row) {
      logger_1.logger.info(`[PlaylistManager] Found playlist row: ${JSON.stringify(row)}`);
      const videosStmt = db.prepare("SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC");
      const videoRows = videosStmt.all(id);
      logger_1.logger.info(`[PlaylistManager] Found ${videoRows.length} video rows for playlist ID ${id}.`);
      if (videoRows.length > 0) {
        logger_1.logger.debug(`[PlaylistManager] First video row data: ${JSON.stringify(videoRows[0])}`);
      }
      const videos = videoRows.map(vRow => ({
        id: vRow.id,
        title: vRow.title,
        url: vRow.url,
        thumbnail_url: vRow.thumbnail_url === null ? undefined : vRow.thumbnail_url,
        duration: vRow.duration === null ? undefined : vRow.duration,
        description: vRow.description === null ? undefined : vRow.description,
        channel_title: vRow.channel_title === null ? undefined : vRow.channel_title,
        upload_date: vRow.upload_date === null ? undefined : vRow.upload_date,
        added_to_playlist_at: vRow.added_to_playlist_at,
        position_in_playlist: vRow.position_in_playlist,
        is_available: vRow.is_available !== undefined ? vRow.is_available : undefined,
        is_downloaded: vRow.is_downloaded !== undefined ? vRow.is_downloaded : undefined,
        local_file_path: vRow.local_file_path === null ? undefined : vRow.local_file_path,
        download_status: vRow.download_status === null ? undefined : vRow.download_status,
        download_progress: vRow.download_progress === null ? undefined : vRow.download_progress,
        last_watched_at: vRow.last_watched_at === null ? undefined : vRow.last_watched_at,
        watch_progress: vRow.watch_progress === null ? undefined : vRow.watch_progress,
        added_at: vRow.added_at,
        channel_id: vRow.channel_id === null ? undefined : vRow.channel_id,
        uploader_id: vRow.uploader_id === null ? undefined : vRow.uploader_id
      }));
      const total_duration_seconds = videos.reduce((acc, video) => acc + (video.duration || 0), 0);
      const playlist = {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: videos,
        source_url: row.source_url === null ? undefined : row.source_url,
        source: row.source,
        item_count: videos.length,
        total_duration_seconds: total_duration_seconds,
        created_at: row.created_at,
        updated_at: row.updated_at,
        youtube_playlist_id: row.youtube_playlist_id === null ? undefined : row.youtube_playlist_id
      };
      logger_1.logger.debug(`[PlaylistManager] Constructed playlist object for ID ${id}: ${JSON.stringify(playlist)}`);
      if (row.item_count !== playlist.item_count) {
        db.prepare("UPDATE playlists SET item_count = ? WHERE id = ?").run(playlist.item_count, playlist.id);
      }
      return {
        success: true,
        data: playlist
      };
    } else {
      return {
        success: false,
        error: 'Playlist not found',
        data: null
      };
    }
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error fetching playlist by ID ${id}:`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}
async function updatePlaylistDetails(payload) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info('[PlaylistManager] updatePlaylistDetails called with payload:', payload);
  const now = new Date().toISOString();
  const setClauses = [];
  const params = {
    id: payload.id,
    updated_at: now
  };
  if (payload.name !== undefined) {
    setClauses.push('name = @name');
    params.name = payload.name;
  }
  if (payload.description !== undefined) {
    setClauses.push('description = @description');
    params.description = payload.description;
  }
  if (payload.thumbnail !== undefined) {
    setClauses.push('thumbnail = @thumbnail');
    params.thumbnail = payload.thumbnail;
  }
  if (setClauses.length === 0) {
    logger_1.logger.warn('[PlaylistManager] No fields to update for playlist ID:', payload.id);
    return getPlaylistById(payload.id);
  }
  const stmt = db.prepare(`UPDATE playlists SET ${setClauses.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  try {
    const result = stmt.run(params);
    if (result.changes > 0) {
      logger_1.logger.info(`[PlaylistManager] Playlist ID ${payload.id} updated successfully.`);
      return getPlaylistById(payload.id);
    } else {
      logger_1.logger.warn(`[PlaylistManager] Playlist ID ${payload.id} not found for update.`);
      return {
        success: false,
        error: 'Playlist not found or no changes made',
        data: null
      };
    }
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error updating playlist ID ${payload.id}:`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}
async function deletePlaylist(id) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[PlaylistManager] deletePlaylist called for ID: ${id}`);
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ?").run(id);
      db.prepare("DELETE FROM playlists WHERE id = ?").run(id);
    })();
    logger_1.logger.info(`[PlaylistManager] Playlist ID ${id} and its video associations deleted successfully (if it existed).`);
    return {
      success: true
    };
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error deleting playlist ID ${id}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
/**
 * Adds a video to a playlist's junction table (playlist_videos) for imported playlists.
 * Assumes the video already exists in the main 'videos' table.
 */
async function addVideoToPlaylist(playlistId, videoDetails) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist ENTERED for playlist ID: ${playlistId}, video ID: ${videoDetails.id}, title: ${videoDetails.title}`);
  try {
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Checking if video ${videoDetails.id} already exists in playlist ${playlistId}`);
    const existingEntryStmt = db.prepare("SELECT video_id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
    const existingEntry = existingEntryStmt.get(playlistId, videoDetails.id);
    if (existingEntry) {
      logger_1.logger.warn(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} already exists in playlist ${playlistId}. No action taken.`);
      return {
        success: false,
        error: 'Video already exists in this playlist.'
      };
    }
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} does not exist in playlist ${playlistId}. Proceeding to add.`);
    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlist_id = ?");
    const resultOrder = orderQuery.get(playlistId);
    const nextOrder = resultOrder && typeof resultOrder.max_order === 'number' ? resultOrder.max_order + 1 : 0;
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Calculated nextOrder for video ${videoDetails.id} in playlist ${playlistId}: ${nextOrder}`);
    const now = new Date().toISOString();
    const videoForDb = {
      id: videoDetails.id,
      title: videoDetails.title,
      url: videoDetails.url,
      thumbnail_url: videoDetails.thumbnail_url || null,
      duration: null,
      description: null,
      channel_title: videoDetails.channel_name || null,
      upload_date: videoDetails.upload_date || null,
      added_at: now,
      is_available: true,
      is_downloaded: false,
      local_file_path: null,
      download_status: null,
      download_progress: null,
      last_watched_at: null,
      watch_progress: null,
      channel_id: null,
      uploader_id: null
    };
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Video object for 'videos' table (videoForDb): ${JSON.stringify(videoForDb)}`);
    const insertVideoStmt = db.prepare("INSERT OR IGNORE INTO videos (id, title, url, thumbnail_url, duration, description, channel_title, upload_date, added_at, is_available, is_downloaded, local_file_path, download_status, download_progress, last_watched_at, watch_progress, channel_id, uploader_id) VALUES (@id, @title, @url, @thumbnail_url, @duration, @description, @channel_title, @upload_date, @added_at, @is_available, @is_downloaded, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @channel_id, @uploader_id)");
    const insertVideoResult = insertVideoStmt.run(videoForDb);
    logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT OR IGNORE INTO videos' for video ID ${videoDetails.id}. Changes: ${insertVideoResult.changes}`);
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to insert into 'playlist_videos'. PlaylistID: ${playlistId}, VideoID: ${videoDetails.id}, Position: ${nextOrder}, AddedAt: ${now}`);
    const insertJunctionStmt = db.prepare("INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at) VALUES (?, ?, ?, ?)");
    const insertJunctionResult = insertJunctionStmt.run(playlistId, videoDetails.id, nextOrder, now);
    logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT INTO playlist_videos' for video ID ${videoDetails.id} into playlist ${playlistId}. Changes: ${insertJunctionResult.changes}`);
    const countResult = db.prepare("SELECT COUNT(*) as count FROM playlist_videos WHERE playlist_id = ?").get(playlistId);
    const currentItemCountInJunction = countResult ? countResult.count : 0;
    logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist: Current item count from 'playlist_videos' for playlist ${playlistId} is ${currentItemCountInJunction}.`);
    logger_1.logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to update 'playlists' table. item_count: ${currentItemCountInJunction}, updated_at: ${now}, playlist_id: ${playlistId}`);
    const updatePlaylistStmt = db.prepare("UPDATE playlists SET item_count = ?, updated_at = ? WHERE id = ?");
    const updatePlaylistResult = updatePlaylistStmt.run(currentItemCountInJunction, now, playlistId);
    logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist: 'UPDATE playlists' for playlist ${playlistId}. Changes: ${updatePlaylistResult.changes}`);
    logger_1.logger.info(`[PlaylistManager] addVideoToPlaylist SUCCESS for video ${videoDetails.id} added to playlist ${playlistId}.`);
    return {
      success: true
    };
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] addVideoToPlaylist ERROR for video ${videoDetails.id} to playlist ${playlistId}: ${error.message}`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
async function removeVideoFromPlaylist(playlistId, videoId) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[PlaylistManager] removeVideoFromPlaylist called for playlist ID: ${playlistId}, video ID: ${videoId}`);
  const now = new Date().toISOString();
  try {
    const result = db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?").run(playlistId, videoId);
    if (result.changes > 0) {
      // Re-index positions for the remaining videos in the playlist
      const remainingVideos = db.prepare("SELECT video_id FROM playlist_videos WHERE playlist_id = ? ORDER BY position ASC").all(playlistId);
      db.transaction(() => {
        for (let i = 0; i < remainingVideos.length; i++) {
          db.prepare("UPDATE playlist_videos SET position = ? WHERE playlist_id = ? AND video_id = ?").run(i, playlistId, remainingVideos[i].video_id);
        }
      })();
      logger_1.logger.info(`[PlaylistManager] Re-indexed positions for playlist ID: ${playlistId} after deleting video ID: ${videoId}`);
      // Determine the new playlist thumbnail based on the video at position 0
      const firstVideoThumbnailStmt = db.prepare(`SELECT v.thumbnail_url 
         FROM videos v
         JOIN playlist_videos pv ON v.id = pv.video_id
         WHERE pv.playlist_id = ? AND pv.position = 0
         LIMIT 1`);
      const firstVideoResult = firstVideoThumbnailStmt.get(playlistId);
      const newPlaylistThumbnail = firstVideoResult ? firstVideoResult.thumbnail_url : null;
      logger_1.logger.info(`[PlaylistManager] Determined new playlist thumbnail for ${playlistId} after deletion: ${newPlaylistThumbnail}`);
      // Calculate new total duration
      let newTotalDuration = 0;
      try {
        const durationResult = db.prepare(`SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.video_id
           WHERE pv.playlist_id = ?`).get(playlistId);
        if (durationResult && durationResult.total !== null) {
          newTotalDuration = durationResult.total;
        }
      } catch (durationError) {
        logger_1.logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${playlistId} after deletion: ${durationError.message}`);
      }
      // Update playlist's item_count, thumbnail, and total_duration_seconds
      db.prepare("UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = ?), updated_at = ?, thumbnail = ?, total_duration_seconds = ? WHERE id = ?").run(playlistId, now, newPlaylistThumbnail, newTotalDuration, playlistId);
      logger_1.logger.info(`[PlaylistManager] Video ${videoId} removed from playlist ${playlistId} successfully. Playlist item_count, thumbnail, and total_duration_seconds updated.`);
      return {
        success: true
      };
    } else {
      logger_1.logger.warn(`[PlaylistManager] Video ${videoId} not found in playlist ${playlistId}, or playlist does not exist.`);
      return {
        success: false,
        error: 'Video not found in playlist.'
      };
    }
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error removing video ${videoId} from playlist ${playlistId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
async function reorderVideosInPlaylist(playlistId, videoIdsInOrder) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info('[PlaylistManager] reorderVideosInPlaylist called for playlist ID:', playlistId, 'with order:', videoIdsInOrder);
  const now = new Date().toISOString();
  try {
    db.transaction(() => {
      for (let i = 0; i < videoIdsInOrder.length; i++) {
        db.prepare("UPDATE playlist_videos SET position = ? WHERE playlist_id = ? AND video_id = ?").run(i, playlistId, videoIdsInOrder[i]);
      }
      db.prepare("UPDATE playlists SET updated_at = ? WHERE id = ?").run(now, playlistId);
    })();
    logger_1.logger.info(`[PlaylistManager] Videos reordered successfully for playlist ID: ${playlistId}`);
    return {
      success: true
    };
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error reordering videos for playlist ${playlistId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
/**
 * Retrieves all videos for a given playlist, handling both custom (JSON) and imported (junction table) playlists.
 */
async function getAllVideosForPlaylist(playlistId) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[PlaylistManager] getAllVideosForPlaylist called for playlist ID: ${playlistId}`);
  try {
    // Check if the playlist exists first
    const playlistExists = db.prepare("SELECT id FROM playlists WHERE id = ?").get(playlistId);
    if (!playlistExists) {
      logger_1.logger.warn(`[PlaylistManager] getAllVideosForPlaylist - Playlist with ID ${playlistId} not found.`);
      return null;
    }
    // All playlist types will now fetch from the playlist_videos junction table
    const videoRows = db.prepare("SELECT v.*, pv.position as position, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC").all(playlistId);
    logger_1.logger.info(`[PlaylistManager] getAllVideosForPlaylist - Fetched ${videoRows.length} video rows from playlist_videos for playlist ID: ${playlistId}`);
    const videos = videoRows.map(vRow => ({
      // Map all properties from vRow (which are snake_case from DB) to PlaylistVideo (snake_case type)
      id: vRow.id,
      url: vRow.url,
      title: vRow.title,
      channel: vRow.channel === null ? undefined : vRow.channel,
      duration: vRow.duration === null ? undefined : vRow.duration,
      thumbnail_url: vRow.thumbnail_url === null ? undefined : vRow.thumbnail_url,
      // Corrected: use thumbnail_url from vRow
      description: vRow.description === null ? undefined : vRow.description,
      channel_title: vRow.channel_title === null ? undefined : vRow.channel_title,
      upload_date: vRow.upload_date === null ? undefined : vRow.upload_date,
      is_available: vRow.is_available !== undefined ? vRow.is_available : undefined,
      // Ensure boolean or undefined
      is_downloaded: vRow.is_downloaded !== undefined ? vRow.is_downloaded : undefined,
      local_file_path: vRow.local_file_path === null ? undefined : vRow.local_file_path,
      download_status: vRow.download_status === null ? undefined : vRow.download_status,
      download_progress: vRow.download_progress === null ? undefined : vRow.download_progress,
      last_watched_at: vRow.last_watched_at === null ? undefined : vRow.last_watched_at,
      watch_progress: vRow.watch_progress === null ? undefined : vRow.watch_progress,
      added_at: vRow.added_at,
      // from videos table
      channel_id: vRow.channel_id === null ? undefined : vRow.channel_id,
      uploader_id: vRow.uploader_id === null ? undefined : vRow.uploader_id,
      // PlaylistVideo specific fields from playlist_videos table
      position: vRow.position,
      added_to_playlist_at: vRow.added_to_playlist_at
    }));
    return videos;
  } catch (error) {
    logger_1.logger.error(`[PlaylistManager] Error fetching videos for playlist ${playlistId}:`, error);
    return null; // Return null or handle error as appropriate
  }
}

/***/ }),

/***/ "./src/backend/services/settingsService.ts":
/*!*************************************************!*\
  !*** ./src/backend/services/settingsService.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function () {
  var ownKeys = function (o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
      var ar = [];
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
  };
}();
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ensureDownloadLocationExists = ensureDownloadLocationExists;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.resetSettings = resetSettings;
exports.getAllSettings = getAllSettings;
exports.getSettingsPath = getSettingsPath;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra"));
// Type placeholder for the dynamically imported class and schema type
let ElectronStoreClass; // Will hold the dynamically imported class
// Define the schema structure (remains synchronous)
const schemaDefinition = {
  downloadLocation: {
    type: 'string',
    default: path_1.default.join(electron_1.app.getPath('videos'), 'Playlistify')
  },
  maxConcurrentDownloads: {
    type: 'number',
    default: 3,
    minimum: 1,
    maximum: 10
  },
  defaultQuality: {
    type: 'string',
    enum: ['best', '4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'],
    default: '1080p'
  },
  downloadFormat: {
    type: 'string',
    enum: ['mp4', 'webm', 'mp3', 'opus', 'flac', 'wav', 'best'],
    default: 'mp4'
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark'],
    default: 'dark'
  },
  notifyOnDownloadComplete: {
    type: 'boolean',
    default: true
  },
  autoStartDownloads: {
    type: 'boolean',
    default: false
  },
  minimizeToTray: {
    type: 'boolean',
    default: false
  },
  developerMode: {
    type: 'boolean',
    default: false
  }
};
// Store instance - initialized asynchronously
let store = null;
let storeInitializationPromise = null;
/**
 * Initializes the electron-store instance using dynamic import.
 */
async function initializeStore() {
  if (store) return;
  if (storeInitializationPromise) return storeInitializationPromise;
  storeInitializationPromise = (async () => {
    try {
      const ImportedElectronStore = (await Promise.resolve().then(() => __importStar(__webpack_require__(/*! electron-store */ "electron-store")))).default;
      ElectronStoreClass = ImportedElectronStore;
      store = new ImportedElectronStore({
        schema: schemaDefinition,
        name: 'playlistify-settings',
        cwd: electron_1.app.getPath('userData'),
        fileExtension: 'json',
        clearInvalidConfig: true
      });
      console.log('Electron-store initialized dynamically.');
      setupListeners();
      await ensureDownloadLocationExists();
    } catch (error) {
      console.error('Failed to dynamically import or initialize electron-store:', error);
      storeInitializationPromise = Promise.reject(error);
      throw error;
    }
  })();
  return storeInitializationPromise;
}
/**
 * Helper function to ensure the store is initialized before use.
 */
async function ensureStoreInitialized() {
  if (!store) {
    await initializeStore();
  }
  if (!store) {
    throw new Error("Store could not be initialized.");
  }
  return store;
}
/**
 * Ensures the configured download location exists.
 */
async function ensureDownloadLocationExists() {
  if (!store) {
    const defaultLoc = schemaDefinition.downloadLocation?.default;
    if (defaultLoc) {
      try {
        await fs_extra_1.default.ensureDir(defaultLoc);
        console.log(`Ensured default download directory exists: ${defaultLoc}`);
      } catch (error) {
        console.error(`Failed to ensure default download directory ${defaultLoc}:`, error);
      }
    }
    return;
  }
  const currentStore = await ensureStoreInitialized();
  const downloadLocation = currentStore.get('downloadLocation');
  try {
    await fs_extra_1.default.ensureDir(downloadLocation);
    console.log(`Ensured download directory exists: ${downloadLocation}`);
  } catch (error) {
    console.error(`Failed to ensure download directory ${downloadLocation}:`, error);
  }
}
/**
 * Gets a setting value.
 */
async function getSetting(key, defaultValue) {
  const currentStore = await ensureStoreInitialized();
  if (defaultValue !== undefined) {
    return currentStore.get(key, defaultValue);
  } else {
    return currentStore.get(key);
  }
}
/**
 * Sets a setting value.
 */
async function setSetting(key, value) {
  const currentStore = await ensureStoreInitialized();
  currentStore.set(key, value);
  console.log(`Setting updated: ${key} =`, value);
}
/**
 * Resets all settings to their default values defined in the schema.
 */
async function resetSettings() {
  const currentStore = await ensureStoreInitialized();
  for (const key in schemaDefinition) {
    if (Object.prototype.hasOwnProperty.call(schemaDefinition, key)) {
      const typedKey = key;
      const property = schemaDefinition[typedKey];
      if (property && property.default !== undefined) {
        currentStore.set(typedKey, property.default);
      } else {
        currentStore.delete(typedKey);
      }
    }
  }
  console.log('All settings reset to defaults.');
  await ensureDownloadLocationExists();
}
/**
 * Gets all current settings.
 */
async function getAllSettings() {
  const currentStore = await ensureStoreInitialized();
  return currentStore.store;
}
/**
 * Sets up listeners for setting changes (e.g., theme changes).
 */
function setupListeners() {
  if (!store) return;
  store.onDidChange('theme', (newValue, oldValue) => {
    console.log(`Theme changed from ${oldValue ?? 'undefined'} to ${newValue ?? 'undefined'}`);
  });
}
/**
 * Gets the file path where settings are stored.
 */
async function getSettingsPath() {
  const currentStore = await ensureStoreInitialized();
  return currentStore.path;
}
// This service seems more focused on application preferences.

/***/ }),

/***/ "./src/backend/services/thumbnail-manager.ts":
/*!***************************************************!*\
  !*** ./src/backend/services/thumbnail-manager.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getThumbnailForVideo = getThumbnailForVideo;
exports.getThumbnailForPlaylist = getThumbnailForPlaylist;
exports.clearThumbnailCache = clearThumbnailCache;
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra")); // Use fs-extra for ensureDir and streams
const electron_1 = __webpack_require__(/*! electron */ "electron"); // To get user data path
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts"); // Import logger
const THUMBNAIL_CACHE_DIR = path_1.default.join(electron_1.app.getPath('userData'), 'thumbnails');
// Define standard YouTube thumbnail filenames in order of preference/quality
const YT_THUMBNAIL_FILES = ['maxresdefault.jpg',
// May not always exist
'sddefault.jpg',
// Standard definition
'hqdefault.jpg',
// High quality
'mqdefault.jpg',
// Medium quality
'default.jpg' // Low quality (guaranteed to exist)
];
// Helper to generate YouTube thumbnail URLs
function generateYtThumbnailUrl(videoId, filename) {
  return `https://i.ytimg.com/vi/${videoId}/${filename}`;
}
// Helper to safely get file extension
function getFileExtension(url) {
  try {
    const parsedUrl = new URL(url);
    const ext = path_1.default.extname(parsedUrl.pathname).toLowerCase();
    // Basic validation for common image types
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return ext;
    }
  } catch (error) {
    logger_1.logger.warn('[ThumbnailManager] Could not parse URL to get extension:', url, error);
  }
  return '.jpg'; // Default to .jpg
}
// This service would handle fetching/generating and caching thumbnails.
// For fetching, it might use yt-dlp to get a thumbnail URL or download the thumbnail.
// For caching, it might store them locally and return file paths or base64 strings.
async function getThumbnailForVideo(videoId, thumbnailUrl) {
  logger_1.logger.info('[ThumbnailManager] getThumbnailForVideo called (currently NO-OP for previews) for video ID:', videoId, 'URL:', thumbnailUrl);
  /*
  // Logic for downloading and caching thumbnails is currently bypassed for previews.
  // This will be re-evaluated when implementing video download functionality.
     // Original logic:
  logger.debug(\'[ThumbnailManager] Received thumbnail URL:\', thumbnailUrl);
     if (!thumbnailUrl) {
    logger.warn(\'[ThumbnailManager] No thumbnail URL provided for video:\', videoId);
    return { success: false, data: null, error: \'No thumbnail URL provided.\' };
  }
     try {
    await fs.ensureDir(THUMBNAIL_CACHE_DIR);
    logger.debug(\'[ThumbnailManager] Ensured cache directory exists:\', THUMBNAIL_CACHE_DIR);
       const fileExtension = getFileExtension(thumbnailUrl);
    const cachedFilePath = path.join(THUMBNAIL_CACHE_DIR, `${videoId}${fileExtension}`);
    logger.debug(\'[ThumbnailManager] Target cache path:\', cachedFilePath);
       if (await fs.pathExists(cachedFilePath)) {
      logger.info(\'[ThumbnailManager] Thumbnail found in cache for video ID:\', videoId, cachedFilePath);
      return { success: true, data: cachedFilePath };
    }
       logger.info(\'[ThumbnailManager] Thumbnail not cached. Attempting downloads...\');
    
    let response: Response | null = null;
    let downloadedFromUrl: string | null = thumbnailUrl;
    let foundThumbnail = false;
       if (downloadedFromUrl) {
        try {
            logger.debug(\'[ThumbnailManager] Trying initial URL:\', downloadedFromUrl);
            response = await fetch(downloadedFromUrl);
            if (response.ok && response.body) {
                foundThumbnail = true;
            } else if (response.status === 404) {
                logger.warn(`[ThumbnailManager] Initial URL (${downloadedFromUrl}) returned 404. Trying fallbacks.`);
                response = null;
            } else {
                throw new Error(`Failed to download thumbnail: ${response.status} ${response.statusText}`);
            }
        } catch (fetchError: any) {
             logger.error(\'[ThumbnailManager] Error fetching initial thumbnail URL:\', downloadedFromUrl, fetchError);
             response = null;
        }
    }
       if (!foundThumbnail) {
      downloadedFromUrl = null;
      for (const filename of YT_THUMBNAIL_FILES) {
        const fallbackUrl = generateYtThumbnailUrl(videoId, filename);
        logger.debug(\'[ThumbnailManager] Trying fallback URL:\', fallbackUrl);
        try {
          response = await fetch(fallbackUrl);
          if (response.ok && response.body) {
            logger.info(\'[ThumbnailManager] Found working thumbnail URL via fallback:\', fallbackUrl);
            downloadedFromUrl = fallbackUrl;
            foundThumbnail = true;
            break;
          }
          logger.warn(`[ThumbnailManager] Fallback URL ${fallbackUrl} failed with status ${response.status}`);
        } catch (fallbackError: any) {
          logger.error(\'[ThumbnailManager] Error fetching fallback thumbnail URL:\', fallbackUrl, fallbackError);
        }
      }
    }
       if (!foundThumbnail || !response || !response.body || !downloadedFromUrl) {
      logger.error(\'[ThumbnailManager] All thumbnail download attempts failed for video ID:\', videoId);
      throw new Error(\'Failed to download thumbnail after trying all fallbacks.\');
    }
       logger.info(\'[ThumbnailManager] Downloading from confirmed URL:\', downloadedFromUrl);
    const fileWriteStream = fs.createWriteStream(cachedFilePath);
    const reader = response.body.getReader();
    const nodeReadable = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        } catch (err) {
          this.destroy(err as Error);
        }
      }
    });
       await pipeline(nodeReadable, fileWriteStream);
       logger.info(\'[ThumbnailManager] Successfully downloaded and cached thumbnail:\', cachedFilePath);
    return { success: true, data: cachedFilePath };
     } catch (error: any) {
    logger.error(\'[ThumbnailManager] Error processing thumbnail for video ID\', videoId, error);
    return { success: false, data: null, error: error.message || \'Failed to process thumbnail\' };
  }
  */
  // Return a placeholder indicating no operation for now, matching expected type.
  return {
    success: true,
    data: null,
    message: 'Thumbnail processing deferred.'
  };
}
/**
 * Gets a representative thumbnail for a playlist.
 * @param playlistId The ID of the playlist.
 * @returns Promise<IpcResponse<string | null>> Path to the thumbnail or null.
 */
async function getThumbnailForPlaylist(playlistId) {
  logger_1.logger.info('[ThumbnailManager] getThumbnailForPlaylist called for playlist ID:', playlistId);
  // TODO: Implement playlist thumbnail logic:
  // 1. Fetch playlist details (e.g., from playlist-manager.ts) to get its videos.
  // 2. Pick a video (e.g., the first one) and get its thumbnail using getThumbnailForVideo.
  // 3. Or, if playlists can have their own custom thumbnails, check for that.
  // For now, return null as it's not implemented
  return {
    success: true,
    data: null,
    message: 'Playlist thumbnail retrieval not implemented yet.'
  };
}
/**
 * Clears the local thumbnail cache directory.
 * @returns Promise<IpcResponse<void>>
 */
async function clearThumbnailCache() {
  logger_1.logger.info('[ThumbnailManager] clearThumbnailCache called');
  try {
    // Cache path is currently fixed, defined by THUMBNAIL_CACHE_DIR.
    // If dynamic paths based on settings are needed later, this logic would change.
    await fs_extra_1.default.emptyDir(THUMBNAIL_CACHE_DIR); // Use fs-extra's emptyDir
    logger_1.logger.info('[ThumbnailManager] Thumbnail cache cleared successfully at:', THUMBNAIL_CACHE_DIR);
    return {
      success: true
    };
  } catch (error) {
    // Log specific error if possible (e.g., permissions)
    let errorMessage = 'Failed to clear cache';
    if (error.code === 'EACCES') {
      errorMessage = 'Permission denied when trying to clear cache';
      logger_1.logger.error(`[ThumbnailManager] ${errorMessage} at ${THUMBNAIL_CACHE_DIR}`, error);
    } else {
      logger_1.logger.error('[ThumbnailManager] Failed to clear thumbnail cache:', error);
    }
    return {
      success: false,
      error: `${errorMessage}: ${error.message}`
    };
  }
}
// Ensure the cache directory exists on startup (optional, handled by getThumbnailForVideo currently)
// fs.ensureDirSync(THUMBNAIL_CACHE_DIR); 
// logger.info('[ThumbnailManager] Cache directory ensured at:', THUMBNAIL_CACHE_DIR);

/***/ }),

/***/ "./src/backend/services/youtube-import-service.ts":
/*!********************************************************!*\
  !*** ./src/backend/services/youtube-import-service.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function () {
  var ownKeys = function (o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
      var ar = [];
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
  };
}();
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.importPlaylistFromUrl = importPlaylistFromUrl;
exports.importYouTubePlaylist = importYouTubePlaylist;
const ytDlpManager = __importStar(__webpack_require__(/*! ./ytDlpManager */ "./src/backend/services/ytDlpManager.ts"));
// YtDlpPlaylistMetadata type might not be needed if ytDlpManager.importPlaylist returns Playlist directly
// import { YtDlpPlaylistMetadata } from '../../shared/types/yt-dlp'; 
const db_1 = __webpack_require__(/*! ../databases/db */ "./src/backend/databases/db.ts"); // Corrected path
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
// Service for handling YouTube playlist imports
/**
 * Imports a playlist from a YouTube URL.
 * Fetches metadata using ytDlpManager, processes it, and saves it to the database.
 * @param url The YouTube playlist URL.
 * @returns An IpcResponse containing the imported playlist or null if failed.
 */
async function importPlaylistFromUrl(url) {
  logger_1.logger.info(`[YouTubeImportService] Starting import for URL: ${url}`);
  const db = (0, db_1.getDB)();
  let playlistDataFromYtDlp = null;
  try {
    playlistDataFromYtDlp = await ytDlpManager.importPlaylist(url);
    if (!playlistDataFromYtDlp || !playlistDataFromYtDlp.id) {
      logger_1.logger.error('[YouTubeImportService] Failed to fetch valid playlist metadata from ytDlpManager or playlist is missing ID.');
      return {
        success: false,
        error: 'Failed to fetch playlist metadata from YouTube.',
        data: null
      };
    }
    logger_1.logger.info(`[YouTubeImportService] Fetched playlist metadata: ${playlistDataFromYtDlp.name} (ID: ${playlistDataFromYtDlp.id}) with ${playlistDataFromYtDlp.videos?.length || 0} videos.`);
    const existingPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ? OR source_url = ?");
    const existingDataFromDB = existingPlaylistStmt.get(playlistDataFromYtDlp.id, playlistDataFromYtDlp.source_url || url);
    if (existingDataFromDB) {
      logger_1.logger.warn(`[YouTubeImportService] Playlist already exists in DB (ID: ${playlistDataFromYtDlp.id}). Returning existing.`);
      const videosFromDBStmt = db.prepare(`SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC`);
      const videosFromDB = videosFromDBStmt.all(existingDataFromDB.id);
      const existingPlaylistForReturn = {
        ...existingDataFromDB,
        videos: videosFromDB
      };
      return {
        success: true,
        data: existingPlaylistForReturn,
        message: 'Playlist already exists.'
      };
    }
    const now = new Date().toISOString();
    const playlistToInsertForDB = {
      id: playlistDataFromYtDlp.id,
      name: playlistDataFromYtDlp.name || 'Untitled Playlist',
      description: playlistDataFromYtDlp.description || null,
      thumbnail: playlistDataFromYtDlp.thumbnail || null,
      source_url: playlistDataFromYtDlp.source_url || url,
      source: 'youtube',
      item_count: playlistDataFromYtDlp.videos?.length || 0,
      created_at: playlistDataFromYtDlp.created_at || now,
      updated_at: playlistDataFromYtDlp.updated_at || now,
      youtube_playlist_id: playlistDataFromYtDlp.id,
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || 0
    };
    const videosToInsert = playlistDataFromYtDlp.videos || [];
    db.transaction(() => {
      const insertPlaylistStmt = db.prepare(`INSERT INTO playlists (id, name, description, thumbnail, source_url, source, item_count, created_at, updated_at, youtube_playlist_id, total_duration_seconds)
         VALUES (@id, @name, @description, @thumbnail, @source_url, @source, @item_count, @created_at, @updated_at, @youtube_playlist_id, @total_duration_seconds)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           thumbnail = excluded.thumbnail, 
           item_count = excluded.item_count,
           updated_at = excluded.updated_at,
           total_duration_seconds = excluded.total_duration_seconds,
           youtube_playlist_id = excluded.youtube_playlist_id`);
      insertPlaylistStmt.run(playlistToInsertForDB);
      if (videosToInsert.length > 0) {
        const insertVideoStmt = db.prepare(`INSERT INTO videos (id, title, url, thumbnail_url, duration, description, channel_title, upload_date, added_at, is_available, local_file_path, download_status, download_progress, last_watched_at, watch_progress, channel_id, uploader_id)
           VALUES (@id, @title, @url, @thumbnail_url, @duration, @description, @channel_title, @upload_date, @added_at, @is_available, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @channel_id, @uploader_id)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             url = excluded.url,
             thumbnail_url = excluded.thumbnail_url,
             duration = excluded.duration,
             description = excluded.description,
             channel_title = excluded.channel_title,
             upload_date = excluded.upload_date,
             is_available = excluded.is_available,
             channel_id = excluded.channel_id,
             uploader_id = excluded.uploader_id`);
        const insertPlaylistVideoStmt = db.prepare(`INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at)
           VALUES (?, ?, ?, ?)`);
        videosToInsert.forEach((video, index) => {
          const videoForDb = {
            id: video.id,
            title: video.title || 'Untitled Video',
            url: video.url,
            thumbnail_url: video.thumbnail_url || null,
            // Using thumbnail_url from Video type
            duration: video.duration !== undefined ? video.duration : null,
            description: video.description || null,
            channel_title: video.channel_title || null,
            upload_date: video.upload_date || null,
            added_at: video.added_at || now,
            is_available: video.is_available !== undefined ? video.is_available : true,
            local_file_path: video.local_file_path || null,
            download_status: video.download_status || null,
            download_progress: video.download_progress || null,
            last_watched_at: video.last_watched_at || null,
            watch_progress: video.watch_progress || null,
            channel_id: video.channel_id || null,
            uploader_id: video.uploader_id || null
          };
          insertVideoStmt.run(videoForDb);
          insertPlaylistVideoStmt.run(playlistToInsertForDB.id, video.id, index, now);
        });
      }
    })();
    logger_1.logger.info(`[YouTubeImportService] Successfully imported and saved playlist: ${playlistDataFromYtDlp.name}`);
    return {
      success: true,
      data: playlistDataFromYtDlp
    };
  } catch (error) {
    logger_1.logger.error(`[YouTubeImportService] Error importing playlist from URL ${url}:`, error);
    if (playlistDataFromYtDlp === null && error.message.includes("properties of null")) {
      logger_1.logger.warn('[YouTubeImportService] Error likely due to playlistDataFromYtDlp being null and accessed.');
      return {
        success: false,
        error: 'Playlist metadata was empty or could not be processed by ytDlpManager.',
        data: null
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to import playlist from URL',
      data: null
    };
  }
}
async function importYouTubePlaylist(url, customName) {
  const db = (0, db_1.getDB)();
  logger_1.logger.info(`[YouTubeImportService] Starting import for URL: ${url}${customName ? ` (Custom Name: ${customName})` : ''}`);
  const playlistDataFromYtDlp = await ytDlpManager.importPlaylist(url, customName);
  if (!playlistDataFromYtDlp) {
    throw new Error('Failed to fetch playlist data from YouTube.');
  }
  const existingPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ? OR source_url = ?");
  const existingDataFromDB = existingPlaylistStmt.get(playlistDataFromYtDlp.id, playlistDataFromYtDlp.source_url || url);
  let playlistIdToUse;
  const now = new Date().toISOString();
  if (existingDataFromDB) {
    logger_1.logger.info(`[YouTubeImportService] Playlist with ID ${existingDataFromDB.id} or source_url ${playlistDataFromYtDlp.source_url || url} already exists. Comparing video counts...`);
    playlistIdToUse = existingDataFromDB.id;
    const updatedPlaylistRecord = {
      id: playlistIdToUse,
      name: customName || playlistDataFromYtDlp.name || existingDataFromDB.name,
      description: playlistDataFromYtDlp.description || existingDataFromDB.description,
      thumbnail: playlistDataFromYtDlp.thumbnail || existingDataFromDB.thumbnail,
      source: 'youtube',
      item_count: playlistDataFromYtDlp.videos?.length || existingDataFromDB.item_count,
      youtube_playlist_id: playlistDataFromYtDlp.youtube_playlist_id || existingDataFromDB.youtube_playlist_id,
      source_url: playlistDataFromYtDlp.source_url || existingDataFromDB.source_url || url,
      created_at: existingDataFromDB.created_at,
      updated_at: now,
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || existingDataFromDB.total_duration_seconds || 0
    };
    db.prepare(`UPDATE playlists SET 
        name = @name, 
        description = @description, 
        thumbnail = @thumbnail, 
        item_count = @item_count, 
        source_url = @source_url, 
        youtube_playlist_id = @youtube_playlist_id, 
        updated_at = @updated_at,
        total_duration_seconds = @total_duration_seconds
       WHERE id = @id`).run(updatedPlaylistRecord);
    logger_1.logger.info(`[YouTubeImportService] Updated existing playlist metadata for ID: ${playlistIdToUse}`);
  } else {
    playlistIdToUse = playlistDataFromYtDlp.id;
    const playlistRecord = {
      id: playlistIdToUse,
      name: customName || playlistDataFromYtDlp.name,
      description: playlistDataFromYtDlp.description,
      thumbnail: playlistDataFromYtDlp.thumbnail,
      source_url: playlistDataFromYtDlp.source_url || url,
      source: 'youtube',
      item_count: playlistDataFromYtDlp.videos?.length || 0,
      created_at: playlistDataFromYtDlp.created_at || now,
      updated_at: playlistDataFromYtDlp.updated_at || now,
      youtube_playlist_id: playlistDataFromYtDlp.youtube_playlist_id || playlistDataFromYtDlp.id,
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || 0
    };
    try {
      db.prepare(`INSERT INTO playlists (id, name, description, thumbnail, source_url, source, item_count, created_at, updated_at, youtube_playlist_id, total_duration_seconds)
         VALUES (@id, @name, @description, @thumbnail, @source_url, @source, @item_count, @created_at, @updated_at, @youtube_playlist_id, @total_duration_seconds)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           thumbnail = excluded.thumbnail,
           source_url = excluded.source_url,
           item_count = excluded.item_count,
           updated_at = excluded.updated_at,
           total_duration_seconds = excluded.total_duration_seconds,
           youtube_playlist_id = excluded.youtube_playlist_id`).run(playlistRecord);
      logger_1.logger.info(`[YouTubeImportService] New playlist created in DB with ID: ${playlistIdToUse}`);
    } catch (dbError) {
      logger_1.logger.error(`[YouTubeImportService] Error inserting/updating playlist in DB for ID ${playlistIdToUse}: ${dbError.message}`, dbError);
      throw dbError;
    }
  }
  const videosFromYtDlp = playlistDataFromYtDlp.videos || [];
  if (videosFromYtDlp.length > 0) {
    db.transaction(() => {
      const upsertVideoStmt = db.prepare(`INSERT INTO videos (id, title, url, duration, thumbnail_url, description, channel_id, channel_title, upload_date, added_at, is_available, local_file_path, download_status, download_progress, last_watched_at, watch_progress, uploader_id)
         VALUES (@id, @title, @url, @duration, @thumbnail_url, @description, @channel_id, @channel_title, @upload_date, @added_at, @is_available, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @uploader_id)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           duration = excluded.duration,
           thumbnail_url = excluded.thumbnail_url,
           description = excluded.description,
           channel_id = excluded.channel_id,
           channel_title = excluded.channel_title,
           upload_date = excluded.upload_date,
           is_available = excluded.is_available,
           uploader_id = excluded.uploader_id`);
      const deleteOldPlaylistVideosStmt = db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ?");
      deleteOldPlaylistVideosStmt.run(playlistIdToUse);
      const insertPlaylistVideoStmt = db.prepare(`INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at)
         VALUES (?, ?, ?, ?)`);
      videosFromYtDlp.forEach((videoData, index) => {
        const videoRecord = {
          id: videoData.id,
          title: videoData.title || 'Untitled Video',
          url: videoData.url,
          duration: videoData.duration || null,
          thumbnail_url: videoData.thumbnail_url || null,
          // Consistent with Video type
          description: videoData.description || null,
          channel_id: videoData.channel_id || null,
          channel_title: videoData.channel_title || null,
          upload_date: videoData.upload_date || null,
          added_at: videoData.added_at || now,
          is_available: videoData.is_available !== undefined ? videoData.is_available : true,
          local_file_path: videoData.local_file_path || null,
          download_status: videoData.download_status || null,
          download_progress: videoData.download_progress || null,
          last_watched_at: videoData.last_watched_at || null,
          watch_progress: videoData.watch_progress || null,
          uploader_id: videoData.uploader_id || null
        };
        upsertVideoStmt.run(videoRecord);
        insertPlaylistVideoStmt.run(playlistIdToUse, videoData.id, index, now);
      });
    })();
    logger_1.logger.info(`[YouTubeImportService] Upserted ${videosFromYtDlp.length} videos and their playlist associations for playlist ID: ${playlistIdToUse}`);
  }
  const videosForDurationCalcStmt = db.prepare(`SELECT v.duration 
     FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id 
     WHERE pv.playlist_id = ?`);
  const videosInDb = videosForDurationCalcStmt.all(playlistIdToUse);
  const newTotalDuration = videosInDb.reduce((sum, v) => sum + (v.duration || 0), 0);
  db.prepare("UPDATE playlists SET total_duration_seconds = ?, item_count = ? WHERE id = ?").run(newTotalDuration, videosInDb.length, playlistIdToUse);
  logger_1.logger.info(`[YouTubeImportService] Recalculated total_duration_seconds to ${newTotalDuration} and item_count to ${videosInDb.length} for playlist ID: ${playlistIdToUse}`);
  const finalPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ?");
  const finalPlaylistDataFromDb = finalPlaylistStmt.get(playlistIdToUse);
  if (!finalPlaylistDataFromDb) {
    throw new Error('Failed to retrieve final playlist data from DB after import.');
  }
  const finalVideosStmt = db.prepare(`SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at 
     FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id 
     WHERE pv.playlist_id = ? ORDER BY pv.position ASC`);
  const finalVideos = finalVideosStmt.all(playlistIdToUse);
  const importedPlaylist = {
    ...finalPlaylistDataFromDb,
    videos: finalVideos
  };
  logger_1.logger.info(`[YouTubeImportService] Successfully completed import for playlist ID: ${importedPlaylist.id}`);
  return importedPlaylist;
}

/***/ }),

/***/ "./src/backend/services/youtube-playlist-preview-service.ts":
/*!******************************************************************!*\
  !*** ./src/backend/services/youtube-playlist-preview-service.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.fetchYouTubePlaylistPreview = fetchYouTubePlaylistPreview;
const ytDlpManager_1 = __webpack_require__(/*! ./ytDlpManager */ "./src/backend/services/ytDlpManager.ts");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
async function fetchYouTubePlaylistPreview(playlistUrl) {
  let overrideArgs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  logger_1.logger.info(`[YouTubePlaylistPreviewService] Fetching quick preview for URL: ${playlistUrl}`);
  const functionStartTime = performance.now();
  try {
    const simplifiedUrl = (0, ytDlpManager_1.simplifyPlaylistUrl)(playlistUrl);
    const {
      ytDlpInstance,
      ytDlpBinaryPath
    } = await (0, ytDlpManager_1.ensureYtDlpBinaryIsReady)();
    // Perform calls concurrently
    const [shellInfoResult, durationsResult] = await Promise.all([(0, ytDlpManager_1.fetchPlaylistShellInfoWithYtDlp)(simplifiedUrl, overrideArgs, ytDlpInstance, ytDlpBinaryPath), (0, ytDlpManager_1.fetchPlaylistVideoDurationsWithYtDlp)(simplifiedUrl, ytDlpInstance, ytDlpBinaryPath) // overrideArgs not typically needed for duration print
    ]);
    if (!shellInfoResult && (!durationsResult || durationsResult.videoCountFromDurations === 0)) {
      logger_1.logger.warn(`[YouTubePlaylistPreviewService] Both shell info and duration fetching failed or yielded no data for ${simplifiedUrl}`);
      return null;
    }
    let totalDurationSec = 0;
    let videoCount = 0;
    let isDurationApproximate = !durationsResult?.isDurationSummationComplete; // If undefined, it's approximate
    if (durationsResult) {
      totalDurationSec = durationsResult.durations.reduce((acc, dur) => acc + dur, 0);
      videoCount = durationsResult.videoCountFromDurations;
    }
    // Use shellInfo for primary metadata and override videoCount if shell info has a more reliable count
    const playlistId = shellInfoResult?.id || simplifiedUrl;
    const title = shellInfoResult?.title || 'Unknown Playlist';
    const uploader = shellInfoResult?.uploader || shellInfoResult?.channel;
    const webpage_url = shellInfoResult?.webpage_url;
    let bestThumbnailUrl = undefined;
    if (shellInfoResult?.thumbnails && shellInfoResult.thumbnails.length > 0) {
      bestThumbnailUrl = (0, ytDlpManager_1.getBestThumbnail)(shellInfoResult.thumbnails);
    }
    if (!bestThumbnailUrl && shellInfoResult?.thumbnail) {
      // Fallback to single thumbnail string
      bestThumbnailUrl = shellInfoResult.thumbnail;
    }
    // Consolidate video count and approximation status
    if (shellInfoResult && typeof shellInfoResult.playlist_count === 'number') {
      if (videoCount !== shellInfoResult.playlist_count) {
        logger_1.logger.warn(`[YouTubePlaylistPreviewService] Video count mismatch for ${simplifiedUrl}: shell info count (${shellInfoResult.playlist_count}), duration lines count (${videoCount}).`);
        isDurationApproximate = true; // Mismatch implies approximation
      }
      videoCount = Math.max(videoCount, shellInfoResult.playlist_count); // Prefer higher count
    } else if (!durationsResult) {
      // If durationsResult failed, playlist_count from shell is our only hope
      isDurationApproximate = true; // Cannot be sure without duration data
      videoCount = shellInfoResult?.playlist_count || 0;
    }
    const previewData = {
      id: playlistId,
      title: title,
      thumbnailUrl: bestThumbnailUrl,
      videoCount: videoCount,
      total_duration_seconds: totalDurationSec,
      uploader: uploader,
      webpage_url: webpage_url,
      isDurationApproximate: isDurationApproximate
    };
    const overallDuration = performance.now() - functionStartTime;
    logger_1.logger.info(`[YouTubePlaylistPreviewService] Successfully prepared quick preview for ${previewData.title} (${previewData.id}) in ${overallDuration.toFixed(2)}ms`);
    return previewData;
  } catch (error) {
    const overallDuration = performance.now() - functionStartTime;
    logger_1.logger.error(`[YouTubePlaylistPreviewService] Error fetching playlist preview for ${playlistUrl} after ${overallDuration.toFixed(2)}ms: ${error.message}`, error);
    return null;
  }
}

/***/ }),

/***/ "./src/backend/services/youtube-video-preview-service.ts":
/*!***************************************************************!*\
  !*** ./src/backend/services/youtube-video-preview-service.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.cleanYouTubeVideoUrl = cleanYouTubeVideoUrl;
exports.fetchYouTubeVideoPreview = fetchYouTubeVideoPreview;
const ytDlpManager_1 = __webpack_require__(/*! ./ytDlpManager */ "./src/backend/services/ytDlpManager.ts");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts");
// The frontend for "Add Video to Playlist" dialog uses YtDlpVideoInfoRaw for preview
// so we can directly return that type if getVideoMetadata provides it.
function cleanYouTubeVideoUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if ((parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') && parsedUrl.pathname === '/watch') {
      const videoId = parsedUrl.searchParams.get('v');
      if (videoId) {
        logger_1.logger.debug(`[YouTubeVideoPreviewService] Cleaning URL. Original: ${url}, Cleaned: https://www.youtube.com/watch?v=${videoId}`);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } else if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.substring(1); // Remove leading '/'
      if (videoId) {
        logger_1.logger.debug(`[YouTubeVideoPreviewService] Cleaning youtu.be URL. Original: ${url}, Cleaned: https://www.youtube.com/watch?v=${videoId}`);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
  } catch (e) {
    logger_1.logger.warn(`[YouTubeVideoPreviewService] Failed to parse or clean URL: ${url}`, e);
    // Fallback to original URL if parsing/cleaning fails
  }
  return url; // Return original if not a recognized YouTube video URL or if cleaning fails
}
async function fetchYouTubeVideoPreview(videoUrl) {
  logger_1.logger.info(`[YouTubeVideoPreviewService] Fetching video preview for raw URL: ${videoUrl}`);
  if (!videoUrl || typeof videoUrl !== 'string') {
    logger_1.logger.warn('[YouTubeVideoPreviewService] Invalid videoUrl received.');
    return null;
  }
  const cleanedVideoUrl = cleanYouTubeVideoUrl(videoUrl);
  // No change in logging here as getVideoMetadata will log the URL it receives.
  try {
    const metadata = await (0, ytDlpManager_1.getVideoMetadata)(cleanedVideoUrl);
    if (metadata) {
      logger_1.logger.info(`[YouTubeVideoPreviewService] Successfully fetched metadata for: ${metadata.title} (using URL: ${cleanedVideoUrl})`);
      return metadata;
    } else {
      logger_1.logger.warn(`[YouTubeVideoPreviewService] No metadata returned for cleaned URL: ${cleanedVideoUrl} (original: ${videoUrl})`);
      return null;
    }
  } catch (error) {
    logger_1.logger.error(`[YouTubeVideoPreviewService] Error fetching video metadata for cleaned URL ${cleanedVideoUrl} (original: ${videoUrl}): ${error.message}`, error);
    return null;
  }
}

/***/ }),

/***/ "./src/backend/services/ytDlpManager.ts":
/*!**********************************************!*\
  !*** ./src/backend/services/ytDlpManager.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getBestThumbnail = getBestThumbnail;
exports.simplifyPlaylistUrl = simplifyPlaylistUrl;
exports.getYtDlpInstance = getYtDlpInstance;
exports.fetchPlaylistShellInfoWithYtDlp = fetchPlaylistShellInfoWithYtDlp;
exports.fetchPlaylistVideoDurationsWithYtDlp = fetchPlaylistVideoDurationsWithYtDlp;
exports.getPlaylistMetadata = getPlaylistMetadata;
exports.getVideoMetadata = getVideoMetadata;
exports.importPlaylist = importPlaylist;
exports.ensureYtDlpBinaryIsReady = ensureYtDlpBinaryIsReady;
const yt_dlp_wrap_1 = __importDefault(__webpack_require__(/*! yt-dlp-wrap */ "yt-dlp-wrap"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra"));
const pathUtils_1 = __webpack_require__(/*! ../utils/pathUtils */ "./src/backend/utils/pathUtils.ts");
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/backend/utils/logger.ts"); // Assuming logger exists and is correctly typed
const config_1 = __webpack_require__(/*! ../../shared/constants/config */ "./src/shared/constants/config.ts");
const chalk_1 = __importDefault(__webpack_require__(/*! chalk */ "chalk")); // Standard library for console colors
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const c = chalk_1.default; // Assign chalk to c for brevity if that was the intention
let ytDlpWrapInstancePromise = null;
let ytDlpWrapInstance = null;
let ytDlpBinaryPath = '';
// New preferred order for returning a thumbnail URL.
// This list is ordered from most preferred (most reliable and decent quality)
// to least preferred.
const PREFERRED_THUMBNAIL_URL_KEYS_IN_ORDER = ['sddefault.jpg',
// 640x480 - Often available and good quality
'hqdefault.jpg',
// 480x360 - Widely available
'mqdefault.jpg',
// 320x180 - Lower quality but usually available
'maxresdefault.jpg',
// 1280x720 - Highest quality, but sometimes 404s
'default.jpg' // 120x90  - Lowest quality, standard fallback
];
// Helper function to map YtDlpVideoInfoRaw to Video
function mapRawVideoToVideo(rawVideo, index) {
  const video = {
    id: rawVideo.id,
    url: rawVideo.webpage_url || rawVideo.original_url || rawVideo.id,
    // Fallback logic for URL
    title: rawVideo.title,
    thumbnail_url: getBestThumbnail(rawVideo.thumbnails) || rawVideo.thumbnail,
    duration: rawVideo.duration,
    description: rawVideo.description,
    channel_title: rawVideo.uploader || rawVideo.channel,
    // Prefer uploader
    uploader_id: rawVideo.uploader_id || rawVideo.channel_id,
    channel_id: rawVideo.channel_id || rawVideo.uploader_id,
    // Ensure channel_id is populated
    upload_date: rawVideo.upload_date,
    // Assuming YYYYMMDD, Video type takes string
    // Playlist context fields (can be overridden if video is part of a specific playlist instance later)
    position_in_playlist: rawVideo.playlist_index !== undefined ? rawVideo.playlist_index : index !== undefined ? index + 1 : undefined,
    // added_to_playlist_at for a specific playlist instance is set when adding to that playlist,
    // not globally here. This video object is a general representation.
    // Local state fields (defaults, to be updated by other services)
    is_available: true,
    // Assume available unless determined otherwise
    is_downloaded: false,
    local_file_path: undefined,
    download_status: undefined,
    download_progress: undefined,
    last_watched_at: undefined,
    watch_progress: undefined,
    added_at: new Date().toISOString() // When first seen/imported by this system
  };
  return video;
}
function getBestThumbnail(thumbnails) {
  if (!thumbnails || thumbnails.length === 0) {
    logger_1.logger.debug('[ytDlpManager/getBestThumbnail] No thumbnails array provided or array is empty.');
    return undefined;
  }
  // Iterate through our preferred keys in order.
  // The first match found from this list will be returned.
  for (const preferredKey of PREFERRED_THUMBNAIL_URL_KEYS_IN_ORDER) {
    const foundThumb = thumbnails.find(t => t.url && t.url.includes(preferredKey));
    if (foundThumb?.url) {
      logger_1.logger.debug(`[ytDlpManager/getBestThumbnail] Found preferred thumbnail: '${preferredKey}' at ${foundThumb.url}`);
      return foundThumb.url;
    }
  }
  // If no thumbnails matching our preferred keys were found,
  // as a last resort, return the URL of the first thumbnail in the original array if it exists.
  // This handles cases where yt-dlp might provide thumbnails not matching our known keys.
  if (thumbnails[0]?.url) {
    logger_1.logger.debug(`[ytDlpManager/getBestThumbnail] No preferred thumbnails found. Falling back to the first thumbnail in the list: ${thumbnails[0].url}`);
    return thumbnails[0].url;
  }
  logger_1.logger.debug('[ytDlpManager/getBestThumbnail] No suitable thumbnail could be determined from the provided list.');
  return undefined;
}
// Helper to simplify playlist URLs (remove video-specific parts)
function simplifyPlaylistUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com' || parsedUrl.hostname === 'music.youtube.com') {
      const playlistId = parsedUrl.searchParams.get('list');
      if (playlistId) {
        return `https://www.youtube.com/playlist?list=${playlistId}`;
      }
    }
  } catch (error) {
    logger_1.logger.warn(`[ytDlpManager] Failed to parse or simplify URL: ${url}`, error);
  }
  return url;
}
async function initializeYtDlpWrap() {
  const binaryPath = await (0, pathUtils_1.getManagedYtDlpPath)();
  if (!binaryPath) {
    logger_1.logger.error('[ytDlpManager] yt-dlp binary path not resolved from pathUtils. Attempting download as fallback.');
    const defaultDownloadDir = path_1.default.join(process.cwd(), 'binaries');
    const defaultBinaryPath = path_1.default.join(defaultDownloadDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    try {
      await fs_extra_1.default.ensureDir(defaultDownloadDir);
      logger_1.logger.info(`[ytDlpManager] Attempting to download yt-dlp to ${defaultBinaryPath}`);
      await yt_dlp_wrap_1.default.downloadFromGithub(defaultBinaryPath);
      logger_1.logger.info(`[ytDlpManager] yt-dlp downloaded successfully to ${defaultBinaryPath}. Configure pathUtils to use this path consistently.`);
      if (process.platform !== 'win32') {
        await fs_extra_1.default.chmod(defaultBinaryPath, '755');
      }
      ytDlpBinaryPath = defaultBinaryPath; // Ensure binary path is set here too
      const instance = new yt_dlp_wrap_1.default(defaultBinaryPath);
      logger_1.logger.info('[ytDlpManager] YTDlpWrap initialized with downloaded binary at:', defaultBinaryPath);
      return instance;
    } catch (downloadError) {
      logger_1.logger.error(`[ytDlpManager] Failed to download/initialize yt-dlp: ${downloadError.message}`);
      throw new Error('yt-dlp binary is not available and download failed.');
    }
  }
  if (!fs_extra_1.default.existsSync(binaryPath)) {
    logger_1.logger.error(`[ytDlpManager] yt-dlp binary not found at configured path: ${binaryPath}. Ensure it is installed or path is correct.`);
    throw new Error(`yt-dlp binary not found at configured path: ${binaryPath}.`);
  }
  try {
    if (process.platform !== 'win32') {
      await fs_extra_1.default.access(binaryPath, fs_extra_1.default.constants.X_OK);
    }
  } catch (accessError) {
    logger_1.logger.warn(`[ytDlpManager] yt-dlp binary at ${binaryPath} may not be executable. Attempting to chmod. Error: ${accessError.message}`);
    try {
      if (process.platform !== 'win32') {
        await fs_extra_1.default.chmod(binaryPath, '755');
      }
    } catch (chmodErr) {
      logger_1.logger.error(`[ytDlpManager] Failed to make yt-dlp binary executable: ${chmodErr.message}`);
      throw new Error(`yt-dlp binary at ${binaryPath} is not executable.`);
    }
  }
  ytDlpBinaryPath = binaryPath; // Ensure binary path is set here
  const instance = new yt_dlp_wrap_1.default(binaryPath);
  logger_1.logger.info('[ytDlpManager] YTDlpWrap initialized with binary at:', binaryPath);
  return instance;
}
function getYtDlpInstance() {
  if (!ytDlpWrapInstancePromise) {
    ytDlpWrapInstancePromise = initializeYtDlpWrap();
  }
  return ytDlpWrapInstancePromise;
}
// New helper function for fetching playlist shell info
async function fetchPlaylistShellInfoWithYtDlp(simplifiedUrl, overrideArgs, ytDlpInstance, binaryPath // Pass binaryPath for logging
) {
  const shellArgs = [simplifiedUrl, '--dump-single-json', '--flat-playlist', '--no-warnings', '--no-progress', ...overrideArgs];
  logger_1.logger.info(`[ytDlpManager] Spawning for SHELL INFO: ${binaryPath} ${shellArgs.join(' ')}`);
  try {
    const rawShellJsonString = await ytDlpInstance.execPromise(shellArgs, {
      timeout: config_1.YTDLP_QUICK_PREVIEW_TIMEOUT / 2
    });
    if (rawShellJsonString) {
      return JSON.parse(rawShellJsonString);
    }
    logger_1.logger.warn(`[ytDlpManager] No JSON output for shell info for ${simplifiedUrl}`);
    return null;
  } catch (error) {
    logger_1.logger.error(`[ytDlpManager] Error fetching shell info for ${simplifiedUrl}: ${error.message}`, error);
    return null;
  }
}
// New helper function for fetching playlist video durations
async function fetchPlaylistVideoDurationsWithYtDlp(simplifiedUrl,
// overrideArgs are not typically used for this specific duration call, so removed
ytDlpInstance, binaryPath // Pass binaryPath for logging
) {
  const durationArgs = [simplifiedUrl, '--flat-playlist', '--print', '%(duration)s', '--no-warnings', '--no-progress'];
  logger_1.logger.info(`[ytDlpManager] Spawning for DURATIONS: ${binaryPath} ${durationArgs.join(' ')}`);
  let isDurationSummationComplete = true;
  const durations = [];
  let videoCountFromDurations = 0;
  try {
    const rawDurationLinesString = await ytDlpInstance.execPromise(durationArgs, {
      timeout: config_1.YTDLP_QUICK_PREVIEW_TIMEOUT / 2
    });
    if (rawDurationLinesString) {
      const lines = rawDurationLinesString.trim().split('\n');
      videoCountFromDurations = lines.length;
      for (const line of lines) {
        if (line.trim() === '' || line.toLowerCase() === 'na' || line.toLowerCase() === 'n/a') {
          isDurationSummationComplete = false;
          continue;
        }
        const duration = parseFloat(line);
        if (!isNaN(duration)) {
          durations.push(duration);
        } else {
          logger_1.logger.warn(`[ytDlpManager] Non-numeric duration found for ${simplifiedUrl}: "${line}"`);
          isDurationSummationComplete = false;
        }
      }
      return {
        durations,
        videoCountFromDurations,
        isDurationSummationComplete
      };
    }
    logger_1.logger.warn(`[ytDlpManager] No duration output for ${simplifiedUrl}`);
    return {
      durations: [],
      videoCountFromDurations: 0,
      isDurationSummationComplete: false
    };
  } catch (error) {
    logger_1.logger.error(`[ytDlpManager] Error fetching durations for ${simplifiedUrl}: ${error.message}`, error);
    return {
      durations: [],
      videoCountFromDurations: 0,
      isDurationSummationComplete: false
    }; // Return empty/default on error
  }
}
async function getPlaylistMetadata(playlistUrl) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    overrideArgs = []
  } = options; // quickPreview option removed
  const simplifiedUrl = simplifyPlaylistUrl(playlistUrl);
  // Removed quickPreview log, as this function now only fetches full metadata
  logger_1.logger.info(`[ytDlpManager] getPlaylistMetadata (FULL FETCH) for URL: ${simplifiedUrl}`);
  const ytDlp = await getYtDlpInstance();
  if (!ytDlp) {
    logger_1.logger.error('[ytDlpManager] yt-dlp instance is not available for getPlaylistMetadata.');
    throw new Error('yt-dlp instance not initialized.');
  }
  // Full metadata fetch (existing logic using spawn and stream processing)
  const args = [simplifiedUrl, '--dump-json',
  // Fetches detailed info for each video, not flat
  '--yes-playlist', '--no-warnings', '--no-progress', ...overrideArgs];
  logger_1.logger.info(`[ytDlpManager] Spawning for FULL METADATA: ${ytDlpBinaryPath} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const functionStartTime = performance.now();
    const process = (0, child_process_1.spawn)(ytDlpBinaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let allEntriesRaw = [];
    let rawJsonBuffer = '';
    let playlistTitle;
    let playlistUploader;
    let playlistDescription;
    let playlistWebpageUrl = simplifiedUrl; // Default to input URL
    let playlistChannel;
    let playlistIdFromYtDlp;
    let playlistThumbnails;
    process.stdout.on('data', data => {
      rawJsonBuffer += data.toString();
      // Process line by line, as yt-dlp --dump-json outputs one JSON object per video
      let newlineIndex;
      while ((newlineIndex = rawJsonBuffer.indexOf('\n')) >= 0) {
        const jsonLine = rawJsonBuffer.substring(0, newlineIndex);
        rawJsonBuffer = rawJsonBuffer.substring(newlineIndex + 1);
        if (jsonLine.trim()) {
          try {
            const entry = JSON.parse(jsonLine);
            allEntriesRaw.push(entry);
            // Try to extract playlist-level info from the first entry
            // This assumes yt-dlp might output playlist-global data with the first video when not using --dump-single-json
            if (allEntriesRaw.length === 1) {
              playlistTitle = entry.playlist_title || entry.playlist;
              playlistUploader = entry.playlist_uploader || entry.uploader || entry.channel;
              playlistDescription = entry.playlist_description || entry.description; // Less likely, but fallback
              playlistWebpageUrl = entry.playlist_webpage_url || entry.webpage_url; // Prefer playlist specific
              playlistChannel = entry.channel;
              playlistIdFromYtDlp = entry.playlist_id;
              // Note: Thumbnails are per-video here. A playlist-level thumbnail isn't directly given in this stream.
              // We might need a separate call or rely on the first video's thumbnail if that's the desired behavior.
              // For full metadata, the primary thumbnail might be from the first video or fetched differently.
              // For now, let's assume we want to use the first video's best thumbnail if no other strategy is in place.
              if (!playlistThumbnails && entry.thumbnails) {
                // This takes thumbnails from the *first video*. For a playlist-level thumbnail with --dump-json,
                // yt-dlp usually doesn't provide a single "playlist thumbnail" but rather thumbnails for each video.
                // The `getBestThumbnail` helper is designed for an array of thumbnail objects.
                playlistThumbnails = entry.thumbnails; // Store the array from the first video
              }
            }
          } catch (e) {
            logger_1.logger.warn('[ytDlpManager] Failed to parse JSON line from yt-dlp (full fetch):', jsonLine, e);
          }
        }
      }
    });
    process.stderr.on('data', data => {
      logger_1.logger.error(`[ytDlpManager] yt-dlp stderr (full fetch for ${simplifiedUrl}): ${data.toString().trim()}`);
    });
    process.on('error', err => {
      const duration = performance.now() - functionStartTime;
      logger_1.logger.error(`[ytDlpManager] Failed to start yt-dlp process (full fetch for ${simplifiedUrl}) after ${duration.toFixed(2)}ms: ${err.message}`, err);
      reject(err);
    });
    process.on('close', code => {
      const duration = performance.now() - functionStartTime;
      if (rawJsonBuffer.trim()) {
        // Process any remaining data in the buffer
        try {
          const entry = JSON.parse(rawJsonBuffer);
          allEntriesRaw.push(entry);
          if (allEntriesRaw.length === 1 && !playlistTitle) {
            // Check again if it was the only entry
            playlistTitle = entry.playlist_title || entry.playlist;
            playlistUploader = entry.playlist_uploader || entry.uploader || entry.channel;
            playlistWebpageUrl = entry.playlist_webpage_url || entry.webpage_url;
            playlistChannel = entry.channel;
            playlistIdFromYtDlp = entry.playlist_id;
            if (!playlistThumbnails && entry.thumbnails) {
              playlistThumbnails = entry.thumbnails;
            }
          }
        } catch (e) {
          logger_1.logger.warn('[ytDlpManager] Failed to parse remaining JSON buffer from yt-dlp (full fetch):', rawJsonBuffer, e);
        }
      }
      if (code !== 0) {
        logger_1.logger.error(`[ytDlpManager] yt-dlp process (full fetch for ${simplifiedUrl}) exited with code ${code} after ${duration.toFixed(2)}ms.`);
        return resolve(null); // Resolve with null on non-zero exit code
      }
      if (allEntriesRaw.length === 0) {
        logger_1.logger.warn(`[ytDlpManager] No video entries found after full fetch for ${simplifiedUrl} (duration: ${duration.toFixed(2)}ms).`);
        return resolve(null);
      }
      logger_1.logger.info(`[ytDlpManager] Full metadata fetch for ${simplifiedUrl} (yt-dlp process) took ${duration.toFixed(2)}ms. Processing ${allEntriesRaw.length} entries.`);
      const totalDuration = allEntriesRaw.reduce((acc, entry) => acc + (entry.duration || 0), 0);
      const bestOverallThumbnail = getBestThumbnail(playlistThumbnails);
      const processedData = {
        id: playlistIdFromYtDlp || simplifiedUrl,
        // Use ID from yt-dlp if available
        title: playlistTitle || 'Unknown Playlist',
        uploader: playlistUploader,
        channel: playlistChannel,
        description: playlistDescription,
        webpage_url: playlistWebpageUrl,
        thumbnail: bestOverallThumbnail,
        // Using the best from the first video for now
        entries: allEntriesRaw,
        itemCount: allEntriesRaw.length,
        totalDuration: totalDuration,
        isDurationApproximate: false // For full fetch, duration should be accurate
      };
      resolve(processedData);
    });
    // Timeout for the entire metadata fetching operation
    const timeoutId = setTimeout(() => {
      logger_1.logger.error(`[ytDlpManager] Full metadata fetch for ${simplifiedUrl} timed out after ${config_1.YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT / 1000}s.`);
      if (!process.killed) {
        process.kill('SIGKILL'); // Force kill if still running
      }
      resolve(null); // Resolve with null on timeout
    }, config_1.YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT);
    process.on('exit', () => {
      clearTimeout(timeoutId);
    });
  });
}
async function getVideoMetadata(videoUrl) {
  let overrideArgs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  logger_1.logger.info(`[ytDlpManager] getVideoMetadata for URL: ${videoUrl}`);
  const ytDlp = await getYtDlpInstance();
  if (!ytDlp) {
    logger_1.logger.error('[ytDlpManager] yt-dlp instance is not available for getVideoMetadata.');
    return null; // Or throw new Error('yt-dlp instance not initialized.');
  }
  const baseArgs = [videoUrl, '--dump-single-json',
  // Get metadata for a single video
  '--no-warnings', '--no-progress'];
  const args = [...baseArgs, ...overrideArgs];
  logger_1.logger.info(`[ytDlpManager] Spawning (getVideoMetadata): ${ytDlpBinaryPath} ${args.join(' ')}`);
  try {
    // Using YTDlpWrap's built-in execPromise for single JSON output
    const rawJsonString = await ytDlp.execPromise(args);
    if (!rawJsonString) {
      logger_1.logger.warn(`[ytDlpManager] No JSON output from yt-dlp for ${videoUrl}`);
      return null;
    }
    const metadata = JSON.parse(rawJsonString);
    // Refine thumbnail
    const bestThumbnailUrl = getBestThumbnail(metadata.thumbnails) || metadata.thumbnail;
    logger_1.logger.info(`[ytDlpManager] Successfully fetched metadata for video: ${metadata.title}`);
    return {
      ...metadata,
      thumbnail: bestThumbnailUrl,
      // Override with best selected thumbnail
      // Ensure key fields for VideoPreviewData are present
      id: metadata.id || '',
      title: metadata.title || 'Unknown Title',
      duration: metadata.duration || 0,
      channelName: metadata.channel || metadata.uploader || 'Unknown Channel' // Explicitly set channelName
    };
  } catch (error) {
    logger_1.logger.error(`[ytDlpManager] Error fetching video metadata for ${videoUrl}: ${error.message}. Stderr: ${error.stderr || 'N/A'}`, error);
    if (error.message && error.message.includes('This playlist type is unviewable')) {
      // This specific error might occur if a playlist URL is passed to a function expecting a single video URL
      // and yt-dlp processes it as a playlist, then fails to get a "single" JSON dump for the playlist entity itself.
      // Or if the video is part of such a playlist and the URL resolves to the playlist context.
      logger_1.logger.warn(`[ytDlpManager] The URL ${videoUrl} might be an unviewable playlist or a video within one.`);
      // Optionally, re-throw a more specific error or handle as per application logic.
      // For now, returning null as the function expects single video metadata.
    }
    return null;
  }
}
async function importPlaylist(playlistUrlParam, customPlaylistName, isPrivatePlaylist) {
  logger_1.logger.info(c.cyan(`[ytDlpManager] Importing playlist: ${playlistUrlParam}`));
  const ytDlpInstance = await getYtDlpInstance();
  const simplifiedUrl = simplifyPlaylistUrl(playlistUrlParam);
  // Fetch full playlist metadata including all video entries
  const metadata = await getPlaylistMetadata(simplifiedUrl);
  if (!metadata || !metadata.entries) {
    logger_1.logger.error(c.red(`[ytDlpManager] Failed to fetch comprehensive metadata or no video entries for playlist: ${simplifiedUrl}`));
    throw new Error(`Failed to fetch comprehensive metadata for playlist: ${simplifiedUrl}`);
  }
  // Map raw video entries to Video objects
  const videos = metadata.entries.map((rawVideo, index) => mapRawVideoToVideo(rawVideo, index));
  const newPlaylist = {
    id: metadata.id || (0, uuid_1.v4)(),
    // Use yt-dlp ID or generate a new one
    name: customPlaylistName || metadata.title || 'Unnamed Playlist',
    description: metadata.description,
    videos: videos,
    // Ensure this is Video[]
    thumbnail: metadata.thumbnail,
    // Assumes getPlaylistMetadata already selected the best playlist thumbnail for ProcessedPlaylistMetadata
    source_url: metadata.webpage_url || simplifiedUrl,
    source: 'youtube',
    // Assuming import is always from YouTube here
    item_count: metadata.itemCount || videos.length,
    // Use itemCount from processed metadata or fallback
    youtube_playlist_id: metadata.id,
    // yt-dlp's playlist ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_duration_seconds: metadata.totalDuration
  };
  logger_1.logger.info(c.greenBright(`[ytDlpManager] Successfully processed playlist data for: ${newPlaylist.name}`));
  logger_1.logger.debug(c.gray(`[ytDlpManager] Playlist object created: ${JSON.stringify(newPlaylist, null, 2)}`));
  // Note: This function used to write metadata to a file.
  // This responsibility is now likely handled by the service that calls importPlaylist
  // and then saves the Playlist object to the database.
  // If direct file writing is still needed here for some reason, it should be re-evaluated.
  // Example: await writePlaylistMetadata(path.join(app.getPath('userData'), 'playlists_metadata'), `${newPlaylist.id}.json`, newPlaylist);
  return newPlaylist;
}
async function ensureYtDlpBinaryIsReady() {
  if (!ytDlpWrapInstance) {
    // Assuming initializeYtDlpWrap correctly sets the global ytDlpBinaryPath
    // and returns the YTDlpWrap instance which we store in ytDlpWrapInstance.
    // The promise 'ytDlpWrapInstancePromise' is used to ensure single initialization.
    if (!ytDlpWrapInstancePromise) {
      ytDlpWrapInstancePromise = initializeYtDlpWrap();
    }
    ytDlpWrapInstance = await ytDlpWrapInstancePromise;
  }
  if (!ytDlpWrapInstance) {
    throw new Error('Failed to initialize ytDlpWrapInstance after awaiting promise.');
  }
  // ytDlpBinaryPath should be set by initializeYtDlpWrap by now
  if (!ytDlpBinaryPath) {
    throw new Error('ytDlpBinaryPath was not set after YTDlpWrap initialization.');
  }
  return {
    ytDlpInstance: ytDlpWrapInstance,
    ytDlpBinaryPath
  };
}

/***/ }),

/***/ "./src/backend/utils/fileUtils.ts":
/*!****************************************!*\
  !*** ./src/backend/utils/fileUtils.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createPlaylistDir = createPlaylistDir;
exports.writePlaylistMetadata = writePlaylistMetadata;
exports.readPlaylistMetadata = readPlaylistMetadata;
exports.deletePlaylistDir = deletePlaylistDir;
exports.getVideoPath = getVideoPath;
exports.videoFileExists = videoFileExists;
exports.deleteVideoFile = deleteVideoFile;
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra"));
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const settingsService_1 = __webpack_require__(/*! ../services/settingsService */ "./src/backend/services/settingsService.ts"); // Assuming settingsService provides downloadLocation
const DEFAULT_PLAYLIST_DIR_NAME = 'Playlists';
/**
 * Ensures that the base directory for all playlists exists.
 * @returns The absolute path to the playlist directory.
 */
async function ensureBasePlaylistDir() {
  let downloadLocation = await (0, settingsService_1.getSetting)('downloadLocation');
  if (downloadLocation === undefined) {
    console.warn("Download location not set, using default.");
    // Fallback to a default path, similar to settingsService schema default
    // It's important that 'app' is available here or this path is defined differently.
    // For now, assuming 'app' is accessible or using a predefined fallback.
    // If app is not directly accessible, this might need to be 'videos/Playlistify'
    // or passed in, or obtained via another service call.
    // For simplicity and based on settingsService, let's use a hardcoded relative path if app isn't available.
    // A better approach would be to ensure critical settings always have a value from settingsService.
    const appInstance = (__webpack_require__(/*! electron */ "electron").app); // Or however app is accessed here
    downloadLocation = path_1.default.join(appInstance.getPath('videos'), 'Playlistify');
  }
  const playlistDirPath = path_1.default.join(downloadLocation, DEFAULT_PLAYLIST_DIR_NAME);
  await fs_extra_1.default.ensureDir(playlistDirPath);
  return playlistDirPath;
}
/**
 * Creates a specific directory for a given playlist name within the base playlist directory.
 * @param playlistName The name of the playlist for which to create a directory.
 * @returns The absolute path to the created playlist-specific directory.
 */
async function createPlaylistDir(playlistName) {
  const basePlaylistDir = await ensureBasePlaylistDir();
  // Sanitize playlistName to be a valid directory name (basic example)
  const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
  const specificPlaylistPath = path_1.default.join(basePlaylistDir, sanePlaylistName);
  await fs_extra_1.default.ensureDir(specificPlaylistPath);
  return specificPlaylistPath;
}
/**
 * Writes playlist metadata (e.g., list of videos) to a JSON file within its directory.
 * @param playlistName The name of the playlist.
 * @param playlistData The Playlist object containing metadata.
 */
async function writePlaylistMetadata(playlistName, playlistData) {
  const playlistDir = await createPlaylistDir(playlistName);
  const metadataFilePath = path_1.default.join(playlistDir, 'playlist.json');
  await fs_extra_1.default.writeJson(metadataFilePath, playlistData, {
    spaces: 2
  });
  console.log(`Metadata for playlist '${playlistName}' written to ${metadataFilePath}`);
}
/**
 * Reads playlist metadata from its JSON file.
 * @param playlistName The name of the playlist.
 * @returns The Playlist object, or null if metadata file doesn't exist.
 */
async function readPlaylistMetadata(playlistName) {
  const basePlaylistDir = await ensureBasePlaylistDir();
  const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
  const metadataFilePath = path_1.default.join(basePlaylistDir, sanePlaylistName, 'playlist.json');
  try {
    if (await fs_extra_1.default.pathExists(metadataFilePath)) {
      return await fs_extra_1.default.readJson(metadataFilePath);
    }
    return null;
  } catch (error) {
    console.error(`Error reading metadata for playlist '${playlistName}':`, error);
    return null;
  }
}
/**
 * Deletes a playlist directory and all its contents.
 * @param playlistName The name of the playlist to delete.
 */
async function deletePlaylistDir(playlistName) {
  const basePlaylistDir = await ensureBasePlaylistDir();
  const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
  const playlistDirPath = path_1.default.join(basePlaylistDir, sanePlaylistName);
  try {
    if (await fs_extra_1.default.pathExists(playlistDirPath)) {
      await fs_extra_1.default.remove(playlistDirPath);
      console.log(`Playlist directory '${playlistName}' deleted successfully.`);
    }
  } catch (error) {
    console.error(`Error deleting playlist directory '${playlistName}':`, error);
    throw error; // Re-throw to allow caller to handle
  }
}
/**
 * Gets the path for a specific video file within a playlist's directory.
 * Does not guarantee the file exists.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video, e.g., 'mp4'.
 * @returns The potential path to the video file.
 */
async function getVideoPath(playlistName, videoId) {
  let format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'mp4';
  const playlistDir = await createPlaylistDir(playlistName); // Ensures directory exists
  const videoFileName = `${videoId.replace(/[\\/:*?"<>|]/g, '_')}.${format}`;
  return path_1.default.join(playlistDir, videoFileName);
}
/**
 * Checks if a specific video file exists.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video.
 * @returns True if the video file exists, false otherwise.
 */
async function videoFileExists(playlistName, videoId) {
  let format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'mp4';
  const filePath = await getVideoPath(playlistName, videoId, format);
  return fs_extra_1.default.pathExists(filePath);
}
/**
 * Deletes a specific video file from a playlist's directory.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video.
 */
async function deleteVideoFile(playlistName, videoId) {
  let format = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'mp4';
  const filePath = await getVideoPath(playlistName, videoId, format);
  try {
    if (await fs_extra_1.default.pathExists(filePath)) {
      await fs_extra_1.default.remove(filePath);
      console.log(`Video file '${videoId}.${format}' deleted from playlist '${playlistName}'.`);
    }
  } catch (error) {
    console.error(`Error deleting video file '${videoId}.${format}' from playlist '${playlistName}':`, error);
    throw error;
  }
}
// TODO: Add more utility functions as needed, e.g., listing all playlist directories, validating file names further.

/***/ }),

/***/ "./src/backend/utils/logger.ts":
/*!*************************************!*\
  !*** ./src/backend/utils/logger.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.logger = void 0;
const getTimestamp = () => new Date().toISOString();
exports.logger = {
  info: function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
  },
  warn: function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  },
  error: function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  },
  debug: function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    // In a more advanced logger, this could be conditional based on NODE_ENV
    console.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
  }
};

/***/ }),

/***/ "./src/backend/utils/pathUtils.ts":
/*!****************************************!*\
  !*** ./src/backend/utils/pathUtils.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getManagedYtDlpPath = getManagedYtDlpPath;
exports.getManagedFfmpegPath = getManagedFfmpegPath;
const path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
const fs_extra_1 = __importDefault(__webpack_require__(/*! fs-extra */ "fs-extra"));
const electron_1 = __webpack_require__(/*! electron */ "electron"); // Import app to potentially use app paths
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const util_1 = __importDefault(__webpack_require__(/*! util */ "util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
const IS_DEV = "development" === 'development';
// Define base directories based on environment
const PROJECT_ROOT = path_1.default.resolve('.'); // Root of the project
// Production/Default paths (User AppData)
const APP_DATA_DIR = path_1.default.join(electron_1.app.getPath('userData')); // Use Electron's recommended path
const PROD_DEPS_DIR = path_1.default.join(APP_DATA_DIR, 'bin');
const PROD_YTDLP_PATH = path_1.default.join(PROD_DEPS_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const PROD_FFMPEG_DIR = path_1.default.join(PROD_DEPS_DIR, 'ffmpeg');
const PROD_FFMPEG_PATH = path_1.default.join(PROD_FFMPEG_DIR, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
// Development paths (PROJECT_ROOT/installs/TOOL/bin/)
const DEV_INSTALLS_DIR = path_1.default.join(PROJECT_ROOT, 'installs');
const DEV_YTDLP_INSTALL_DIR = path_1.default.join(DEV_INSTALLS_DIR, 'ytdlp', 'bin');
const DEV_YTDLP_PATH = path_1.default.join(DEV_YTDLP_INSTALL_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const DEV_FFMPEG_INSTALL_DIR = path_1.default.join(DEV_INSTALLS_DIR, 'ffmpeg', 'bin');
const DEV_FFMPEG_PATH = path_1.default.join(DEV_FFMPEG_INSTALL_DIR, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
// Determine actual paths based on environment
const YTDLP_PATH = IS_DEV ? DEV_YTDLP_PATH : PROD_YTDLP_PATH;
const FFMPEG_PATH = IS_DEV ? DEV_FFMPEG_PATH : PROD_FFMPEG_PATH;
/**
 * Gets the resolved path to the yt-dlp binary managed by start.js.
 * Performs a basic existence check.
 * @returns The path to the binary, or null if not found.
 */
async function getManagedYtDlpPath() {
  const checkPath = YTDLP_PATH;
  if (await fs_extra_1.default.pathExists(checkPath)) {
    console.log(`Using yt-dlp binary at: ${checkPath}`);
    return checkPath;
  }
  console.error(`yt-dlp binary not found at expected location: ${checkPath}`);
  return null;
}
/**
 * Gets the resolved path to the ffmpeg binary managed by start.js.
 * Performs a basic existence check, with fallback to system PATH.
 * @returns The path to the binary, or null if not found.
 */
async function getManagedFfmpegPath() {
  const checkPath = FFMPEG_PATH;
  if (await fs_extra_1.default.pathExists(checkPath)) {
    console.log(`Using ffmpeg binary at: ${checkPath}`);
    return checkPath;
  }
  console.error(`Managed ffmpeg binary not found at expected location: ${checkPath}`);
  // Fallback: Check if 'ffmpeg' exists in system PATH
  try {
    await execPromise('ffmpeg -version');
    console.warn(`Managed ffmpeg not found at ${checkPath}, but found ffmpeg in system PATH. Using system ffmpeg.`);
    return 'ffmpeg'; // Return 'ffmpeg' assuming it's in PATH
  } catch (error) {
    console.error('System ffmpeg also not found in PATH.');
    return null;
  }
}

/***/ }),

/***/ "./src/shared/constants/config.ts":
/*!****************************************!*\
  !*** ./src/shared/constants/config.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DATABASE_BACKUP_INTERVAL_MS = exports.CACHE_CHECK_INTERVAL_MS = exports.THUMBNAIL_FETCH_TIMEOUT = exports.YTDLP_QUICK_PREVIEW_TIMEOUT = exports.YTDLP_SINGLE_VIDEO_METADATA_FETCH_TIMEOUT = exports.YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT = exports.DATABASE_OPERATION_TIMEOUT = void 0;
exports.DATABASE_OPERATION_TIMEOUT = 10000; // 10 seconds
exports.YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT = 30000; // 30 seconds
exports.YTDLP_SINGLE_VIDEO_METADATA_FETCH_TIMEOUT = 15000; // 15 seconds
exports.YTDLP_QUICK_PREVIEW_TIMEOUT = 10000; // 10 seconds
exports.THUMBNAIL_FETCH_TIMEOUT = 10000; // 10 seconds
exports.CACHE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
exports.DATABASE_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
// Add other shared configuration constants here as needed

/***/ }),

/***/ "./src/shared/constants/ipc-channels.ts":
/*!**********************************************!*\
  !*** ./src/shared/constants/ipc-channels.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.IPC_CHANNELS = void 0;
exports.IPC_CHANNELS = {
  // App Handlers
  GET_APP_VERSION: 'get-app-version',
  GET_APP_PATH: 'get-app-path',
  // Settings Handlers
  GET_SETTING: 'get-setting',
  SET_SETTING: 'set-setting',
  GET_ALL_SETTINGS: 'get-all-settings',
  RESET_ALL_SETTINGS: 'reset-all-settings',
  // File Handlers
  OPEN_DIRECTORY_DIALOG: 'file:open-directory-dialog',
  CREATE_PLAYLIST_DIR: 'file:create-playlist-dir',
  WRITE_PLAYLIST_METADATA: 'file:write-playlist-metadata',
  READ_PLAYLIST_METADATA: 'file:read-playlist-metadata',
  DELETE_PLAYLIST_DIR: 'file:delete-playlist-dir',
  GET_VIDEO_PATH: 'file:get-video-path',
  VIDEO_FILE_EXISTS: 'file:video-file-exists',
  DELETE_VIDEO_FILE: 'file:delete-video-file',
  // Download Handlers
  DOWNLOAD_ADD_ITEM: 'download:add-item',
  DOWNLOAD_PAUSE_ITEM: 'download:pause-item',
  DOWNLOAD_RESUME_ITEM: 'download:resume-item',
  DOWNLOAD_CANCEL_ITEM: 'download:cancel-item',
  DOWNLOAD_RETRY_ITEM: 'download:retry-item',
  DOWNLOAD_REMOVE_ITEM: 'download:remove-item',
  DOWNLOAD_GET_ALL_ITEMS: 'download:get-all-items',
  DOWNLOAD_CLEAR_COMPLETED: 'download:clear-completed',
  DOWNLOAD_PROGRESS_UPDATE: 'download:progress-update',
  // For events from main to renderer
  // Playlist Handlers
  PLAYLIST_GET_ALL: 'playlist:get-all',
  PLAYLIST_GET_BY_ID: 'playlist:get-by-id',
  PLAYLIST_CREATE: 'playlist:create',
  PLAYLIST_UPDATE_DETAILS: 'playlist:updateDetails',
  PLAYLIST_DELETE: 'playlist:delete',
  PLAYLIST_ADD_VIDEO: 'playlist:add-video',
  PLAYLIST_REMOVE_VIDEO: 'playlist:remove-video',
  PLAYLIST_REORDER_VIDEOS: 'playlist:reorder-videos',
  PLAYLIST_IMPORT_FROM_URL: 'playlist:import-from-url',
  PLAYLIST_GET_ALL_VIDEOS: 'playlist:getAllVideos',
  PLAYLIST_ADD_VIDEO_BY_URL: 'playlist:addVideoByUrl',
  // Thumbnail Handlers
  THUMBNAIL_GET_FOR_VIDEO: 'thumbnail:get-for-video',
  THUMBNAIL_GET_FOR_PLAYLIST: 'thumbnail:get-for-playlist',
  THUMBNAIL_CLEAR_CACHE: 'thumbnail:clear-cache',
  // yt-dlp related IPC channels
  YTDLP_GET_PLAYLIST_METADATA: 'ytdlp:get-playlist-metadata',
  YTDLP_GET_QUICK_PLAYLIST_PREVIEW: 'ytdlp:get-quick-playlist-preview',
  YTDLP_DOWNLOAD_VIDEO: 'ytdlp:download-video',
  YTDLP_GET_AVAILABLE_QUALITIES: 'ytdlp:get-available-qualities',
  // Shell operations
  SHELL_OPEN_EXTERNAL: 'shell:openExternal',
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell:showItemInFolder',
  SHELL_OPEN_PATH: 'shell:openPath',
  SHELL_TRASH_ITEM: 'shell:trashItem',
  // Video specific metadata
  GET_VIDEO_METADATA_FOR_PREVIEW: 'videos:getMetadataForPreview'
  // Theme
  // Add other channel groups as needed (thumbnail)
};
// Theme
// Add other channel groups as needed (thumbnail)

/***/ }),

/***/ "better-sqlite3":
/*!*********************************!*\
  !*** external "better-sqlite3" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("better-sqlite3");

/***/ }),

/***/ "chalk":
/*!************************!*\
  !*** external "chalk" ***!
  \************************/
/***/ ((module) => {

module.exports = require("chalk");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ }),

/***/ "electron-store":
/*!*********************************!*\
  !*** external "electron-store" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("electron-store");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "fs-extra":
/*!***************************!*\
  !*** external "fs-extra" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("fs-extra");

/***/ }),

/***/ "p-queue":
/*!**************************!*\
  !*** external "p-queue" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("p-queue");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "uuid":
/*!***********************!*\
  !*** external "uuid" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),

/***/ "yt-dlp-wrap":
/*!******************************!*\
  !*** external "yt-dlp-wrap" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("yt-dlp-wrap");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/backend/backend.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map
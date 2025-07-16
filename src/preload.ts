/**
 * Secure preload script for IPC communication between main and renderer processes
 * This script creates a controlled API surface with proper security measures and error handling
 *
 * Security Features:
 * - Context isolation enforcement
 * - Node integration disabled
 * - Controlled API surface
 * - Security violation logging
 * - Backward compatibility support
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './shared/types';

// Security configuration
const SECURITY_CONFIG = {
  allowedChannels: new Set([
    // App channels
    'app:getVersion',
    'app:quit',
    'app:minimize',
    'app:maximize',
    'app:isMaximized',
    'app:unmaximize',
    'app:close',
    'app:showErrorDialog',
    'app:showMessageDialog',
    'app:selectDirectory',
    'app:selectFile',
    'app:saveFile',

    // File system channels
    'fs:exists',
    'fs:readJson',
    'fs:writeJson',
    'fs:readText',
    'fs:writeText',
    'fs:delete',
    'fs:copy',
    'fs:move',
    'fs:getStats',
    'fs:listFiles',
    'fs:listDirectories',
    'fs:ensureDirectory',
    'fs:getSize',
    'fs:formatSize',
    'fs:sanitizeFilename',
    'fs:createUniqueFilename',
    'fs:getAppPaths',
    'fs:initializeDirectories',
    'fs:cleanupTempFiles',
    'fs:selectDirectory',

    // Settings channels
    'settings:get',
    'settings:set',
    'settings:getAll',
    'settings:reset',
    'settings:hasCustomValue',
    'settings:getStorePath',
    'settings:validate',
    'settings:export',
    'settings:import',
    'settings:initializeDownloadLocation',
    'settings:sanitize',
    'settings:createBackup',
    'settings:restoreFromBackup',
    'settings:getVersion',
    'settings:needsMigration',
    'settings:migrate',
    'settings:listBackups',
    'settings:getValidationDetails',

    // Playlist channels (future implementation)
    'playlist:getAll',
    'playlist:getById',
    'playlist:create',
    'playlist:update',
    'playlist:delete',
    'playlist:searchVideos',
    'playlist:addVideo',
    'playlist:removeVideo',
    'playlist:reorderVideos',
    'playlist:getStats',

    // YouTube channels (future implementation)
    'youtube:getPlaylistMetadata',
    'youtube:importPlaylist',
    'youtube:getVideoQualities',
    'youtube:checkAvailability',
    'youtube:updateYtDlp',
    'youtube:validateUrl',
    'youtube:importProgress',

    // Dependency channels
    'dependency:checkStatus',
    'dependency:getStatus',
    'dependency:install',
    'dependency:validate',
    'dependency:getVersion',
    'dependency:getPath',
    'dependency:cleanup',
    'dependency:areAllReady',
    'dependency:isInitialized',
    'dependency:statusUpdated',
    'dependency:downloadProgress',
    'dependency:installStarted',
    'dependency:installCompleted',
    'dependency:installFailed',

    // Error handling channels
    'error:getStatistics',
    'error:getRecentReports',
    'error:report',
    'error:clearOldReports',
    'error:gracefulShutdown',
    'error:test',
    'error-notification',

    // Legacy channels for backward compatibility
    'playlist:getMetadata',
    'import:start',
    'task:update',
    'getPlaylistDetails',
    'getPlaylists',
  ]),

  blockedGlobals: [
    'require',
    'exports',
    'module',
    '__dirname',
    '__filename',
    'global',
    'process',
  ],
  maxRetries: 3,
  timeoutMs: 30000,
};

/**
 * Security validation and enforcement
 */
function enforceSecurityMeasures(): void {
  // Validate context isolation
  if (!process.contextIsolated) {
    const error = new Error(
      '❌ SECURITY VIOLATION: Context isolation must be enabled',
    );
    logSecurityViolation('CONTEXT_ISOLATION_DISABLED', error.message);
    throw error;
  }

  // Validate node integration is disabled (except in test environment)
  if (process.env.NODE_ENV !== 'test' && (globalThis as any).require) {
    const error = new Error(
      '❌ SECURITY VIOLATION: Node integration must be disabled in renderer',
    );
    logSecurityViolation('NODE_INTEGRATION_ENABLED', error.message);
    throw error;
  }

  // Remove dangerous globals from renderer context
  SECURITY_CONFIG.blockedGlobals.forEach(globalName => {
    if ((globalThis as any)[globalName]) {
      delete (globalThis as any)[globalName];
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 Removed global: ${globalName}`);
      }
    }
  });

  // Validate Electron version compatibility
  if (process.versions.electron) {
    const electronVersion = process.versions.electron;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Electron version: ${electronVersion}`);
    }
  }
}

/**
 * Log security violations with appropriate detail
 */
function logSecurityViolation(
  violationType: string,
  message: string,
  context?: any,
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'SECURITY_VIOLATION',
    violation: violationType,
    message,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console with appropriate level
  console.error('🚨 SECURITY VIOLATION:', logEntry);

  // In production, we might want to report this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement security violation reporting in future tasks
    // This could send violations to a logging service or security monitoring system
  }
}

/**
 * Validate IPC channel access
 */
function validateChannelAccess(channel: string): boolean {
  if (!SECURITY_CONFIG.allowedChannels.has(channel)) {
    logSecurityViolation(
      'UNAUTHORIZED_CHANNEL_ACCESS',
      `Attempted access to unauthorized channel: ${channel}`,
    );
    return false;
  }
  return true;
}

// Enforce security measures immediately
enforceSecurityMeasures();

/**
 * Create a secure wrapper for IPC invoke calls with comprehensive security validation
 */
function createSecureInvoke<T extends any[], R>(channel: string) {
  return async (...args: T): Promise<R> => {
    // Validate channel access before making the call
    if (!validateChannelAccess(channel)) {
      throw new Error(
        `❌ SECURITY VIOLATION: Unauthorized access to channel: ${channel}`,
      );
    }

    // Validate arguments to prevent injection attacks
    if (args.some(arg => typeof arg === 'string' && arg.includes('<script>'))) {
      logSecurityViolation(
        'SCRIPT_INJECTION_ATTEMPT',
        `Script injection attempt detected in channel: ${channel}`,
        { args },
      );
      throw new Error(
        '❌ SECURITY VIOLATION: Script injection attempt detected',
      );
    }

    try {
      // Set up timeout for IPC calls to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `IPC call to ${channel} timed out after ${SECURITY_CONFIG.timeoutMs}ms`,
            ),
          );
        }, SECURITY_CONFIG.timeoutMs);
      });

      // Race between the actual IPC call and timeout
      const response = await Promise.race([
        ipcRenderer.invoke(channel, ...args),
        timeoutPromise,
      ]);

      // Handle standardized IPC responses
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Unknown IPC error');
        }
      }

      // Handle legacy responses
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log IPC errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`IPC Error on channel ${channel}:`, error);
      }

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Communication error occurred`);
      }

      throw error;
    }
  };
}

/**
 * Create a secure wrapper for IPC event listeners with validation and cleanup
 */
function createSecureListener<T extends any[]>(channel: string) {
  return (callback: (event: Electron.IpcRendererEvent, ...args: T) => void) => {
    // Validate channel access
    if (!validateChannelAccess(channel)) {
      logSecurityViolation(
        'UNAUTHORIZED_LISTENER_REGISTRATION',
        `Attempted to register listener for unauthorized channel: ${channel}`,
      );
      throw new Error(
        `❌ SECURITY VIOLATION: Cannot register listener for unauthorized channel: ${channel}`,
      );
    }

    const wrappedCallback = (event: Electron.IpcRendererEvent, ...args: T) => {
      try {
        // Validate event source
        if (!event.sender) {
          logSecurityViolation(
            'INVALID_EVENT_SOURCE',
            `Event received without valid sender on channel: ${channel}`,
          );
          return;
        }

        // Execute the callback with error handling
        callback(event, ...args);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in IPC listener for ${channel}:`, errorMessage);

        // Log listener errors for security monitoring
        logSecurityViolation(
          'LISTENER_EXECUTION_ERROR',
          `Error in listener for channel: ${channel}`,
          { error: errorMessage },
        );
      }
    };

    ipcRenderer.on(channel, wrappedCallback);

    // Return cleanup function with additional validation
    return () => {
      try {
        ipcRenderer.removeListener(channel, wrappedCallback);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🧹 Cleaned up listener for channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to cleanup listener for ${channel}:`, error);
      }
    };
  };
}

/**
 * Enhanced API versioning for backward compatibility
 */
const API_VERSION = '1.0.0';
const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Validate API version compatibility
 */
function validateAPIVersion(requestedVersion?: string): boolean {
  if (!requestedVersion) {
    return true; // Default to current version
  }

  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    logSecurityViolation(
      'UNSUPPORTED_API_VERSION',
      `Unsupported API version requested: ${requestedVersion}`,
      {
        supported: SUPPORTED_VERSIONS,
        current: API_VERSION,
      },
    );
    return false;
  }

  return true;
}

/**
 * Create a versioned API wrapper for backward compatibility
 */
function createVersionedAPI(api: ElectronAPI): ElectronAPI & {
  _version: string;
  _validateVersion: (version?: string) => boolean;
} {
  return {
    ...api,
    _version: API_VERSION,
    _validateVersion: validateAPIVersion,
  };
}

// Create the secure API surface with proper error handling
const electronAPI: ElectronAPI = {
  // Application operations
  app: {
    getVersion: createSecureInvoke<[], string>('app:getVersion'),
    quit: createSecureInvoke<[], void>('app:quit'),
    minimize: createSecureInvoke<[], void>('app:minimize'),
    maximize: createSecureInvoke<[], void>('app:maximize'),
    isMaximized: createSecureInvoke<[], boolean>('app:isMaximized'),
    unmaximize: createSecureInvoke<[], void>('app:unmaximize'),
    close: createSecureInvoke<[], void>('app:close'),
    showErrorDialog: createSecureInvoke<[string, string], void>(
      'app:showErrorDialog',
    ),
    showMessageDialog: createSecureInvoke<
      [Electron.MessageBoxOptions],
      Electron.MessageBoxReturnValue
    >('app:showMessageDialog'),
    selectDirectory: createSecureInvoke<
      [Electron.OpenDialogOptions?],
      string | null
    >('app:selectDirectory'),
    selectFile: createSecureInvoke<
      [Electron.OpenDialogOptions?],
      string | null
    >('app:selectFile'),
    saveFile: createSecureInvoke<[Electron.SaveDialogOptions?], string | null>(
      'app:saveFile',
    ),
  },

  // File system operations
  fs: {
    exists: createSecureInvoke<[string], boolean>('fs:exists'),
    readJson: createSecureInvoke<[string], any>('fs:readJson'),
    writeJson: createSecureInvoke<[string, any], void>('fs:writeJson'),
    readText: createSecureInvoke<[string, BufferEncoding?], string>(
      'fs:readText',
    ),
    writeText: createSecureInvoke<[string, string, BufferEncoding?], void>(
      'fs:writeText',
    ),
    delete: createSecureInvoke<[string], void>('fs:delete'),
    copy: createSecureInvoke<[string, string], void>('fs:copy'),
    move: createSecureInvoke<[string, string], void>('fs:move'),
    getStats: createSecureInvoke<[string], any>('fs:getStats'),
    listFiles: createSecureInvoke<[string], string[]>('fs:listFiles'),
    listDirectories: createSecureInvoke<[string], string[]>(
      'fs:listDirectories',
    ),
    ensureDirectory: createSecureInvoke<[string], void>('fs:ensureDirectory'),
    getSize: createSecureInvoke<[string], number>('fs:getSize'),
    formatSize: createSecureInvoke<[number], string>('fs:formatSize'),
    sanitizeFilename: createSecureInvoke<[string], string>(
      'fs:sanitizeFilename',
    ),
    createUniqueFilename: createSecureInvoke<[string], string>(
      'fs:createUniqueFilename',
    ),
    getAppPaths: createSecureInvoke<[], any>('fs:getAppPaths'),
    initializeDirectories: createSecureInvoke<[], void>(
      'fs:initializeDirectories',
    ),
    cleanupTempFiles: createSecureInvoke<[], void>('fs:cleanupTempFiles'),
    selectDirectory: createSecureInvoke<[], string | null>(
      'fs:selectDirectory',
    ),
  },

  // Settings management
  settings: {
    get: <T>(key: string) =>
      createSecureInvoke<[string], T>('settings:get')(key),
    set: <T>(key: string, value: T) =>
      createSecureInvoke<[string, T], void>('settings:set')(key, value),
    getAll: createSecureInvoke<[], any>('settings:getAll'),
    reset: createSecureInvoke<[], void>('settings:reset'),
    hasCustomValue: createSecureInvoke<[string], boolean>(
      'settings:hasCustomValue',
    ),
    getStorePath: createSecureInvoke<[], string>('settings:getStorePath'),
    validate: createSecureInvoke<[], boolean>('settings:validate'),
    export: createSecureInvoke<[], string>('settings:export'),
    import: createSecureInvoke<[string], boolean>('settings:import'),
    initializeDownloadLocation: createSecureInvoke<[], void>(
      'settings:initializeDownloadLocation',
    ),
    sanitize: createSecureInvoke<[], void>('settings:sanitize'),
    createBackup: createSecureInvoke<[], { backupPath: string }>(
      'settings:createBackup',
    ),
    restoreFromBackup: createSecureInvoke<[string], void>(
      'settings:restoreFromBackup',
    ),
    getVersion: createSecureInvoke<[], string>('settings:getVersion'),
    needsMigration: createSecureInvoke<[string], boolean>(
      'settings:needsMigration',
    ),
    migrate: createSecureInvoke<[string], void>('settings:migrate'),
    listBackups: createSecureInvoke<
      [],
      Array<{ path: string; date: Date; version?: string }>
    >('settings:listBackups'),
    getValidationDetails: createSecureInvoke<[], any>(
      'settings:getValidationDetails',
    ),
  },

  // Playlist operations (placeholder implementations for future tasks)
  playlist: {
    getAll: createSecureInvoke<[any?], any[]>('playlist:getAll'),
    getById: createSecureInvoke<[number], any>('playlist:getById'),
    create: createSecureInvoke<[any], any>('playlist:create'),
    update: createSecureInvoke<[number, any], any>('playlist:update'),
    delete: createSecureInvoke<[number], void>('playlist:delete'),
    searchVideos: createSecureInvoke<[any], any[]>('playlist:searchVideos'),
    addVideo: createSecureInvoke<[number, string], void>('playlist:addVideo'),
    removeVideo: createSecureInvoke<[number, string], void>(
      'playlist:removeVideo',
    ),
    reorderVideos: createSecureInvoke<[number, any[]], void>(
      'playlist:reorderVideos',
    ),
    getStats: createSecureInvoke<[number], any>('playlist:getStats'),
  },

  // YouTube operations (placeholder implementations for future tasks)
  youtube: {
    getPlaylistMetadata: createSecureInvoke<[string], any>(
      'youtube:getPlaylistMetadata',
    ),
    importPlaylist: createSecureInvoke<[string], any>('youtube:importPlaylist'),
    getVideoQualities: createSecureInvoke<[string], string[]>(
      'youtube:getVideoQualities',
    ),
    checkAvailability: createSecureInvoke<[], any>('youtube:checkAvailability'),
    updateYtDlp: createSecureInvoke<[], any>('youtube:updateYtDlp'),
    validateUrl: createSecureInvoke<[string], any>('youtube:validateUrl'),
    onImportProgress: createSecureListener<[any]>('youtube:importProgress'),
  },

  // Dependency management
  dependency: {
    checkStatus: createSecureInvoke<[], any>('dependency:checkStatus'),
    getStatus: createSecureInvoke<[], any>('dependency:getStatus'),
    install: createSecureInvoke<['ytdlp' | 'ffmpeg'], any>(
      'dependency:install',
    ),
    validate: createSecureInvoke<['ytdlp' | 'ffmpeg'], boolean>(
      'dependency:validate',
    ),
    getVersion: createSecureInvoke<['ytdlp' | 'ffmpeg'], string | null>(
      'dependency:getVersion',
    ),
    getPath: createSecureInvoke<['ytdlp' | 'ffmpeg'], string>(
      'dependency:getPath',
    ),
    cleanup: createSecureInvoke<[], any>('dependency:cleanup'),
    areAllReady: createSecureInvoke<[], boolean>('dependency:areAllReady'),
    isInitialized: createSecureInvoke<[], boolean>('dependency:isInitialized'),
    onStatusUpdated: createSecureListener<[any]>('dependency:statusUpdated'),
    onDownloadProgress: createSecureListener<[any]>(
      'dependency:downloadProgress',
    ),
    onInstallStarted: createSecureListener<[string]>(
      'dependency:installStarted',
    ),
    onInstallCompleted: createSecureListener<[string]>(
      'dependency:installCompleted',
    ),
    onInstallFailed: createSecureListener<[any]>('dependency:installFailed'),
  },

  // Error handling and recovery
  error: {
    getStatistics: createSecureInvoke<[], any>('error:getStatistics'),
    getRecentReports: createSecureInvoke<[number?], any[]>(
      'error:getRecentReports',
    ),
    report: createSecureInvoke<
      [{ message: string; stack?: string; name?: string }, any, any?],
      boolean
    >('error:report'),
    clearOldReports: createSecureInvoke<[number?], void>(
      'error:clearOldReports',
    ),
    gracefulShutdown: createSecureInvoke<[string?], void>(
      'error:gracefulShutdown',
    ),
    test:
      process.env.NODE_ENV === 'development'
        ? createSecureInvoke<[string], boolean>('error:test')
        : undefined,
    onNotification: createSecureListener<[any]>('error-notification'),
  },

  // Legacy methods for backward compatibility
  getPlaylistMetadata: createSecureInvoke<[string], any>(
    'playlist:getMetadata',
  ),
  startImport: createSecureInvoke<[string], any>('import:start'),
  onTaskUpdate: createSecureListener<[any]>('task:update'),
  getPlaylistDetails: createSecureInvoke<[string], any>('getPlaylistDetails'),
  getPlaylists: createSecureInvoke<[], any[]>('getPlaylists'),
};

// Create versioned API with backward compatibility
const versionedAPI = createVersionedAPI(electronAPI);

// Security: Only expose the API through contextBridge with additional validation
try {
  // Validate that contextBridge is available
  if (!contextBridge || typeof contextBridge.exposeInMainWorld !== 'function') {
    throw new Error(
      '❌ SECURITY VIOLATION: contextBridge is not available or compromised',
    );
  }

  // Expose the versioned API
  contextBridge.exposeInMainWorld('electronAPI', versionedAPI);

  // Also expose as 'api' for backward compatibility
  contextBridge.exposeInMainWorld('api', electronAPI);

  // Log successful initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Preload script initialized successfully');
    console.log(`🔒 API Version: ${API_VERSION}`);
    console.log('🔒 Context isolation enabled');
    console.log('🚫 Node integration disabled');
    console.log(
      `🛡️  Security channels: ${SECURITY_CONFIG.allowedChannels.size} allowed`,
    );
    console.log(`⏱️  IPC timeout: ${SECURITY_CONFIG.timeoutMs}ms`);
  }

  // Validate the exposed API
  if (typeof (globalThis as any).electronAPI === 'undefined') {
    throw new Error(
      '❌ SECURITY VIOLATION: API was not properly exposed to renderer',
    );
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logSecurityViolation(
    'API_EXPOSURE_FAILED',
    `Failed to expose API through context bridge: ${errorMessage}`,
  );
  console.error('❌ Failed to expose API through context bridge:', error);
  throw error;
}

// DOM Content Loaded handler for version display and security validation
window.addEventListener('DOMContentLoaded', () => {
  try {
    // Validate that the API is properly exposed
    if (typeof (window as any).electronAPI === 'undefined') {
      logSecurityViolation(
        'API_NOT_EXPOSED',
        'ElectronAPI is not available on window object',
      );
      throw new Error(
        '❌ SECURITY VIOLATION: ElectronAPI is not properly exposed',
      );
    }

    // Validate API version
    if (!(window as any).electronAPI._validateVersion()) {
      logSecurityViolation(
        'API_VERSION_INVALID',
        'API version validation failed',
      );
      throw new Error('❌ SECURITY VIOLATION: API version validation failed');
    }

    const replaceText = (selector: string, text: string): void => {
      const element = document.getElementById(selector);
      if (element) {
        element.innerText = text;
      }
    };

    // Display version information securely
    for (const dependency of ['chrome', 'node', 'electron'] as const) {
      const version = process.versions[dependency];
      if (version) {
        replaceText(`${dependency}-version`, version);
      }
    }

    // Log successful DOM initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DOM Content Loaded - Security validation passed');
      console.log(`🔒 API Version: ${(window as any).electronAPI._version}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '❌ DOM Content Loaded security validation failed:',
      errorMessage,
    );

    // In production, we might want to disable the application
    if (process.env.NODE_ENV === 'production') {
      document.body.innerHTML =
        '<div style="padding: 20px; text-align: center; color: red;">Security validation failed. Please restart the application.</div>';
    }
  }
});

// Enhanced security cleanup - Remove all dangerous globals
const dangerousGlobals = [
  'require',
  'exports',
  'module',
  '__dirname',
  '__filename',
  'global',
  'Buffer',
  'setImmediate',
  'clearImmediate',
];

dangerousGlobals.forEach(globalName => {
  if ((globalThis as any)[globalName]) {
    delete (globalThis as any)[globalName];
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Removed dangerous global: ${globalName}`);
    }
  }
});

// Prevent prototype pollution attacks
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
Object.freeze(Function.prototype);

// Monitor for security violations during runtime
if (process.env.NODE_ENV === 'development') {
  // Set up a periodic security check
  setInterval(() => {
    // Check if dangerous globals have been re-added
    dangerousGlobals.forEach(globalName => {
      if ((globalThis as any)[globalName]) {
        logSecurityViolation(
          'GLOBAL_REINTRODUCTION',
          `Dangerous global ${globalName} was reintroduced`,
        );
        delete (globalThis as any)[globalName];
      }
    });
  }, 5000); // Check every 5 seconds in development
}

// Final security status logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔒 Enhanced Security measures applied:');
  console.log('  ✓ Node.js globals removed from renderer context');
  console.log('  ✓ IPC communication secured through context bridge');
  console.log('  ✓ API surface limited to approved methods');
  console.log('  ✓ Channel access validation implemented');
  console.log('  ✓ Security violation logging enabled');
  console.log('  ✓ API versioning for backward compatibility');
  console.log('  ✓ Timeout protection for IPC calls');
  console.log('  ✓ Prototype pollution protection');
  console.log('  ✓ Runtime security monitoring enabled');
  console.log(
    `  ✓ ${SECURITY_CONFIG.allowedChannels.size} authorized IPC channels`,
  );
}

// Export security configuration for testing purposes (development only)
if (process.env.NODE_ENV === 'development') {
  (globalThis as any).__SECURITY_CONFIG__ = SECURITY_CONFIG;
}

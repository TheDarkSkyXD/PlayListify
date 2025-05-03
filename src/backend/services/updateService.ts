import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import logger from './logService';
import settingsService from './settingsService';

// Configure autoUpdater
autoUpdater.logger = logger;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Update events
export type UpdateStatus = 
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateInfo {
  status: UpdateStatus;
  info?: any;
  error?: Error;
  progress?: {
    bytesPerSecond: number;
    percent: number;
    total: number;
    transferred: number;
  };
}

// Store the main application window
let mainWindow: BrowserWindow | null = null;

// Register update service
export const setupUpdateService = (window: BrowserWindow) => {
  mainWindow = window;
  
  // Configure event handlers
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('checking');
  });
  
  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info);
    sendStatusToWindow('available', info);
  });
  
  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available:', info);
    sendStatusToWindow('not-available', info);
  });
  
  autoUpdater.on('error', (error) => {
    logger.error('Update error:', error);
    sendStatusToWindow('error', undefined, error);
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow('downloading', undefined, undefined, progressObj);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info);
    sendStatusToWindow('downloaded', info);
  });
  
  // Check for updates automatically if enabled in settings
  const autoCheck = settingsService.getSetting('autoUpdateCheck');
  logger.info(`Auto update check is ${autoCheck ? 'enabled' : 'disabled'}`);
  
  if (autoCheck) {
    // Wait a bit to let the app load properly before checking
    setTimeout(() => {
      checkForUpdates().catch(err => {
        logger.error('Error checking for updates:', err);
      });
    }, 5000);
  }
};

// Check for updates
export const checkForUpdates = async (): Promise<void> => {
  try {
    logger.info('Checking for updates...');
    await autoUpdater.checkForUpdates();
  } catch (error) {
    logger.error('Error checking for updates:', error);
    throw error;
  }
};

// Download update
export const downloadUpdate = async (): Promise<void> => {
  try {
    logger.info('Downloading update...');
    await autoUpdater.downloadUpdate();
  } catch (error) {
    logger.error('Error downloading update:', error);
    throw error;
  }
};

// Install update
export const installUpdate = (): void => {
  logger.info('Installing update...');
  autoUpdater.quitAndInstall(false, true);
};

// Send status to window
const sendStatusToWindow = (
  status: UpdateStatus,
  info?: any,
  error?: Error,
  progress?: any
): void => {
  if (!mainWindow) {
    logger.warn('Cannot send update status: No main window available');
    return;
  }
  
  const updateInfo: UpdateInfo = {
    status,
    info,
    error,
    progress,
  };
  
  mainWindow.webContents.send('event:app-update-available', updateInfo);
};

export default {
  setupUpdateService,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
}; 
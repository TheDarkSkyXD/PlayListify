import { app, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import logger from '../services/logService';
import updateService from '../services/updateService';

// Initialize app-related IPC handlers
export const registerAppHandlers = () => {
  // Simple ping-pong handler for testing IPC
  ipcMain.handle(IPC_CHANNELS.PING, async () => {
    logger.debug('Ping received from renderer');
    return 'pong';
  });

  // Get app info
  ipcMain.handle(IPC_CHANNELS.APP_INFO, async () => {
    logger.debug('App info requested from renderer');
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
      userDataPath: app.getPath('userData'),
    };
  });
  
  // Update-related handlers
  
  // Check for updates
  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
    logger.debug('Check for updates requested from renderer');
    try {
      await updateService.checkForUpdates();
      return { success: true };
    } catch (error) {
      logger.error('Error checking for updates:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });
  
  // Download update
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE, async () => {
    logger.debug('Download update requested from renderer');
    try {
      await updateService.downloadUpdate();
      return { success: true };
    } catch (error) {
      logger.error('Error downloading update:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });
  
  // Install update
  ipcMain.handle(IPC_CHANNELS.INSTALL_UPDATE, () => {
    logger.debug('Install update requested from renderer');
    updateService.installUpdate();
    return { success: true };
  });
}; 
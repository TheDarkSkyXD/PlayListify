import { app, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import logger from '../services/logService';

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
}; 
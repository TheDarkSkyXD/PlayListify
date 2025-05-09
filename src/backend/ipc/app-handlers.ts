import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

export function registerAppHandlers() {
  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC_CHANNELS.GET_APP_PATH, (event, pathName: Parameters<typeof app.getPath>[0]) => {
    try {
      return app.getPath(pathName);
    } catch (error) {
      console.error(`[AppHandlers] Error getting path "${pathName}":`, error);
      return null; // Or throw an error to be caught by the invoker
    }
  });

  // Add other general app-related IPC handlers here
  // For example, getting app path, user data path, etc.

  console.log('IPC app handlers registered. ⚙️');
} 
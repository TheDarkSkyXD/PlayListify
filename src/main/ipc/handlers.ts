import { ipcMain } from 'electron';

export function setupIpcHandlers() {
  // Example IPC handler
  ipcMain.handle('ping', () => 'pong');

  // Add more IPC handlers here as needed
  // Example:
  // ipcMain.handle('get-playlists', async () => {
  //   // Implementation will come later
  //   return [];
  // });
} 
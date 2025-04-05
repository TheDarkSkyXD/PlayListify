import { ipcMain } from 'electron';
import { getConsoleLogFilePath, readConsoleLog, clearConsoleLog } from '../services/logger';

/**
 * Register IPC handlers for logger functions
 */
export function registerLoggerHandlers() {
  // Get the path to the console log file
  ipcMain.handle('logger:getConsoleLogFilePath', () => {
    return getConsoleLogFilePath();
  });

  // Read the console log file
  ipcMain.handle('logger:readConsoleLog', () => {
    return readConsoleLog();
  });

  // Clear the console log file
  ipcMain.handle('logger:clearConsoleLog', () => {
    clearConsoleLog();
    return true;
  });
}

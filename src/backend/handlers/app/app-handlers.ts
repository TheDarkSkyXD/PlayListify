/**
 * IPC handlers for application-level operations
 * Handles window management, application lifecycle, and system operations
 */

import { ipcMain, app, BrowserWindow, dialog } from 'electron';
import { createIPCHandler } from '../index';

/**
 * Register all application-related IPC handlers
 */
export function registerAppHandlers(): void {
  // Get application version
  ipcMain.handle('app:getVersion', createIPCHandler(async () => {
    return app.getVersion();
  }));

  // Quit application
  ipcMain.handle('app:quit', createIPCHandler(async () => {
    app.quit();
    return { success: true };
  }));

  // Minimize window
  ipcMain.handle('app:minimize', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.minimize();
    }
    return { success: true };
  }));

  // Maximize/unmaximize window
  ipcMain.handle('app:maximize', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      if (focusedWindow.isMaximized()) {
        focusedWindow.unmaximize();
      } else {
        focusedWindow.maximize();
      }
    }
    return { success: true };
  }));

  // Check if window is maximized
  ipcMain.handle('app:isMaximized', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    return focusedWindow ? focusedWindow.isMaximized() : false;
  }));

  // Unmaximize window
  ipcMain.handle('app:unmaximize', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    }
    return { success: true };
  }));

  // Close window
  ipcMain.handle('app:close', createIPCHandler(async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.close();
    }
    return { success: true };
  }));

  // Show error dialog
  ipcMain.handle('app:showErrorDialog', createIPCHandler(async (title: string, content: string) => {
    const result = await dialog.showErrorBox(title, content);
    return { success: true };
  }));

  // Show message dialog
  ipcMain.handle('app:showMessageDialog', createIPCHandler(async (options: Electron.MessageBoxOptions) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showMessageBox(focusedWindow || new BrowserWindow(), options);
    return result;
  }));

  // Select directory dialog
  ipcMain.handle('app:selectDirectory', createIPCHandler(async (options?: Electron.OpenDialogOptions) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow || new BrowserWindow(), {
      properties: ['openDirectory'],
      ...options,
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  }));

  // Select file dialog
  ipcMain.handle('app:selectFile', createIPCHandler(async (options?: Electron.OpenDialogOptions) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow || new BrowserWindow(), {
      properties: ['openFile'],
      ...options,
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  }));

  // Save file dialog
  ipcMain.handle('app:saveFile', createIPCHandler(async (options?: Electron.SaveDialogOptions) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(focusedWindow || new BrowserWindow(), options || {});
    
    if (result.canceled || !result.filePath) {
      return null;
    }
    
    return result.filePath;
  }));

  console.log('✅ App IPC handlers registered');
}
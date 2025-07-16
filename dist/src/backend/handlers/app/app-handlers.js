"use strict";
/**
 * IPC handlers for application-level operations
 * Handles window management, application lifecycle, and system operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAppHandlers = registerAppHandlers;
const electron_1 = require("electron");
const index_1 = require("../index");
/**
 * Register all application-related IPC handlers
 */
function registerAppHandlers() {
    // Get application version
    electron_1.ipcMain.handle('app:getVersion', (0, index_1.createIPCHandler)(async () => {
        return electron_1.app.getVersion();
    }));
    // Quit application
    electron_1.ipcMain.handle('app:quit', (0, index_1.createIPCHandler)(async () => {
        electron_1.app.quit();
        return { success: true };
    }));
    // Minimize window
    electron_1.ipcMain.handle('app:minimize', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.minimize();
        }
        return { success: true };
    }));
    // Maximize/unmaximize window
    electron_1.ipcMain.handle('app:maximize', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            if (focusedWindow.isMaximized()) {
                focusedWindow.unmaximize();
            }
            else {
                focusedWindow.maximize();
            }
        }
        return { success: true };
    }));
    // Check if window is maximized
    electron_1.ipcMain.handle('app:isMaximized', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        return focusedWindow ? focusedWindow.isMaximized() : false;
    }));
    // Unmaximize window
    electron_1.ipcMain.handle('app:unmaximize', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow && focusedWindow.isMaximized()) {
            focusedWindow.unmaximize();
        }
        return { success: true };
    }));
    // Close window
    electron_1.ipcMain.handle('app:close', (0, index_1.createIPCHandler)(async () => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.close();
        }
        return { success: true };
    }));
    // Show error dialog
    electron_1.ipcMain.handle('app:showErrorDialog', (0, index_1.createIPCHandler)(async (title, content) => {
        const result = await electron_1.dialog.showErrorBox(title, content);
        return { success: true };
    }));
    // Show message dialog
    electron_1.ipcMain.handle('app:showMessageDialog', (0, index_1.createIPCHandler)(async (options) => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = await electron_1.dialog.showMessageBox(focusedWindow || new electron_1.BrowserWindow(), options);
        return result;
    }));
    // Select directory dialog
    electron_1.ipcMain.handle('app:selectDirectory', (0, index_1.createIPCHandler)(async (options) => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = await electron_1.dialog.showOpenDialog(focusedWindow || new electron_1.BrowserWindow(), {
            properties: ['openDirectory'],
            ...options,
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    }));
    // Select file dialog
    electron_1.ipcMain.handle('app:selectFile', (0, index_1.createIPCHandler)(async (options) => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = await electron_1.dialog.showOpenDialog(focusedWindow || new electron_1.BrowserWindow(), {
            properties: ['openFile'],
            ...options,
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    }));
    // Save file dialog
    electron_1.ipcMain.handle('app:saveFile', (0, index_1.createIPCHandler)(async (options) => {
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        const result = await electron_1.dialog.showSaveDialog(focusedWindow || new electron_1.BrowserWindow(), options || {});
        if (result.canceled || !result.filePath) {
            return null;
        }
        return result.filePath;
    }));
    console.log('✅ App IPC handlers registered');
}
//# sourceMappingURL=app-handlers.js.map
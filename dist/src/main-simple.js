"use strict";
/**
 * Simplified main process for React frontend setup task
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
let mainWindow = null;
const createWindow = () => {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });
    // Load the app
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
};
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(createWindow);
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//# sourceMappingURL=main-simple.js.map
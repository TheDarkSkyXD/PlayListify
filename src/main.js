const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { initializeLogging, overrideConsoleMethods, getLogsDir } = require('./backend/backend.ts'); // Added getLogsDir

// Initialize logging and override console methods at the earliest point
initializeLogging();
overrideConsoleMethods();

// Log initialization messages using the overridden console.log
// Note: logFilePath is internal to backend.ts, so we reconstruct it or get it if exposed.
// For simplicity here, we'll use getLogsDir which is exported.
const logsDir = getLogsDir(); // Get the logs directory
const logFilePath = path.join(logsDir, 'terminallogs.txt'); // Reconstruct the path
console.log(`[Logging] Log file initialized and cleared at: ${logFilePath}`);
console.log('[Logging] Console methods overridden.');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Remove all the code in this file that's duplicating handlers already in handlers.ts
// This file should only contain imports, app initialization, and/or a call to registerIpcHandlers()

// Delete everything in this file that's related to the duplicate IPC handlers 

// Entry point for the main process
import { app } from 'electron';
import { createWindow, ensureDevAssets, mainWindow } from './main';
import { initYtDlp } from './services/ytDlpManager';
import { registerIpcHandlers } from './ipc/handlers';
import { initializeSettings } from './services/settingsManager';
import fs from 'fs-extra';
import path from 'path';

// Initialize the application when ready
app.whenReady().then(async () => {
  console.log('Initializing application...');
  
  // Initialize settings
  initializeSettings();
  console.log('Settings initialized');
  
  // Ensure development assets exist
  await ensureDevAssets();
  console.log('Development assets verified');
  
  // Initialize yt-dlp
  try {
    // Check if there's a custom yt-dlp path
    const customYtDlpPath = path.join(process.cwd(), 'ytdlp', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(customYtDlpPath)) {
      console.log('Using custom yt-dlp binary');
      await initYtDlp(customYtDlpPath);
    } else {
      console.log('Using system yt-dlp binary');
      await initYtDlp();
    }
    console.log('yt-dlp initialized successfully');
  } catch (error) {
    console.error('yt-dlp initialization failed:', error);
    console.warn('YouTube features will be limited');
  }
  
  // Create the main window
  createWindow();
  console.log('Application window created');
  
  // Register IPC handlers
  registerIpcHandlers();
  console.log('IPC handlers registered');
  
  console.log('Application ready');
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 
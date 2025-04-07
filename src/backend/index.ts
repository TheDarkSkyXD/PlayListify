// Remove all the code in this file that's duplicating handlers already in handlers.ts
// This file should only contain imports, app initialization, and/or a call to registerIpcHandlers()

// Delete everything in this file that's related to the duplicate IPC handlers

// Entry point for the main process
import { app } from 'electron';
import { createWindow, ensureDevAssets, mainWindow } from './main';
import { initYtDlp } from './services/ytDlpManager';
import { registerIpcHandlers } from './ipc/handlers';
import { initializeSettings } from './services/settingsManager';
import { initFFmpeg } from './services/ytDlp/binary';
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
      console.log('🎬 Using bundled yt-dlp binary');
      await initYtDlp(customYtDlpPath);
    } else {
      console.log('🎬 Using system yt-dlp binary');
      await initYtDlp();
    }
    console.log('✅ yt-dlp initialized successfully');

    // Initialize FFmpeg
    try {
      console.log('🎬 Checking FFmpeg installation...');
      const ffmpegPath = await initFFmpeg();

      if (ffmpegPath) {
        console.log(`✅ FFmpeg initialized successfully at: ${ffmpegPath}`);
      } else {
        console.log('ℹ️ FFmpeg will be downloaded automatically when needed');
        console.log('ℹ️ Video downloads will use best single format until FFmpeg is available');
      }
    } catch (ffmpegError) {
      console.log('⚠️ FFmpeg initialization issue:', ffmpegError);
      console.log('ℹ️ Video downloads will use best single format instead of merging separate audio and video streams');
    }
  } catch (error) {
    console.log('❌ yt-dlp initialization failed:', error);
    console.log('⚠️ YouTube features will be limited');
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
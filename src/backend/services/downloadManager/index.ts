import { app } from 'electron';
import { DownloadManager } from './core';

// Import operation modules to patch the DownloadManager prototype
import './queueOperations';
import './itemOperations';
import './statusOperations';

// Re-export types
export * from './types';

// Create and export a singleton instance
export const downloadManager = new DownloadManager();

// In a test environment, we don't need to initialize automatically
if (process.env.NODE_ENV !== 'test') {
  // Initialize the download manager when the app is ready
  if (app.whenReady) {
    app.whenReady().then(() => {
      // We'll initialize the download manager explicitly in main.ts
      // This is just a fallback in case it's not done there
      setTimeout(() => {
        if (!downloadManager.isInitialized()) {
          downloadManager.initialize();
        }
      }, 2000); // Wait 2 seconds to ensure logger is initialized
    });
  }
}

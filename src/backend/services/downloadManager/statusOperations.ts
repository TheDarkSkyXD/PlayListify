import { logToFile } from '../logger';
import { DownloadItem } from './types';
import { DownloadManager } from './core';

// Patch the DownloadManager prototype with the implementation
DownloadManager.prototype.sendDownloadUpdate = function(download: DownloadItem): void {
  sendDownloadUpdate(this, download);
};

/**
 * Send a download update to the renderer
 */
export function sendDownloadUpdate(
  manager: DownloadManager,
  download: DownloadItem
): void {
  const props = manager.getProps();

  try {
    // Check if we have a main window
    if (!props.mainWindow) {
      return;
    }

    // Check if the window is destroyed
    if (props.mainWindow.isDestroyed()) {
      return;
    }

    // Send the update to the renderer
    props.mainWindow.webContents.send('download:update', download);
  } catch (error) {
    logToFile('ERROR', `Error sending download update: ${error}`);
  }
}

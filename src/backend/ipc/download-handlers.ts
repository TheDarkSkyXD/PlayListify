import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import * as downloadManager from '../services/download-manager';
import { IpcResponse, DownloadQueueItem } from '../../shared/types';

// Type for itemDetails, matching what's expected by downloadManager.addItemToQueue
type DownloadAddItemDetails = Parameters<typeof downloadManager.addItemToQueue>[0];

// Function to get the main window (you might have a more robust way to manage this)
function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] || null;
}

export function registerDownloadHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ADD_ITEM, async (event, itemDetails: DownloadAddItemDetails): Promise<IpcResponse<{ downloadId: string }>> => {
    console.log('IPC: DOWNLOAD_ADD_ITEM received', itemDetails);
    const newItem = downloadManager.addItemToQueue(itemDetails);
    if (newItem) {
      return { success: true, data: { downloadId: newItem.id } };
    }
    return { success: false, error: 'Failed to add item to download queue. Download manager may not be initialized.' };
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_PAUSE_ITEM, async (event, downloadId: string): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_PAUSE_ITEM received for ID:', downloadId);
    return downloadManager.pauseItem(downloadId);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RESUME_ITEM, async (event, downloadId: string): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_RESUME_ITEM received for ID:', downloadId);
    return downloadManager.resumeItem(downloadId);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL_ITEM, async (event, downloadId: string): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_CANCEL_ITEM received for ID:', downloadId);
    return downloadManager.cancelItem(downloadId);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RETRY_ITEM, async (event, downloadId: string): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_RETRY_ITEM received for ID:', downloadId);
    return downloadManager.retryItem(downloadId);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REMOVE_ITEM, async (event, downloadId: string): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_REMOVE_ITEM received for ID:', downloadId);
    return downloadManager.removeItem(downloadId);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_ALL_ITEMS, async (): Promise<IpcResponse<DownloadQueueItem[]>> => {
    console.log('IPC: DOWNLOAD_GET_ALL_ITEMS received');
    return downloadManager.getAllItems();
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED, async (): Promise<IpcResponse<void>> => {
    console.log('IPC: DOWNLOAD_CLEAR_COMPLETED received');
    return downloadManager.clearCompleted();
  });

  // Setup listener for progress events from downloadManager (if using EventEmitter approach)
  // This is a conceptual setup. The actual event emission needs to be in downloadManager.
  // downloadManager.downloadEvents?.on('progress', (progressData: Partial<DownloadQueueItem>) => {
  //   const mainWindow = getMainWindow();
  //   if (mainWindow && !mainWindow.isDestroyed()) {
  //     mainWindow.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS_UPDATE, progressData);
  //   }
  // });

  console.log('IPC download handlers registered and calling DownloadManager.');
} 
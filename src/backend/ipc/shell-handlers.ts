import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels'; // Corrected path
import { logger } from '../utils/logger';

/**
 * Registers IPC handlers for shell-related operations.
 */
export function registerShellHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, async (_event, url: string) => {
    if (!url || (typeof url !== 'string') || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      logger.warn(`[ShellHandler] Attempted to open invalid or non-HTTP(S) URL: ${url}`);
      throw new Error('Invalid URL. Only http and https protocols are allowed.');
    }
    try {
      logger.info(`[ShellHandler] Opening external URL: ${url}`);
      await shell.openExternal(url);
      // shell.openExternal does not return a value that indicates success/failure directly in all cases,
      // but it throws an error on failure for some OS/protocol combinations.
      // If it doesn't throw, we assume success.
    } catch (error: any) {
      logger.error(`[ShellHandler] Failed to open external URL "${url}": ${error.message}`);
      // Rethrow to let the frontend know it failed, or return a structured error response
      throw new Error(`Failed to open URL: ${error.message}`);
    }
  });

  logger.info('[IPC Handlers] Shell handlers registered.');
} 
/**
 * Window Management IPC Handlers
 * Handles window-related IPC communication between renderer and main processes
 */

import type { WindowManagerService } from '../services/window-manager-service';
import type { LoggerService } from '../services/logger-service';
import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';

let windowManager: WindowManagerService;
let logger: LoggerService;

/**
 * Initialize window IPC handlers
 */
export function initializeWindowHandlers(
  windowManagerService: WindowManagerService,
  loggerService: LoggerService,
): void {
  windowManager = windowManagerService;
  logger = loggerService;

  // App window operations
  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, handleMinimize);
  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, handleMaximize);
  ipcMain.handle(IPC_CHANNELS.APP_IS_MAXIMIZED, handleIsMaximized);
  ipcMain.handle(IPC_CHANNELS.APP_UNMAXIMIZE, handleUnmaximize);
  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, handleClose);

  logger.debug('Window IPC handlers initialized', 'WindowHandlers');
}

/**
 * Cleanup window IPC handlers
 */
export function cleanupWindowHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.APP_MINIMIZE);
  ipcMain.removeHandler(IPC_CHANNELS.APP_MAXIMIZE);
  ipcMain.removeHandler(IPC_CHANNELS.APP_IS_MAXIMIZED);
  ipcMain.removeHandler(IPC_CHANNELS.APP_UNMAXIMIZE);
  ipcMain.removeHandler(IPC_CHANNELS.APP_CLOSE);

  logger?.debug('Window IPC handlers cleaned up', 'WindowHandlers');
}

/**
 * Handle window minimize request
 */
async function handleMinimize(
  event: Electron.IpcMainInvokeEvent,
): Promise<void> {
  try {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      window.minimize();
      logger.debug('Window minimized via IPC', 'WindowHandlers');
    }
  } catch (error) {
    logger.error('Failed to minimize window', 'WindowHandlers', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Handle window maximize request
 */
async function handleMaximize(
  event: Electron.IpcMainInvokeEvent,
): Promise<void> {
  try {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      logger.debug('Window maximize toggled via IPC', 'WindowHandlers');
    }
  } catch (error) {
    logger.error('Failed to maximize window', 'WindowHandlers', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Handle window is maximized check
 */
async function handleIsMaximized(
  event: Electron.IpcMainInvokeEvent,
): Promise<boolean> {
  try {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      return window.isMaximized();
    }
    return false;
  } catch (error) {
    logger.error('Failed to check if window is maximized', 'WindowHandlers', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Handle window unmaximize request
 */
async function handleUnmaximize(
  event: Electron.IpcMainInvokeEvent,
): Promise<void> {
  try {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      window.unmaximize();
      logger.debug('Window unmaximized via IPC', 'WindowHandlers');
    }
  } catch (error) {
    logger.error('Failed to unmaximize window', 'WindowHandlers', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Handle window close request
 */
async function handleClose(event: Electron.IpcMainInvokeEvent): Promise<void> {
  try {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      window.close();
      logger.debug('Window closed via IPC', 'WindowHandlers');
    }
  } catch (error) {
    logger.error('Failed to close window', 'WindowHandlers', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * IPC handlers for dependency management
 * Provides secure communication between main and renderer processes for dependency operations
 */

import { ipcMain, BrowserWindow } from 'electron';
import { DependencyManagerService } from '../services/dependency-manager-service';
import type { DependencyStatus, DependencyDownloadProgress } from '@/shared/interfaces/dependency-manager';

let dependencyManager: DependencyManagerService | null = null;

/**
 * Initialize dependency IPC handlers
 */
export function initializeDependencyHandlers(): void {
  // Create dependency manager instance
  dependencyManager = new DependencyManagerService();

  // Set up event forwarding to renderer
  dependencyManager.on('statusUpdated', (status: DependencyStatus) => {
    broadcastToRenderers('dependency:statusUpdated', status);
  });

  dependencyManager.on('downloadProgress', (progress: DependencyDownloadProgress) => {
    broadcastToRenderers('dependency:downloadProgress', progress);
  });

  dependencyManager.on('installStarted', (dependency: string) => {
    broadcastToRenderers('dependency:installStarted', dependency);
  });

  dependencyManager.on('installCompleted', (dependency: string) => {
    broadcastToRenderers('dependency:installCompleted', dependency);
  });

  dependencyManager.on('installFailed', (dependency: string, error: Error) => {
    broadcastToRenderers('dependency:installFailed', { dependency, error: error.message });
  });

  dependencyManager.on('dependenciesCleanedUp', () => {
    broadcastToRenderers('dependency:cleanedUp');
  });

  // Initialize the dependency manager
  dependencyManager.initialize().catch((error) => {
    console.error('Failed to initialize dependency manager:', error);
    broadcastToRenderers('dependency:initializationFailed', error.message);
  });

  // Register IPC handlers
  registerHandlers();
}

/**
 * Register all dependency-related IPC handlers
 */
function registerHandlers(): void {
  if (!dependencyManager) {
    throw new Error('Dependency manager not initialized');
  }

  // Check dependency status
  ipcMain.handle('dependency:checkStatus', async () => {
    try {
      return await dependencyManager!.checkDependencies();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Get cached dependency status
  ipcMain.handle('dependency:getStatus', () => {
    return dependencyManager!.getDependencyStatus();
  });

  // Install a specific dependency
  ipcMain.handle('dependency:install', async (_event, dependencyName: 'ytdlp' | 'ffmpeg') => {
    try {
      if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
        throw new Error(`Invalid dependency name: ${dependencyName}`);
      }
      
      await dependencyManager!.installDependency(dependencyName);
      return { success: true };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Validate a specific dependency
  ipcMain.handle('dependency:validate', async (_event, dependencyName: 'ytdlp' | 'ffmpeg') => {
    try {
      if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
        throw new Error(`Invalid dependency name: ${dependencyName}`);
      }
      
      return await dependencyManager!.validateDependency(dependencyName);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Get dependency version
  ipcMain.handle('dependency:getVersion', async (_event, dependencyName: 'ytdlp' | 'ffmpeg') => {
    try {
      if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
        throw new Error(`Invalid dependency name: ${dependencyName}`);
      }
      
      return await dependencyManager!.getDependencyVersion(dependencyName);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Get dependency path
  ipcMain.handle('dependency:getPath', (_event, dependencyName: 'ytdlp' | 'ffmpeg') => {
    try {
      if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
        throw new Error(`Invalid dependency name: ${dependencyName}`);
      }
      
      return dependencyManager!.getDependencyPath(dependencyName);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Clean up all dependencies
  ipcMain.handle('dependency:cleanup', async () => {
    try {
      await dependencyManager!.cleanupDependencies();
      return { success: true };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  // Check if all dependencies are ready
  ipcMain.handle('dependency:areAllReady', () => {
    return dependencyManager!.areAllDependenciesReady();
  });

  // Check if dependency manager is initialized
  ipcMain.handle('dependency:isInitialized', () => {
    return dependencyManager!.isInitialized();
  });
}

/**
 * Broadcast an event to all renderer processes
 */
function broadcastToRenderers(channel: string, data?: any): void {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}

/**
 * Get the dependency manager instance
 */
export function getDependencyManager(): DependencyManagerService | null {
  return dependencyManager;
}

/**
 * Cleanup dependency handlers
 */
export function cleanupDependencyHandlers(): void {
  if (dependencyManager) {
    dependencyManager.removeAllListeners();
    dependencyManager = null;
  }

  // Remove IPC handlers
  const handlers = [
    'dependency:checkStatus',
    'dependency:getStatus',
    'dependency:install',
    'dependency:validate',
    'dependency:getVersion',
    'dependency:getPath',
    'dependency:cleanup',
    'dependency:areAllReady',
    'dependency:isInitialized',
  ];

  handlers.forEach(handler => {
    ipcMain.removeHandler(handler);
  });
}
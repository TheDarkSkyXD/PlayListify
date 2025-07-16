/**
 * Central IPC handler registry for secure communication between main and renderer processes
 * This file organizes all IPC handlers by functional domains and provides proper error handling
 */

import { ipcMain } from 'electron';
import { registerAppHandlers } from './app/app-handlers';
import { registerFileHandlers } from './files/file-handlers';
import { registerSettingsHandlers } from './settings/settings-handlers';
import { registerPlaylistHandlers } from './app/playlist-handlers';
import { initializeDependencyHandlers, cleanupDependencyHandlers } from './dependency-handlers';
import { initializeErrorHandlers, cleanupErrorHandlers } from './error-handlers';

/**
 * Interface for IPC handler registration functions
 */
interface HandlerRegistration {
  register: () => void;
  cleanup?: () => void;
}

/**
 * Registry of all IPC handler domains
 */
const handlerRegistry: Record<string, HandlerRegistration> = {
  app: {
    register: registerAppHandlers,
  },
  files: {
    register: registerFileHandlers,
  },
  settings: {
    register: registerSettingsHandlers,
  },
  playlists: {
    register: registerPlaylistHandlers,
  },
  dependencies: {
    register: initializeDependencyHandlers,
    cleanup: cleanupDependencyHandlers,
  },
};

/**
 * Initialize all IPC handlers with proper error handling
 */
export function initializeIPCHandlers(): void {
  try {
    console.log('🔧 Initializing IPC handlers...');
    
    // Register all handler domains
    Object.entries(handlerRegistry).forEach(([domain, handler]) => {
      try {
        handler.register();
        console.log(`✅ ${domain} handlers registered successfully`);
      } catch (error) {
        console.error(`❌ Failed to register ${domain} handlers:`, error);
        throw error;
      }
    });
    
    // Set up global error handling for IPC
    setupGlobalIPCErrorHandling();
    
    console.log('🎉 All IPC handlers initialized successfully');
  } catch (error) {
    console.error('💥 Critical error during IPC handler initialization:', error);
    throw error;
  }
}

/**
 * Cleanup all IPC handlers
 */
export function cleanupIPCHandlers(): void {
  try {
    console.log('🧹 Cleaning up IPC handlers...');
    
    // Cleanup handlers that have cleanup functions
    Object.entries(handlerRegistry).forEach(([domain, handler]) => {
      if (handler.cleanup) {
        try {
          handler.cleanup();
          console.log(`✅ ${domain} handlers cleaned up successfully`);
        } catch (error) {
          console.error(`❌ Failed to cleanup ${domain} handlers:`, error);
        }
      }
    });
    
    // Remove all IPC handlers
    ipcMain.removeAllListeners();
    
    console.log('🎉 All IPC handlers cleaned up successfully');
  } catch (error) {
    console.error('💥 Error during IPC handler cleanup:', error);
  }
}

/**
 * Set up global error handling for IPC communication
 */
function setupGlobalIPCErrorHandling(): void {
  // Handle uncaught exceptions in IPC handlers
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught exception in IPC handler:', error);
    // In production, you might want to report this error
  });
  
  // Handle unhandled promise rejections in IPC handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled rejection in IPC handler:', reason, 'at:', promise);
    // In production, you might want to report this error
  });
}

/**
 * Utility function to create standardized IPC response
 */
export function createIPCResponse<T>(data?: T, error?: string): IPCResponse<T> {
  if (error) {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Utility function to handle IPC errors consistently
 */
export function handleIPCError(error: unknown, context: string): IPCResponse<any> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`IPC Error in ${context}:`, error);
  
  return createIPCResponse(undefined, errorMessage);
}

/**
 * Standard IPC response interface
 */
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Type-safe IPC handler wrapper
 */
export function createIPCHandler<TArgs extends any[], TReturn>(
  handler: (...args: TArgs) => Promise<TReturn> | TReturn
) {
  return async (_event: Electron.IpcMainInvokeEvent, ...args: TArgs): Promise<IPCResponse<TReturn>> => {
    try {
      const result = await handler(...args);
      return createIPCResponse(result);
    } catch (error) {
      return handleIPCError(error, handler.name || 'anonymous handler');
    }
  };
}
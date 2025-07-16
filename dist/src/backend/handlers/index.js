"use strict";
/**
 * Central IPC handler registry for secure communication between main and renderer processes
 * This file organizes all IPC handlers by functional domains and provides proper error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIPCHandlers = initializeIPCHandlers;
exports.cleanupIPCHandlers = cleanupIPCHandlers;
exports.createIPCResponse = createIPCResponse;
exports.handleIPCError = handleIPCError;
exports.createIPCHandler = createIPCHandler;
const electron_1 = require("electron");
const app_handlers_1 = require("./app/app-handlers");
const file_handlers_1 = require("./files/file-handlers");
const settings_handlers_1 = require("./settings/settings-handlers");
const playlist_handlers_1 = require("./app/playlist-handlers");
const dependency_handlers_1 = require("./dependency-handlers");
/**
 * Registry of all IPC handler domains
 */
const handlerRegistry = {
    app: {
        register: app_handlers_1.registerAppHandlers,
    },
    files: {
        register: file_handlers_1.registerFileHandlers,
    },
    settings: {
        register: settings_handlers_1.registerSettingsHandlers,
    },
    playlists: {
        register: playlist_handlers_1.registerPlaylistHandlers,
    },
    dependencies: {
        register: dependency_handlers_1.initializeDependencyHandlers,
        cleanup: dependency_handlers_1.cleanupDependencyHandlers,
    },
};
/**
 * Initialize all IPC handlers with proper error handling
 */
function initializeIPCHandlers() {
    try {
        console.log('🔧 Initializing IPC handlers...');
        // Register all handler domains
        Object.entries(handlerRegistry).forEach(([domain, handler]) => {
            try {
                handler.register();
                console.log(`✅ ${domain} handlers registered successfully`);
            }
            catch (error) {
                console.error(`❌ Failed to register ${domain} handlers:`, error);
                throw error;
            }
        });
        // Set up global error handling for IPC
        setupGlobalIPCErrorHandling();
        console.log('🎉 All IPC handlers initialized successfully');
    }
    catch (error) {
        console.error('💥 Critical error during IPC handler initialization:', error);
        throw error;
    }
}
/**
 * Cleanup all IPC handlers
 */
function cleanupIPCHandlers() {
    try {
        console.log('🧹 Cleaning up IPC handlers...');
        // Cleanup handlers that have cleanup functions
        Object.entries(handlerRegistry).forEach(([domain, handler]) => {
            if (handler.cleanup) {
                try {
                    handler.cleanup();
                    console.log(`✅ ${domain} handlers cleaned up successfully`);
                }
                catch (error) {
                    console.error(`❌ Failed to cleanup ${domain} handlers:`, error);
                }
            }
        });
        // Remove all IPC handlers
        electron_1.ipcMain.removeAllListeners();
        console.log('🎉 All IPC handlers cleaned up successfully');
    }
    catch (error) {
        console.error('💥 Error during IPC handler cleanup:', error);
    }
}
/**
 * Set up global error handling for IPC communication
 */
function setupGlobalIPCErrorHandling() {
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
function createIPCResponse(data, error) {
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
function handleIPCError(error, context) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`IPC Error in ${context}:`, error);
    return createIPCResponse(undefined, errorMessage);
}
/**
 * Type-safe IPC handler wrapper
 */
function createIPCHandler(handler) {
    return async (_event, ...args) => {
        try {
            const result = await handler(...args);
            return createIPCResponse(result);
        }
        catch (error) {
            return handleIPCError(error, handler.name || 'anonymous handler');
        }
    };
}
//# sourceMappingURL=index.js.map
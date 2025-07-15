"use strict";
/**
 * IPC handlers for dependency management
 * Provides secure communication between main and renderer processes for dependency operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDependencyHandlers = initializeDependencyHandlers;
exports.getDependencyManager = getDependencyManager;
exports.cleanupDependencyHandlers = cleanupDependencyHandlers;
const electron_1 = require("electron");
const dependency_manager_service_1 = require("../services/dependency-manager-service");
let dependencyManager = null;
/**
 * Initialize dependency IPC handlers
 */
function initializeDependencyHandlers() {
    // Create dependency manager instance
    dependencyManager = new dependency_manager_service_1.DependencyManagerService();
    // Set up event forwarding to renderer
    dependencyManager.on('statusUpdated', (status) => {
        broadcastToRenderers('dependency:statusUpdated', status);
    });
    dependencyManager.on('downloadProgress', (progress) => {
        broadcastToRenderers('dependency:downloadProgress', progress);
    });
    dependencyManager.on('installStarted', (dependency) => {
        broadcastToRenderers('dependency:installStarted', dependency);
    });
    dependencyManager.on('installCompleted', (dependency) => {
        broadcastToRenderers('dependency:installCompleted', dependency);
    });
    dependencyManager.on('installFailed', (dependency, error) => {
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
function registerHandlers() {
    if (!dependencyManager) {
        throw new Error('Dependency manager not initialized');
    }
    // Check dependency status
    electron_1.ipcMain.handle('dependency:checkStatus', async () => {
        try {
            return await dependencyManager.checkDependencies();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Get cached dependency status
    electron_1.ipcMain.handle('dependency:getStatus', () => {
        return dependencyManager.getDependencyStatus();
    });
    // Install a specific dependency
    electron_1.ipcMain.handle('dependency:install', async (_event, dependencyName) => {
        try {
            if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
                throw new Error(`Invalid dependency name: ${dependencyName}`);
            }
            await dependencyManager.installDependency(dependencyName);
            return { success: true };
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Validate a specific dependency
    electron_1.ipcMain.handle('dependency:validate', async (_event, dependencyName) => {
        try {
            if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
                throw new Error(`Invalid dependency name: ${dependencyName}`);
            }
            return await dependencyManager.validateDependency(dependencyName);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Get dependency version
    electron_1.ipcMain.handle('dependency:getVersion', async (_event, dependencyName) => {
        try {
            if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
                throw new Error(`Invalid dependency name: ${dependencyName}`);
            }
            return await dependencyManager.getDependencyVersion(dependencyName);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Get dependency path
    electron_1.ipcMain.handle('dependency:getPath', (_event, dependencyName) => {
        try {
            if (!['ytdlp', 'ffmpeg'].includes(dependencyName)) {
                throw new Error(`Invalid dependency name: ${dependencyName}`);
            }
            return dependencyManager.getDependencyPath(dependencyName);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Clean up all dependencies
    electron_1.ipcMain.handle('dependency:cleanup', async () => {
        try {
            await dependencyManager.cleanupDependencies();
            return { success: true };
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    });
    // Check if all dependencies are ready
    electron_1.ipcMain.handle('dependency:areAllReady', () => {
        return dependencyManager.areAllDependenciesReady();
    });
    // Check if dependency manager is initialized
    electron_1.ipcMain.handle('dependency:isInitialized', () => {
        return dependencyManager.isInitialized();
    });
}
/**
 * Broadcast an event to all renderer processes
 */
function broadcastToRenderers(channel, data) {
    const windows = electron_1.BrowserWindow.getAllWindows();
    windows.forEach(window => {
        if (!window.isDestroyed()) {
            window.webContents.send(channel, data);
        }
    });
}
/**
 * Get the dependency manager instance
 */
function getDependencyManager() {
    return dependencyManager;
}
/**
 * Cleanup dependency handlers
 */
function cleanupDependencyHandlers() {
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
        electron_1.ipcMain.removeHandler(handler);
    });
}
//# sourceMappingURL=dependency-handlers.js.map
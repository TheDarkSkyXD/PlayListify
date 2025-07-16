"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsHandlers = registerSettingsHandlers;
const electron_1 = require("electron");
const index_1 = require("../index");
const settingsService_1 = require("../../services/settingsService");
// Initialize settings service
const settingsService = new settingsService_1.SettingsService();
function registerSettingsHandlers() {
    // Get a setting value
    electron_1.ipcMain.handle('settings:get', (0, index_1.createIPCHandler)(async (key) => {
        return settingsService.get(key);
    }));
    // Set a setting value
    electron_1.ipcMain.handle('settings:set', (0, index_1.createIPCHandler)(async (key, value) => {
        settingsService.set(key, value);
        return { success: true };
    }));
    // Get all settings
    electron_1.ipcMain.handle('settings:getAll', (0, index_1.createIPCHandler)(async () => {
        return settingsService.getAll();
    }));
    // Reset settings to defaults
    electron_1.ipcMain.handle('settings:reset', (0, index_1.createIPCHandler)(async () => {
        settingsService.reset();
        return { success: true };
    }));
    // Check if a setting has been customized
    electron_1.ipcMain.handle('settings:hasCustomValue', (0, index_1.createIPCHandler)(async (key) => {
        return settingsService.has(key);
    }));
    // Get settings store path
    electron_1.ipcMain.handle('settings:getStorePath', (0, index_1.createIPCHandler)(async () => {
        return settingsService.getStorePath();
    }));
    // Validate settings
    electron_1.ipcMain.handle('settings:validate', (0, index_1.createIPCHandler)(async () => {
        const validation = settingsService.validate();
        return validation.isValid;
    }));
    // Export settings
    electron_1.ipcMain.handle('settings:export', (0, index_1.createIPCHandler)(async () => {
        const exportData = settingsService.export();
        return JSON.stringify(exportData);
    }));
    // Import settings
    electron_1.ipcMain.handle('settings:import', (0, index_1.createIPCHandler)(async (jsonString) => {
        const importData = JSON.parse(jsonString);
        return settingsService.import(importData);
    }));
    // Initialize download location (placeholder - will be implemented in later tasks)
    electron_1.ipcMain.handle('settings:initializeDownloadLocation', (0, index_1.createIPCHandler)(async () => {
        // Placeholder implementation
        return { success: true };
    }));
    console.log('✅ Settings IPC handlers registered');
}
;
//# sourceMappingURL=settings-handlers.js.map
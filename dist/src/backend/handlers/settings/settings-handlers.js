"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsHandlers = void 0;
const electron_1 = require("electron");
const settingsService_1 = require("../services/settingsService");
const registerSettingsHandlers = () => {
    // Get a setting value
    electron_1.ipcMain.handle('settings:get', async (event, key) => {
        try {
            const value = settingsService_1.settingsService.get(key);
            return { success: true, data: value };
        }
        catch (error) {
            console.error('Settings get error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Set a setting value
    electron_1.ipcMain.handle('settings:set', async (event, key, value) => {
        try {
            settingsService_1.settingsService.set(key, value);
            return { success: true };
        }
        catch (error) {
            console.error('Settings set error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get all settings
    electron_1.ipcMain.handle('settings:getAll', async (event) => {
        try {
            const settings = settingsService_1.settingsService.getAll();
            return { success: true, data: settings };
        }
        catch (error) {
            console.error('Settings getAll error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Reset settings to defaults
    electron_1.ipcMain.handle('settings:reset', async (event) => {
        try {
            settingsService_1.settingsService.reset();
            return { success: true };
        }
        catch (error) {
            console.error('Settings reset error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Check if a setting has been customized
    electron_1.ipcMain.handle('settings:hasCustomValue', async (event, key) => {
        try {
            const hasCustom = settingsService_1.settingsService.hasCustomValue(key);
            return { success: true, data: hasCustom };
        }
        catch (error) {
            console.error('Settings hasCustomValue error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get settings store path
    electron_1.ipcMain.handle('settings:getStorePath', async (event) => {
        try {
            const path = settingsService_1.settingsService.getStorePath();
            return { success: true, data: path };
        }
        catch (error) {
            console.error('Settings getStorePath error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Validate settings
    electron_1.ipcMain.handle('settings:validate', async (event) => {
        try {
            const isValid = settingsService_1.settingsService.validateSettings();
            return { success: true, data: isValid };
        }
        catch (error) {
            console.error('Settings validate error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Export settings
    electron_1.ipcMain.handle('settings:export', async (event) => {
        try {
            const exported = settingsService_1.settingsService.exportSettings();
            return { success: true, data: exported };
        }
        catch (error) {
            console.error('Settings export error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Import settings
    electron_1.ipcMain.handle('settings:import', async (event, jsonString) => {
        try {
            const imported = settingsService_1.settingsService.importSettings(jsonString);
            return { success: true, data: imported };
        }
        catch (error) {
            console.error('Settings import error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Initialize download location
    electron_1.ipcMain.handle('settings:initializeDownloadLocation', async (event) => {
        try {
            await settingsService_1.settingsService.initializeDownloadLocation();
            return { success: true };
        }
        catch (error) {
            console.error('Settings initializeDownloadLocation error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    console.log('Settings IPC handlers registered');
};
exports.registerSettingsHandlers = registerSettingsHandlers;
//# sourceMappingURL=settings-handlers.js.map
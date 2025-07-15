import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { settingsService } from '../services/settingsService';

export const registerSettingsHandlers = (): void => {
  // Get a setting value
  ipcMain.handle('settings:get', async (event: IpcMainInvokeEvent, key: string) => {
    try {
      const value = settingsService.get(key as any);
      return { success: true, data: value };
    } catch (error) {
      console.error('Settings get error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Set a setting value
  ipcMain.handle('settings:set', async (event: IpcMainInvokeEvent, key: string, value: any) => {
    try {
      settingsService.set(key as any, value);
      return { success: true };
    } catch (error) {
      console.error('Settings set error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get all settings
  ipcMain.handle('settings:getAll', async (event: IpcMainInvokeEvent) => {
    try {
      const settings = settingsService.getAll();
      return { success: true, data: settings };
    } catch (error) {
      console.error('Settings getAll error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Reset settings to defaults
  ipcMain.handle('settings:reset', async (event: IpcMainInvokeEvent) => {
    try {
      settingsService.reset();
      return { success: true };
    } catch (error) {
      console.error('Settings reset error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Check if a setting has been customized
  ipcMain.handle('settings:hasCustomValue', async (event: IpcMainInvokeEvent, key: string) => {
    try {
      const hasCustom = settingsService.hasCustomValue(key as any);
      return { success: true, data: hasCustom };
    } catch (error) {
      console.error('Settings hasCustomValue error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get settings store path
  ipcMain.handle('settings:getStorePath', async (event: IpcMainInvokeEvent) => {
    try {
      const path = settingsService.getStorePath();
      return { success: true, data: path };
    } catch (error) {
      console.error('Settings getStorePath error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Validate settings
  ipcMain.handle('settings:validate', async (event: IpcMainInvokeEvent) => {
    try {
      const isValid = settingsService.validateSettings();
      return { success: true, data: isValid };
    } catch (error) {
      console.error('Settings validate error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Export settings
  ipcMain.handle('settings:export', async (event: IpcMainInvokeEvent) => {
    try {
      const exported = settingsService.exportSettings();
      return { success: true, data: exported };
    } catch (error) {
      console.error('Settings export error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Import settings
  ipcMain.handle('settings:import', async (event: IpcMainInvokeEvent, jsonString: string) => {
    try {
      const imported = settingsService.importSettings(jsonString);
      return { success: true, data: imported };
    } catch (error) {
      console.error('Settings import error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Initialize download location
  ipcMain.handle('settings:initializeDownloadLocation', async (event: IpcMainInvokeEvent) => {
    try {
      await settingsService.initializeDownloadLocation();
      return { success: true };
    } catch (error) {
      console.error('Settings initializeDownloadLocation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log('Settings IPC handlers registered');
};
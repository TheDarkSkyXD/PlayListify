// src/backend/ipc/settingsHandlers.ts
import { ipcMain } from 'electron';
import {
  getSetting,
  setSetting,
  getAllSettings,
  resetToDefaults,
  // initializeStoragePaths, // This might be called directly from main or based on events
  // getCurrentUserAccount, // Decide if these need dedicated IPC or are part of general settings
  // setCurrentUserAccount,
  // clearCurrentUserAccount,
} from '../services/settingsService';
import { Settings, IpcResponse } from '../../shared/types';

export function registerSettingsHandlers(): void {
  ipcMain.handle(
    'settings:getSetting',
    async (event, key: keyof Settings): Promise<IpcResponse<Settings[keyof Settings]>> => {
      try {
        const value = getSetting(key);
        return { success: true, data: value };
      } catch (error) {
        console.error(`Error getting setting '${key}':`, error);
        return { success: false, error: { message: error instanceof Error ? error.message : 'An unknown error occurred' } };
      }
    }
  );

  ipcMain.handle(
    'settings:setSetting',
    async (event, key: keyof Settings, value: Settings[keyof Settings]): Promise<IpcResponse<void>> => {
      try {
        setSetting(key, value);
        return { success: true };
      } catch (error) {
        console.error(`Error setting setting '${key}':`, error);
        return { success: false, error: { message: error instanceof Error ? error.message : 'An unknown error occurred' } };
      }
    }
  );

  ipcMain.handle(
    'settings:getAllSettings',
    async (): Promise<IpcResponse<Settings>> => {
      try {
        const settings = getAllSettings();
        return { success: true, data: settings };
      } catch (error) {
        console.error('Error getting all settings:', error);
        return { success: false, error: { message: error instanceof Error ? error.message : 'An unknown error occurred' } };
      }
    }
  );

  ipcMain.handle(
    'settings:resetToDefaults',
    async (): Promise<IpcResponse<void>> => {
      try {
        resetToDefaults();
        // Optionally, re-fetch and return the new defaults
        // const newSettings = getAllSettings();
        // return { success: true, data: newSettings }; // If frontend needs immediate update
        return { success: true };
      } catch (error) {
        console.error('Error resetting settings to defaults:', error);
        return { success: false, error: { message: error instanceof Error ? error.message : 'An unknown error occurred' } };
      }
    }
  );

  // Example for a specific account-related IPC handler, if needed:
  // ipcMain.handle('settings:getCurrentUser', async () => {
  //   try {
  //     const user = getCurrentUserAccount();
  //     return { success: true, data: user };
  //   } catch (error) {
  //     // ... error handling
  //   }
  // });

  console.log('Registered settings IPC handlers');
}
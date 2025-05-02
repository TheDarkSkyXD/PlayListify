import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import settingsService, { SettingsSchema } from '../services/settingsService';
import logger from '../services/logService';

// Register settings-related IPC handlers
export const registerSettingsHandlers = () => {
  // Get all settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    logger.debug('Getting all settings');
    return settingsService.getSettings();
  });

  // Get single setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_, keyName: string) => {
    logger.debug(`Getting setting: ${keyName}`);
    // Validate that key is a valid setting name
    if (isValidSettingKey(keyName)) {
      return settingsService.getSetting(keyName);
    }
    throw new Error(`Invalid setting key: ${keyName}`);
  });

  // Set setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_, { key, value }: { key: string; value: any }) => {
    logger.debug(`Setting ${key} to:`, value);
    // Validate that key is a valid setting name
    if (isValidSettingKey(key)) {
      settingsService.setSetting(key, value);
      return true;
    }
    throw new Error(`Invalid setting key: ${key}`);
  });

  // Reset settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    logger.debug('Resetting all settings to defaults');
    settingsService.resetSettings();
    return true;
  });
};

// Helper function to validate setting keys
function isValidSettingKey(key: string): key is keyof SettingsSchema {
  return key in settingsService.getSettings();
} 
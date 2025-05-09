import { ipcMain } from 'electron';
import {
    getSetting,
    setSetting,
    getAllSettings,
    resetSettings
} from '../services/settingsService';
import { UserSettings } from '../../shared/types/settings';

export function registerSettingsHandlers(): void {
    ipcMain.handle('settings:get', (event, key: keyof UserSettings, defaultValue?: any) => {
        return getSetting(key, defaultValue);
    });

    ipcMain.handle('settings:set', (event, key: keyof UserSettings, value: any) => {
        setSetting(key, value);
    });

    ipcMain.handle('settings:getAll', () => {
        return getAllSettings();
    });

    ipcMain.handle('settings:resetAll', () => {
        resetSettings();
    });

    console.log('IPC settings handlers registered.');
} 
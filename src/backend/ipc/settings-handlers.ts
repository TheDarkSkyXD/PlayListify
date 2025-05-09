import { ipcMain } from 'electron';
import {
    getSetting,
    setSetting,
    getAllSettings,
    resetSettings
} from '../services/settingsService'; // Assuming settingsService.ts exists and is correct
import { UserSettings } from '../../shared/types/settings'; // Assuming this type path is correct
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

export function registerSettingsHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.GET_SETTING, (event, key: keyof UserSettings, defaultValue?: any) => {
        return getSetting(key, defaultValue);
    });

    ipcMain.handle(IPC_CHANNELS.SET_SETTING, (event, key: keyof UserSettings, value: any) => {
        setSetting(key, value);
    });

    ipcMain.handle(IPC_CHANNELS.GET_ALL_SETTINGS, () => {
        return getAllSettings();
    });

    ipcMain.handle(IPC_CHANNELS.RESET_ALL_SETTINGS, () => {
        resetSettings();
    });

    console.log('IPC settings handlers registered. ⚙️'); // Updated log message slightly for consistency
} 
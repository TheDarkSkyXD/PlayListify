import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';

// Define the settings schema
interface SettingsSchema {
  downloadPath: string;
  maxConcurrentDownloads: number;
  autoUpdateCheck: boolean;
  ffmpegPath?: string;
  ytdlpPath?: string;
  theme: 'light' | 'dark' | 'system';
}

// Default settings
const defaultSettings: SettingsSchema = {
  downloadPath: path.join(app.getPath('videos'), 'PlayListify'),
  maxConcurrentDownloads: 2,
  autoUpdateCheck: true,
  theme: 'system',
};

// Create settings store instance with proper type
// Using type assertion as the electron-store types are incomplete
interface ElectronStoreExtended<T extends Record<string, any>> extends Store<T> {
  store: T;
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  set(object: Partial<T>): void;
  clear(): void;
}

// Create settings store instance
const settingsStore = new Store<SettingsSchema>({
  name: 'settings',
  defaults: defaultSettings,
}) as ElectronStoreExtended<SettingsSchema>;

// Export settings functions
export const getSettings = (): SettingsSchema => settingsStore.store;

export const getSetting = <K extends keyof SettingsSchema>(key: K): SettingsSchema[K] => {
  return settingsStore.get(key);
};

export const setSetting = <K extends keyof SettingsSchema>(
  key: K,
  value: SettingsSchema[K]
): void => {
  settingsStore.set(key, value);
};

export const resetSettings = (): void => {
  settingsStore.clear();
  // Use object overload
  settingsStore.set(defaultSettings);
};

export default { getSettings, getSetting, setSetting, resetSettings }; 
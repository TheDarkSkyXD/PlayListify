import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';

// Define the settings schema type
interface SettingsSchema {
  // General settings
  theme: 'light' | 'dark' | 'system';
  checkForUpdates: boolean;
  startAtLogin: boolean;
  minimizeToTray: boolean;
  
  // Download settings
  downloadLocation: string;
  concurrentDownloads: number;
  downloadFormat: 'mp4' | 'webm' | 'mp3' | 'best';
  maxQuality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
  autoConvertToMp3: boolean;
  
  // Playback settings
  defaultVolume: number;
  autoPlay: boolean;
  
  // Playlist settings
  playlistLocation: string;
  autoRefreshPlaylists: boolean;
  refreshInterval: number; // in milliseconds
  
  // YouTube API settings
  youtubeApiKey?: string;
  
  // Saved accounts/tokens
  accounts?: { [email: string]: { refreshToken: string } };
  
  // Advanced settings
  ytDlpPath?: string;
  ffmpegPath?: string;
  debug: boolean;
}

// Create default settings
const defaultSettings: SettingsSchema = {
  // General settings
  theme: 'system',
  checkForUpdates: true,
  startAtLogin: false,
  minimizeToTray: true,
  
  // Download settings
  downloadLocation: path.join(app.getPath('videos'), 'Playlistify'),
  concurrentDownloads: 3,
  downloadFormat: 'mp4',
  maxQuality: '1080p',
  autoConvertToMp3: false,
  
  // Playback settings
  defaultVolume: 0.7,
  autoPlay: false,
  
  // Playlist settings
  playlistLocation: path.join(app.getPath('userData'), 'playlists'),
  autoRefreshPlaylists: true,
  refreshInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  // Advanced settings
  debug: false
};

// Initialize store with schema
const store = new Store<SettingsSchema>({
  defaults: defaultSettings,
  name: 'settings',
  // Optional: enable encryption for sensitive data
  // encryptionKey: 'your-encryption-key'
});

// Ensure directories exist
export function initializeDirectories(): void {
  const downloadLocation = store.get('downloadLocation');
  const playlistLocation = store.get('playlistLocation');
  
  fs.ensureDirSync(downloadLocation);
  fs.ensureDirSync(playlistLocation);
}

// Standard getter function
export function getSetting<K extends keyof SettingsSchema>(
  key: K,
  defaultValue?: SettingsSchema[K]
): SettingsSchema[K] {
  if (defaultValue !== undefined) {
    return store.get(key as any, defaultValue);
  }
  return store.get(key as any, defaultSettings[key]);
}

// Standard setter function
export function setSetting<K extends keyof SettingsSchema>(
  key: K,
  value: SettingsSchema[K]
): void {
  // If we're setting a path, ensure the directory exists
  if ((key === 'downloadLocation' || key === 'playlistLocation') && typeof value === 'string') {
    fs.ensureDirSync(value);
  }
  
  store.set(key, value);
}

// Reset a setting to default
export function resetSetting<K extends keyof SettingsSchema>(key: K): void {
  store.set(key, defaultSettings[key]);
}

// Reset all settings to default
export function resetAllSettings(): void {
  store.clear();
  store.set(defaultSettings);
  
  // Re-create necessary directories
  initializeDirectories();
}

// Delete a setting
export function clearSetting(key: keyof SettingsSchema): void {
  store.delete(key);
}

// Check if a setting exists
export function hasSetting(key: keyof SettingsSchema): boolean {
  return store.has(key);
}

// Get all settings
export function getAllSettings(): SettingsSchema {
  return store.store;
}

// Add account
export function addAccount(email: string, refreshToken: string): void {
  const accounts = store.get('accounts') || {};
  accounts[email] = { refreshToken };
  store.set('accounts', accounts);
}

// Remove account
export function removeAccount(email: string): void {
  const accounts = store.get('accounts');
  if (accounts && accounts[email]) {
    delete accounts[email];
    store.set('accounts', accounts);
  }
}

// Initialize settings
export function initializeSettings(): void {
  initializeDirectories();
} 
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

  // Migration settings
  migrationCompleted?: boolean;

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
  downloadLocation: path.join(app.getPath('videos'), 'playlistify'),
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

  // Migration settings
  migrationCompleted: false,

  // Advanced settings
  debug: false
};

// Initialize store with schema
const store = new Store({
  defaults: defaultSettings,
  name: 'settings',
  // Optional: enable encryption for sensitive data
  // encryptionKey: 'your-encryption-key'
});

// Ensure directories exist
export function initializeDirectories(): void {
  const settings = (store as any).store as SettingsSchema;
  let downloadLocation = settings.downloadLocation;
  const playlistLocation = settings.playlistLocation;

  // Ensure the download location exists
  try {
    // Make sure the download location ends with 'playlistify'
    if (!downloadLocation.endsWith('playlistify') && !downloadLocation.endsWith('Playlistify')) {
      downloadLocation = path.join(downloadLocation, 'playlistify');
      // Update the setting to include the playlistify folder
      setSetting('downloadLocation', downloadLocation);
    }

    fs.ensureDirSync(downloadLocation);
    console.log(`Ensured download directory exists: ${downloadLocation}`);
  } catch (error) {
    console.error(`Failed to create download directory: ${downloadLocation}`, error);
    // If we can't create the specified directory, fall back to the default
    const fallbackLocation = path.join(app.getPath('videos'), 'playlistify');
    fs.ensureDirSync(fallbackLocation);
    console.log(`Created fallback download directory: ${fallbackLocation}`);
    // Update the setting to the fallback location
    setSetting('downloadLocation', fallbackLocation);
  }

  // Ensure the playlist location exists
  try {
    fs.ensureDirSync(playlistLocation);
    console.log(`Ensured playlist directory exists: ${playlistLocation}`);
  } catch (error) {
    console.error(`Failed to create playlist directory: ${playlistLocation}`, error);
  }
}

// Standard getter function
export function getSetting<K extends keyof SettingsSchema>(
  key: K,
  defaultValue?: SettingsSchema[K]
): SettingsSchema[K] {
  const settings = (store as any).store as SettingsSchema;
  if (defaultValue !== undefined) {
    return settings[key] ?? defaultValue;
  }
  return settings[key] ?? defaultSettings[key];
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

  const settings = (store as any).store as SettingsSchema;
  settings[key] = value;
  (store as any).store = settings;
}

// Reset a setting to default
export function resetSetting<K extends keyof SettingsSchema>(key: K): void {
  const settings = (store as any).store as SettingsSchema;
  settings[key] = defaultSettings[key];
  (store as any).store = settings;
}

// Reset all settings to default
export function resetAllSettings(): void {
  (store as any).store = defaultSettings;

  // Re-create necessary directories
  initializeDirectories();
}

// Delete a setting
export function clearSetting(key: keyof SettingsSchema): void {
  const settings = (store as any).store as SettingsSchema;
  delete settings[key];
  (store as any).store = settings;
}

// Check if a setting exists
export function hasSetting(key: keyof SettingsSchema): boolean {
  const settings = (store as any).store as SettingsSchema;
  return key in settings;
}

// Get all settings
export function getAllSettings(): SettingsSchema {
  return (store as any).store as SettingsSchema;
}

// Add account
export function addAccount(email: string, refreshToken: string): void {
  const settings = (store as any).store as SettingsSchema;
  const accounts = settings.accounts || {};
  accounts[email] = { refreshToken };
  settings.accounts = accounts;
  (store as any).store = settings;
}

// Remove account
export function removeAccount(email: string): void {
  const settings = (store as any).store as SettingsSchema;
  const accounts = settings.accounts;
  if (accounts && accounts[email]) {
    delete accounts[email];
    settings.accounts = accounts;
    (store as any).store = settings;
  }
}

// Initialize settings
export function initializeSettings(): void {
  initializeDirectories();
}
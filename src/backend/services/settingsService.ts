// src/backend/services/settingsService.ts
import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import { Settings, UserAccount } from '../../shared/types'; // Assuming UserAccount might be stored in settings

// Define the schema for electron-store based on the Settings interface
// This provides type safety and default values if a key is missing.
const schema: import('electron-store').Schema<Settings> = {
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  downloadLocation: {
    type: 'string',
    default: app.getPath('downloads'), // Default to OS's downloads folder
  },
  concurrentDownloads: {
    type: 'number',
    default: 3,
    minimum: 1,
    maximum: 10,
  },
  maxQuality: {
    type: 'string',
    enum: ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', '4320p', 'best'],
    default: '1080p',
  },
  downloadFormat: {
    type: 'string',
    enum: ['mp4', 'webm', 'mp3', 'm4a', 'opus'],
    default: 'mp4',
  },
  autoUpdatePlaylists: {
    type: 'boolean',
    default: true,
  },
  refreshIntervalHours: {
    type: 'number',
    default: 24,
    minimum: 1,
  },
  enableNotifications: {
    type: 'boolean',
    default: true,
  },
  // Placeholder for potential account-related settings within the main settings store
  // For more complex account management, a separate store or service might be better.
  currentUserAccount: {
    type: ['object', 'null'], // Allow null if no user is logged in
    properties: { // Define structure if an object, mirroring parts of UserAccount
        id: { type: 'string' },
        displayName: { type: 'string' },
        // Add other relevant UserAccount fields that need to be persisted simply
    },
    default: null,
  }
};

// Initialize electron-store with the schema
// The 'settings' name will create a settings.json file in the app's user data directory.
const store = new Store<Settings>({ schema, name: 'settings' });

// --- Default Settings Management ---
// electron-store handles default values directly through the schema.
// If a setting is not found, the default from the schema is returned.
// This function ensures all defaults are applied if the store was somehow initialized without them
// or if new default settings are added later.
// electron-store handles default values directly through the schema.
// If a setting is not found when store.get() is called, the default from the schema is returned.
// Thus, an explicit ensureDefaultSettings() function iterating through schema defaults
// is largely redundant for basic operation. It might be useful for specific complex initialization
// scenarios, but for now, we rely on electron-store's built-in behavior.

// --- Settings Service API ---

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return store.get(key);
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  store.set(key, value);
}

export function getAllSettings(): Settings {
  return store.store;
}

export function resetToDefaults(): void {
  store.clear(); // Clears all settings, subsequent gets will return schema defaults
  // Re-apply any necessary post-clear initializations if any.
  // ensureDefaultSettings(); // If explicit write of defaults is desired after clear
}

// --- Directory Initialization Logic (Placeholder) ---
// This might be called from main.ts after settings are loaded,
// or if a setting change requires directory structures to be checked/created.
export function initializeStoragePaths(): void {
  const downloadPath = getSetting('downloadLocation');
  // import fs from 'fs-extra'; // Would need fs-extra
  // fs.ensureDirSync(downloadPath);
  // console.log(`Ensured download directory exists: ${downloadPath}`);
  // Add other path initializations as needed
}

// --- Account Management Functions (Basic Placeholder) ---
// These interact with the `currentUserAccount` part of the settings.

export function getCurrentUserAccount(): Partial<UserAccount> | null | undefined {
  return store.get('currentUserAccount');
}

export function setCurrentUserAccount(account: Partial<UserAccount> | null): void {
  store.set('currentUserAccount', account);
}

export function clearCurrentUserAccount(): void {
  store.set('currentUserAccount', null);
}

// Example of how to watch for changes to a specific setting
// store.onDidChange('theme', (newValue, oldValue) => {
//   console.log(`Theme changed from ${oldValue} to ${newValue}`);
// });

// Log initial settings load (optional)
// console.log('Settings loaded:', getAllSettings());
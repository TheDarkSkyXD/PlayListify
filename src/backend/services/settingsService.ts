import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import type { UserSettings, Theme, VideoQuality } from '../../shared/types/settings';

// Type placeholder for the dynamically imported class and schema type
let ElectronStoreClass: any; // Will hold the dynamically imported class
type ElectronStoreSchemaType<T extends Record<string, any>> = import('electron-store').Schema<T>;

// Simpler schema property type (as before)
interface MySchemaProperty<T> {
    type: string;
    default: T;
    enum?: readonly T[];
    minimum?: number;
    maximum?: number;
}

// Define the schema structure (remains synchronous)
const schemaDefinition: ElectronStoreSchemaType<UserSettings> = {
    downloadLocation: {
        type: 'string',
        default: path.join(app.getPath('videos'), 'Playlistify'),
    } as MySchemaProperty<string>,
    maxConcurrentDownloads: {
        type: 'number',
        default: 3,
        minimum: 1,
        maximum: 10,
    } as MySchemaProperty<number>,
    defaultQuality: {
        type: 'string',
        enum: [
            'best', '4320p', '2160p', '1440p', '1080p',
            '720p', '480p', '360p', '240p', '144p'
        ] as const,
        default: '1080p',
    } as MySchemaProperty<VideoQuality>,
    theme: {
        type: 'string',
        enum: ['light', 'dark'] as const,
        default: 'dark',
    } as MySchemaProperty<Theme>,
    notifyOnDownloadComplete: {
        type: 'boolean',
        default: true,
    } as MySchemaProperty<boolean>,
    autoStartDownloads: {
        type: 'boolean',
        default: false,
    } as MySchemaProperty<boolean>,
    minimizeToTray: {
        type: 'boolean',
        default: false,
    } as MySchemaProperty<boolean>,
    developerMode: {
        type: 'boolean',
        default: false,
    } as MySchemaProperty<boolean>,
};

// Store instance - initialized asynchronously
let store: any | null = null;
let storeInitializationPromise: Promise<void> | null = null;

/**
 * Initializes the electron-store instance using dynamic import.
 */
async function initializeStore(): Promise<void> {
    if (store) return;
    if (storeInitializationPromise) return storeInitializationPromise;

    storeInitializationPromise = (async () => {
        try {
            const ImportedElectronStore = (await import('electron-store')).default;
            ElectronStoreClass = ImportedElectronStore;
            store = new ImportedElectronStore<UserSettings>({
                schema: schemaDefinition,
                name: 'playlistify-settings',
                cwd: app.getPath('userData'),
                fileExtension: 'json',
                clearInvalidConfig: true,
            });
            console.log('Electron-store initialized dynamically.');
            setupListeners();
            await ensureDownloadLocationExists();
        } catch (error) {
            console.error('Failed to dynamically import or initialize electron-store:', error);
            storeInitializationPromise = Promise.reject(error); 
            throw error;
        }
    })();
    return storeInitializationPromise;
}

/**
 * Helper function to ensure the store is initialized before use.
 */
async function ensureStoreInitialized(): Promise<any> {
    if (!store) {
        await initializeStore();
    }
    if (!store) {
        throw new Error("Store could not be initialized.");
    }
    return store;
}

/**
 * Ensures the configured download location exists.
 */
export async function ensureDownloadLocationExists(): Promise<void> {
    if (!store) {
        const defaultLoc = (schemaDefinition.downloadLocation as MySchemaProperty<string>)?.default;
        if (defaultLoc) {
             try {
                await fs.ensureDir(defaultLoc);
                console.log(`Ensured default download directory exists: ${defaultLoc}`);
             } catch (error) {
                 console.error(`Failed to ensure default download directory ${defaultLoc}:`, error);
             }
        }
        return; 
    }
    const currentStore = await ensureStoreInitialized();
    const downloadLocation = (currentStore as any).get('downloadLocation');
    try {
        await fs.ensureDir(downloadLocation as string); 
        console.log(`Ensured download directory exists: ${downloadLocation}`);
    } catch (error) {
        console.error(`Failed to ensure download directory ${downloadLocation}:`, error);
    }
}

/**
 * Gets a setting value.
 */
export async function getSetting<K extends keyof UserSettings>(
    key: K,
    defaultValue?: UserSettings[K]
): Promise<UserSettings[K] | undefined> {
    const currentStore = await ensureStoreInitialized();
    if (defaultValue !== undefined) {
        return (currentStore as any).get(key, defaultValue);
    } else {
        return (currentStore as any).get(key);
    }
}

/**
 * Sets a setting value.
 */
export async function setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    const currentStore = await ensureStoreInitialized();
    (currentStore as any).set(key, value);
    console.log(`Setting updated: ${key} =`, value);
}

/**
 * Resets all settings to their default values defined in the schema.
 */
export async function resetSettings(): Promise<void> {
    const currentStore = await ensureStoreInitialized();
    for (const key in schemaDefinition) {
        if (Object.prototype.hasOwnProperty.call(schemaDefinition, key)) {
            const typedKey = key as keyof UserSettings;
            const property = schemaDefinition[typedKey] as MySchemaProperty<UserSettings[typeof typedKey]>;
            if (property && property.default !== undefined) {
                (currentStore as any).set(typedKey, property.default);
            } else {
                 (currentStore as any).delete(typedKey);
            }
        }
    }
    console.log('All settings reset to defaults.');
    await ensureDownloadLocationExists();
}

/**
 * Gets all current settings.
 */
export async function getAllSettings(): Promise<UserSettings> {
    const currentStore = await ensureStoreInitialized();
    return (currentStore as any).store;
}

/**
 * Sets up listeners for setting changes (e.g., theme changes).
 */
function setupListeners(): void {
     if (!store) return;
    (store as any).onDidChange('theme', (newValue?: Theme, oldValue?: Theme) => {
        console.log(`Theme changed from ${oldValue ?? 'undefined'} to ${newValue ?? 'undefined'}`);
    });
}

/**
 * Gets the file path where settings are stored.
 */
export async function getSettingsPath(): Promise<string> {
     const currentStore = await ensureStoreInitialized();
    return (currentStore as any).path;
}

// This service seems more focused on application preferences. 
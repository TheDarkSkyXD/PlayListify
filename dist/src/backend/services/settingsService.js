"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const tslib_1 = require("tslib");
const electron_store_1 = tslib_1.__importDefault(require("electron-store"));
const defaultSettings = {
    theme: 'light',
    downloadLocation: '',
    videoQuality: 'best',
    maxConcurrentDownloads: 3,
    autoUpdatePlaylist: true,
    notificationsEnabled: true,
    windowSize: {
        width: 1200,
        height: 800,
    },
    windowPosition: {
        x: 100,
        y: 100,
    },
};
class SettingsService {
    constructor() {
        this.store = new electron_store_1.default({
            defaults: defaultSettings,
            schema: {
                theme: {
                    type: 'string',
                    enum: ['light', 'dark'],
                    default: 'light',
                },
                downloadLocation: {
                    type: 'string',
                    default: '',
                },
                videoQuality: {
                    type: 'string',
                    enum: ['best', 'worst', '720p', '1080p'],
                    default: 'best',
                },
                maxConcurrentDownloads: {
                    type: 'number',
                    minimum: 1,
                    maximum: 10,
                    default: 3,
                },
                autoUpdatePlaylist: {
                    type: 'boolean',
                    default: true,
                },
                notificationsEnabled: {
                    type: 'boolean',
                    default: true,
                },
                windowSize: {
                    type: 'object',
                    properties: {
                        width: { type: 'number', minimum: 800, default: 1200 },
                        height: { type: 'number', minimum: 600, default: 800 },
                    },
                    default: { width: 1200, height: 800 },
                },
                windowPosition: {
                    type: 'object',
                    properties: {
                        x: { type: 'number', default: 100 },
                        y: { type: 'number', default: 100 },
                    },
                    default: { x: 100, y: 100 },
                },
            },
        });
    }
    /**
     * Get a setting value by key
     */
    get(key) {
        return this.store.get(key);
    }
    /**
     * Set a setting value by key
     */
    set(key, value) {
        this.store.set(key, value);
    }
    /**
     * Get all settings
     */
    getAll() {
        return this.store.store;
    }
    /**
     * Reset all settings to defaults
     */
    reset() {
        this.store.clear();
    }
    /**
     * Check if a setting has been customized (not default)
     */
    hasCustomValue(key) {
        return this.store.has(key);
    }
    /**
     * Get the file path where settings are stored
     */
    getStorePath() {
        return this.store.path;
    }
    /**
     * Initialize default download location if not set
     */
    async initializeDownloadLocation() {
        if (!this.get('downloadLocation')) {
            const { app } = require('electron');
            const path = require('path');
            const defaultPath = path.join(app.getPath('downloads'), 'PlayListify');
            this.set('downloadLocation', defaultPath);
        }
    }
    /**
     * Validate and sanitize settings
     */
    validateSettings() {
        try {
            const settings = this.getAll();
            // Validate theme
            if (!['light', 'dark'].includes(settings.theme)) {
                this.set('theme', 'light');
            }
            // Validate video quality
            if (!['best', 'worst', '720p', '1080p'].includes(settings.videoQuality)) {
                this.set('videoQuality', 'best');
            }
            // Validate concurrent downloads
            if (settings.maxConcurrentDownloads < 1 || settings.maxConcurrentDownloads > 10) {
                this.set('maxConcurrentDownloads', 3);
            }
            // Validate window size
            if (settings.windowSize.width < 800 || settings.windowSize.height < 600) {
                this.set('windowSize', { width: 1200, height: 800 });
            }
            return true;
        }
        catch (error) {
            console.error('Settings validation failed:', error);
            return false;
        }
    }
    /**
     * Export settings to JSON
     */
    exportSettings() {
        return JSON.stringify(this.getAll(), null, 2);
    }
    /**
     * Import settings from JSON
     */
    importSettings(jsonString) {
        try {
            const settings = JSON.parse(jsonString);
            // Validate each setting before importing
            Object.keys(settings).forEach(key => {
                if (key in defaultSettings) {
                    this.set(key, settings[key]);
                }
            });
            return this.validateSettings();
        }
        catch (error) {
            console.error('Settings import failed:', error);
            return false;
        }
    }
}
exports.SettingsService = SettingsService;
// Export a singleton instance
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map
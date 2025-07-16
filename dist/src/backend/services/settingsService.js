"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const tslib_1 = require("tslib");
const electron_store_1 = tslib_1.__importDefault(require("electron-store"));
const electron_1 = require("electron");
const path = tslib_1.__importStar(require("path"));
const settings_types_1 = require("../../shared/types/settings-types");
// Simple console logger fallback
const consoleLogger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
};
class SettingsService {
    constructor(logger) {
        this.logger = logger || consoleLogger;
        try {
            this.store = new electron_store_1.default({
                defaults: settings_types_1.DEFAULT_USER_SETTINGS,
                schema: settings_types_1.SETTINGS_SCHEMA,
                name: 'user-settings',
                cwd: path.join(electron_1.app.getPath('userData'), 'config'),
                fileExtension: 'json',
                serialize: (value) => JSON.stringify(value, null, 2),
                deserialize: JSON.parse,
                clearInvalidConfig: true,
            });
            this.logger.info('SettingsService initialized successfully', {
                storePath: this.store.path,
                storeSize: this.store.size,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize SettingsService', { error });
            throw new settings_types_1.SettingsError('Failed to initialize settings store', 'INIT_ERROR', error);
        }
    }
    /**
     * Get a setting value by key with type safety
     */
    get(key) {
        try {
            const value = this.store.get(key);
            this.logger.debug(`Retrieved setting: ${String(key)}`, { value });
            return value;
        }
        catch (error) {
            this.logger.error(`Failed to get setting: ${String(key)}`, { error });
            throw new settings_types_1.SettingsError(`Failed to get setting: ${String(key)}`, 'GET_ERROR', error);
        }
    }
    /**
     * Set a setting value by key with validation
     */
    set(key, value) {
        try {
            // Validate the value before setting
            const validationResult = this.validateSingleSetting(key, value);
            if (!validationResult.isValid) {
                throw new settings_types_1.SettingsError(`Invalid value for setting ${String(key)}: ${validationResult.errors.join(', ')}`, 'VALIDATION_ERROR', { key, value, errors: validationResult.errors });
            }
            this.store.set(key, value);
            this.logger.info(`Updated setting: ${String(key)}`, { value });
        }
        catch (error) {
            this.logger.error(`Failed to set setting: ${String(key)}`, { error, value });
            if (error instanceof settings_types_1.SettingsError) {
                throw error;
            }
            throw new settings_types_1.SettingsError(`Failed to set setting: ${String(key)}`, 'SET_ERROR', error);
        }
    }
    /**
     * Get all settings
     */
    getAll() {
        try {
            const settings = this.store.store;
            this.logger.debug('Retrieved all settings');
            return settings;
        }
        catch (error) {
            this.logger.error('Failed to get all settings', { error });
            throw new settings_types_1.SettingsError('Failed to get all settings', 'GET_ALL_ERROR', error);
        }
    }
    /**
     * Reset all settings to defaults
     */
    reset() {
        try {
            this.store.clear();
            this.logger.info('Reset all settings to defaults');
        }
        catch (error) {
            this.logger.error('Failed to reset settings', { error });
            throw new settings_types_1.SettingsError('Failed to reset settings', 'RESET_ERROR', error);
        }
    }
    /**
     * Check if a setting exists (has been set)
     */
    has(key) {
        try {
            return this.store.has(key);
        }
        catch (error) {
            this.logger.error(`Failed to check setting existence: ${String(key)}`, { error });
            return false;
        }
    }
    /**
     * Delete a specific setting (revert to default)
     */
    delete(key) {
        try {
            this.store.delete(key);
            this.logger.info(`Deleted setting: ${String(key)}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete setting: ${String(key)}`, { error });
            throw new settings_types_1.SettingsError(`Failed to delete setting: ${String(key)}`, 'DELETE_ERROR', error);
        }
    }
    /**
     * Validate all settings and return detailed results
     */
    validate() {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
        };
        try {
            const settings = this.getAll();
            // Validate each setting
            Object.entries(settings).forEach(([key, value]) => {
                const settingKey = key;
                const validation = this.validateSingleSetting(settingKey, value);
                if (!validation.isValid) {
                    result.isValid = false;
                    result.errors.push(...validation.errors.map(err => `${key}: ${err}`));
                }
                if (validation.warnings) {
                    result.warnings.push(...validation.warnings.map(warn => `${key}: ${warn}`));
                }
            });
            this.logger.debug('Settings validation completed', result);
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.logger.error('Settings validation failed', { error });
        }
        return result;
    }
    /**
     * Sanitize settings by fixing invalid values
     */
    sanitize() {
        try {
            const settings = this.getAll();
            let changesMade = false;
            // Sanitize theme
            if (!['light', 'dark', 'system'].includes(settings.theme)) {
                this.store.set('theme', 'light');
                changesMade = true;
            }
            // Sanitize video quality
            if (!['best', 'worst', '720p', '1080p'].includes(settings.videoQuality)) {
                this.store.set('videoQuality', 'best');
                changesMade = true;
            }
            // Sanitize concurrent downloads
            if (settings.maxConcurrentDownloads < 1 || settings.maxConcurrentDownloads > 10) {
                this.store.set('maxConcurrentDownloads', 3);
                changesMade = true;
            }
            // Sanitize window size
            if (settings.windowSize.width < 800 || settings.windowSize.height < 600) {
                this.store.set('windowSize', { width: 1200, height: 800 });
                changesMade = true;
            }
            // Sanitize paths
            if (settings.downloadLocation && !path.isAbsolute(settings.downloadLocation)) {
                this.store.set('downloadLocation', path.join(electron_1.app.getPath('downloads'), 'Playlistify'));
                changesMade = true;
            }
            if (changesMade) {
                this.logger.info('Settings sanitized - invalid values corrected');
            }
        }
        catch (error) {
            this.logger.error('Failed to sanitize settings', { error });
            throw new settings_types_1.SettingsError('Failed to sanitize settings', 'SANITIZE_ERROR', error);
        }
    }
    /**
     * Export settings with metadata
     */
    export() {
        try {
            const exportData = {
                version: '1.0.0',
                exportDate: new Date(),
                settings: this.getAll(),
            };
            this.logger.info('Settings exported');
            return exportData;
        }
        catch (error) {
            this.logger.error('Failed to export settings', { error });
            throw new settings_types_1.SettingsError('Failed to export settings', 'EXPORT_ERROR', error);
        }
    }
    /**
     * Import settings with validation
     */
    import(data) {
        try {
            // Validate import data structure
            if (!data.settings || typeof data.settings !== 'object') {
                throw new settings_types_1.SettingsError('Invalid import data structure', 'IMPORT_VALIDATION_ERROR');
            }
            // Import each valid setting
            let importedCount = 0;
            Object.entries(data.settings).forEach(([key, value]) => {
                if (key in settings_types_1.DEFAULT_USER_SETTINGS) {
                    try {
                        this.set(key, value);
                        importedCount++;
                    }
                    catch (error) {
                        this.logger.warn(`Failed to import setting: ${key}`, { error, value });
                    }
                }
            });
            // Validate and sanitize after import
            this.sanitize();
            const validation = this.validate();
            if (!validation.isValid) {
                this.logger.warn('Settings import completed with validation errors', {
                    importedCount,
                    errors: validation.errors,
                });
            }
            else {
                this.logger.info('Settings imported successfully', { importedCount });
            }
            return validation.isValid;
        }
        catch (error) {
            this.logger.error('Failed to import settings', { error });
            throw new settings_types_1.SettingsError('Failed to import settings', 'IMPORT_ERROR', error);
        }
    }
    /**
     * Get the file path where settings are stored
     */
    getStorePath() {
        return this.store.path;
    }
    /**
     * Initialize default settings and directories
     */
    async initializeDefaults() {
        try {
            // Initialize download location if not set
            if (!this.get('downloadLocation')) {
                const defaultPath = path.join(electron_1.app.getPath('downloads'), 'Playlistify');
                this.set('downloadLocation', defaultPath);
            }
            // Initialize temp directory if not set
            if (!this.get('tempDirectory')) {
                const tempPath = path.join(electron_1.app.getPath('userData'), 'temp');
                this.set('tempDirectory', tempPath);
            }
            // Validate and sanitize all settings
            this.sanitize();
            this.logger.info('Default settings initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize default settings', { error });
            throw new settings_types_1.SettingsError('Failed to initialize default settings', 'INIT_DEFAULTS_ERROR', error);
        }
    }
    /**
     * Validate a single setting value
     */
    validateSingleSetting(key, value) {
        const result = { isValid: true, errors: [], warnings: [] };
        try {
            switch (key) {
                case 'theme':
                    if (!['light', 'dark', 'system'].includes(value)) {
                        result.isValid = false;
                        result.errors.push('Theme must be "light", "dark", or "system"');
                    }
                    break;
                case 'language':
                    if (typeof value !== 'string' || value.length === 0) {
                        result.isValid = false;
                        result.errors.push('Language must be a non-empty string');
                    }
                    break;
                case 'videoQuality':
                    if (!['best', 'worst', '720p', '1080p'].includes(value)) {
                        result.isValid = false;
                        result.errors.push('Video quality must be "best", "worst", "720p", or "1080p"');
                    }
                    break;
                case 'maxConcurrentDownloads':
                    if (typeof value !== 'number' || value < 1 || value > 10) {
                        result.isValid = false;
                        result.errors.push('Max concurrent downloads must be a number between 1 and 10');
                    }
                    break;
                case 'windowSize':
                    if (!value || typeof value !== 'object' ||
                        typeof value.width !== 'number' || typeof value.height !== 'number' ||
                        value.width < 800 || value.height < 600) {
                        result.isValid = false;
                        result.errors.push('Window size must have width >= 800 and height >= 600');
                    }
                    break;
                case 'windowPosition':
                    if (!value || typeof value !== 'object' ||
                        typeof value.x !== 'number' || typeof value.y !== 'number') {
                        result.isValid = false;
                        result.errors.push('Window position must have numeric x and y coordinates');
                    }
                    break;
                case 'downloadLocation':
                case 'tempDirectory':
                    if (value && typeof value === 'string' && !path.isAbsolute(value)) {
                        result.warnings?.push('Path should be absolute');
                    }
                    break;
            }
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
}
exports.SettingsService = SettingsService;
// Export a singleton instance
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map
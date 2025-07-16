import { app } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import {
  DEFAULT_USER_SETTINGS,
  ISettingsService,
  SETTINGS_SCHEMA,
  SettingsError,
  SettingsExportData,
  SettingsValidationResult,
  UserSettings,
} from '../../shared/types/settings-types';

// Logger interface (will be implemented in task 10)
interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Simple console logger fallback
const consoleLogger: Logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
  debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export class SettingsService implements ISettingsService {
  private store: Store<UserSettings>;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || consoleLogger;

    try {
      this.store = new Store<UserSettings>({
        defaults: DEFAULT_USER_SETTINGS,
        schema: SETTINGS_SCHEMA,
        name: 'user-settings',
        cwd: path.join(app.getPath('userData'), 'config'),
        fileExtension: 'json',
        serialize: (value: any) => JSON.stringify(value, null, 2),
        deserialize: JSON.parse,
        clearInvalidConfig: true,
      });

      this.logger.info('SettingsService initialized successfully', {
        storePath: (this.store as any).path,
        storeSize: (this.store as any).size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize SettingsService', { error });
      throw new SettingsError(
        'Failed to initialize settings store',
        'INIT_ERROR',
        error,
      );
    }
  }

  /**
   * Get a setting value by key with type safety
   */
  get<K extends keyof UserSettings>(key: K): UserSettings[K] {
    try {
      const value = (this.store as any).get(key);
      this.logger.debug(`Retrieved setting: ${String(key)}`, { value });
      return value;
    } catch (error) {
      this.logger.error(`Failed to get setting: ${String(key)}`, { error });
      throw new SettingsError(
        `Failed to get setting: ${String(key)}`,
        'GET_ERROR',
        error,
      );
    }
  }

  /**
   * Set a setting value by key with validation
   */
  set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    try {
      // Validate the value before setting
      const validationResult = this.validateSingleSetting(key, value);
      if (!validationResult.isValid) {
        throw new SettingsError(
          `Invalid value for setting ${String(key)}: ${validationResult.errors.join(', ')}`,
          'VALIDATION_ERROR',
          { key, value, errors: validationResult.errors },
        );
      }

      (this.store as any).set(key, value);
      this.logger.info(`Updated setting: ${String(key)}`, { value });
    } catch (error) {
      this.logger.error(`Failed to set setting: ${String(key)}`, {
        error,
        value,
      });
      if (error instanceof SettingsError) {
        throw error;
      }
      throw new SettingsError(
        `Failed to set setting: ${String(key)}`,
        'SET_ERROR',
        error,
      );
    }
  }

  /**
   * Get all settings
   */
  getAll(): UserSettings {
    try {
      const settings = (this.store as any).store;
      this.logger.debug('Retrieved all settings');
      return settings;
    } catch (error) {
      this.logger.error('Failed to get all settings', { error });
      throw new SettingsError(
        'Failed to get all settings',
        'GET_ALL_ERROR',
        error,
      );
    }
  }

  /**
   * Reset all settings to defaults
   */
  reset(): void {
    try {
      (this.store as any).clear();
      this.logger.info('Reset all settings to defaults');
    } catch (error) {
      this.logger.error('Failed to reset settings', { error });
      throw new SettingsError('Failed to reset settings', 'RESET_ERROR', error);
    }
  }

  /**
   * Check if a setting exists (has been set)
   */
  has(key: keyof UserSettings): boolean {
    try {
      return (this.store as any).has(key);
    } catch (error) {
      this.logger.error(`Failed to check setting existence: ${String(key)}`, {
        error,
      });
      return false;
    }
  }

  /**
   * Delete a specific setting (revert to default)
   */
  delete(key: keyof UserSettings): void {
    try {
      (this.store as any).delete(key);
      this.logger.info(`Deleted setting: ${String(key)}`);
    } catch (error) {
      this.logger.error(`Failed to delete setting: ${String(key)}`, { error });
      throw new SettingsError(
        `Failed to delete setting: ${String(key)}`,
        'DELETE_ERROR',
        error,
      );
    }
  }

  /**
   * Validate all settings and return detailed results
   */
  validate(): SettingsValidationResult {
    const result: SettingsValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const settings = this.getAll();

      // Validate each setting
      Object.entries(settings).forEach(([key, value]) => {
        const settingKey = key as keyof UserSettings;
        const validation = this.validateSingleSetting(settingKey, value);

        if (!validation.isValid) {
          result.isValid = false;
          result.errors.push(...validation.errors.map(err => `${key}: ${err}`));
        }

        if (validation.warnings) {
          result.warnings.push(
            ...validation.warnings.map(warn => `${key}: ${warn}`),
          );
        }
      });

      this.logger.debug('Settings validation completed', result);
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.logger.error('Settings validation failed', { error });
    }

    return result;
  }

  /**
   * Sanitize settings by fixing invalid values
   */
  sanitize(): void {
    try {
      const settings = this.getAll();
      let changesMade = false;

      // Sanitize theme
      if (!['light', 'dark', 'system'].includes(settings.theme)) {
        (this.store as any).set('theme', 'light');
        changesMade = true;
      }

      // Sanitize video quality
      if (!['best', 'worst', '720p', '1080p'].includes(settings.videoQuality)) {
        (this.store as any).set('videoQuality', 'best');
        changesMade = true;
      }

      // Sanitize concurrent downloads
      if (
        settings.maxConcurrentDownloads < 1 ||
        settings.maxConcurrentDownloads > 10
      ) {
        (this.store as any).set('maxConcurrentDownloads', 3);
        changesMade = true;
      }

      // Sanitize window size
      if (settings.windowSize.width < 800 || settings.windowSize.height < 600) {
        (this.store as any).set('windowSize', { width: 1200, height: 800 });
        changesMade = true;
      }

      // Sanitize paths
      if (
        settings.downloadLocation &&
        !path.isAbsolute(settings.downloadLocation)
      ) {
        (this.store as any).set(
          'downloadLocation',
          path.join(app.getPath('downloads'), 'Playlistify'),
        );
        changesMade = true;
      }

      if (changesMade) {
        this.logger.info('Settings sanitized - invalid values corrected');
      }
    } catch (error) {
      this.logger.error('Failed to sanitize settings', { error });
      throw new SettingsError(
        'Failed to sanitize settings',
        'SANITIZE_ERROR',
        error,
      );
    }
  }

  /**
   * Export settings with metadata
   */
  export(): SettingsExportData {
    try {
      const exportData: SettingsExportData = {
        version: '1.0.0',
        exportDate: new Date(),
        settings: this.getAll(),
      };

      this.logger.info('Settings exported');
      return exportData;
    } catch (error) {
      this.logger.error('Failed to export settings', { error });
      throw new SettingsError(
        'Failed to export settings',
        'EXPORT_ERROR',
        error,
      );
    }
  }

  /**
   * Import settings with validation
   */
  import(data: SettingsExportData): boolean {
    try {
      // Validate import data structure
      if (!data.settings || typeof data.settings !== 'object') {
        throw new SettingsError(
          'Invalid import data structure',
          'IMPORT_VALIDATION_ERROR',
        );
      }

      // Import each valid setting
      let importedCount = 0;
      Object.entries(data.settings).forEach(([key, value]) => {
        if (key in DEFAULT_USER_SETTINGS) {
          try {
            this.set(key as keyof UserSettings, value as any);
            importedCount++;
          } catch (error) {
            this.logger.warn(`Failed to import setting: ${key}`, {
              error,
              value,
            });
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
      } else {
        this.logger.info('Settings imported successfully', { importedCount });
      }

      return validation.isValid;
    } catch (error) {
      this.logger.error('Failed to import settings', { error });
      throw new SettingsError(
        'Failed to import settings',
        'IMPORT_ERROR',
        error,
      );
    }
  }

  /**
   * Get the file path where settings are stored
   */
  getStorePath(): string {
    return (this.store as any).path;
  }

  /**
   * Initialize default settings and directories
   */
  async initializeDefaults(): Promise<void> {
    try {
      // Initialize download location if not set
      if (!this.get('downloadLocation')) {
        const defaultPath = path.join(app.getPath('downloads'), 'Playlistify');
        this.set('downloadLocation', defaultPath);
      }

      // Initialize temp directory if not set
      if (!this.get('tempDirectory')) {
        const tempPath = path.join(app.getPath('userData'), 'temp');
        this.set('tempDirectory', tempPath);
      }

      // Validate and sanitize all settings
      this.sanitize();

      this.logger.info('Default settings initialized');
    } catch (error) {
      this.logger.error('Failed to initialize default settings', { error });
      throw new SettingsError(
        'Failed to initialize default settings',
        'INIT_DEFAULTS_ERROR',
        error,
      );
    }
  }

  /**
   * Create a backup of current settings
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = this.export();
      const backupPath = path.join(
        app.getPath('userData'),
        'config',
        `settings-backup-${timestamp}.json`,
      );

      // Ensure backup directory exists
      const fs = require('fs-extra');
      await fs.ensureDir(path.dirname(backupPath));
      await fs.writeJson(backupPath, backupData, { spaces: 2 });

      this.logger.info('Settings backup created', { backupPath });
      return backupPath;
    } catch (error) {
      this.logger.error('Failed to create settings backup', { error });
      throw new SettingsError(
        'Failed to create settings backup',
        'BACKUP_ERROR',
        error,
      );
    }
  }

  /**
   * Restore settings from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      const fs = require('fs-extra');
      const backupData = await fs.readJson(backupPath);

      if (!this.import(backupData)) {
        throw new SettingsError(
          'Backup data validation failed',
          'RESTORE_VALIDATION_ERROR',
        );
      }

      this.logger.info('Settings restored from backup', { backupPath });
    } catch (error) {
      this.logger.error('Failed to restore settings from backup', {
        error,
        backupPath,
      });
      throw new SettingsError(
        'Failed to restore settings from backup',
        'RESTORE_ERROR',
        error,
      );
    }
  }

  /**
   * Get current settings version
   */
  getVersion(): string {
    try {
      return this.get('version' as any) || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Set settings version
   */
  setVersion(version: string): void {
    try {
      (this.store as any).set('version', version);
      this.logger.info('Settings version updated', { version });
    } catch (error) {
      this.logger.error('Failed to set settings version', { error, version });
    }
  }

  /**
   * Check if migration is needed
   */
  needsMigration(targetVersion: string): boolean {
    const currentVersion = this.getVersion();
    return currentVersion !== targetVersion;
  }

  /**
   * Migrate settings to new version
   */
  async migrate(targetVersion: string): Promise<void> {
    const currentVersion = this.getVersion();

    try {
      this.logger.info('Starting settings migration', {
        currentVersion,
        targetVersion,
      });

      // Create backup before migration
      const backupPath = await this.createBackup();

      // Apply version-specific migrations
      await this.applyMigrations(currentVersion, targetVersion);

      // Update version
      this.setVersion(targetVersion);

      // Validate after migration
      const validation = this.validate();
      if (!validation.isValid) {
        this.logger.warn(
          'Settings validation failed after migration',
          validation,
        );
        this.sanitize();
      }

      this.logger.info('Settings migration completed successfully', {
        currentVersion,
        targetVersion,
        backupPath,
      });
    } catch (error) {
      this.logger.error('Settings migration failed', {
        error,
        currentVersion,
        targetVersion,
      });
      throw new SettingsError(
        'Settings migration failed',
        'MIGRATION_ERROR',
        error,
      );
    }
  }

  /**
   * Apply version-specific migration logic
   */
  private async applyMigrations(
    fromVersion: string,
    toVersion: string,
  ): Promise<void> {
    // Migration logic for different version transitions
    // This is where you would add specific migration steps for each version

    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      // Example migration: Add new settings with defaults
      if (!this.has('notificationsEnabled')) {
        this.set('notificationsEnabled', true);
      }
    }

    // Add more migration logic as needed for future versions
    this.logger.debug('Applied migrations', { fromVersion, toVersion });
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<
    Array<{ path: string; date: Date; version?: string }>
  > {
    try {
      const fs = require('fs-extra');
      const backupDir = path.join(app.getPath('userData'), 'config');

      if (!(await fs.pathExists(backupDir))) {
        return [];
      }

      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter((file: string) =>
        file.startsWith('settings-backup-'),
      );

      const backups = await Promise.all(
        backupFiles.map(async (file: string) => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);

          try {
            const data = await fs.readJson(filePath);
            return {
              path: filePath,
              date: stats.mtime,
              version: data.version,
            };
          } catch {
            return {
              path: filePath,
              date: stats.mtime,
            };
          }
        }),
      );

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      this.logger.error('Failed to list backups', { error });
      return [];
    }
  }

  /**
   * Validate a single setting value
   */
  private validateSingleSetting(
    key: keyof UserSettings,
    value: any,
  ): { isValid: boolean; errors: string[]; warnings?: string[] } {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

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
            result.errors.push(
              'Video quality must be "best", "worst", "720p", or "1080p"',
            );
          }
          break;

        case 'maxConcurrentDownloads':
          if (typeof value !== 'number' || value < 1 || value > 10) {
            result.isValid = false;
            result.errors.push(
              'Max concurrent downloads must be a number between 1 and 10',
            );
          }
          break;

        case 'windowSize':
          if (
            !value ||
            typeof value !== 'object' ||
            typeof value.width !== 'number' ||
            typeof value.height !== 'number' ||
            value.width < 800 ||
            value.height < 600
          ) {
            result.isValid = false;
            result.errors.push(
              'Window size must have width >= 800 and height >= 600',
            );
          }
          break;

        case 'windowPosition':
          if (
            !value ||
            typeof value !== 'object' ||
            typeof value.x !== 'number' ||
            typeof value.y !== 'number'
          ) {
            result.isValid = false;
            result.errors.push(
              'Window position must have numeric x and y coordinates',
            );
          }
          break;

        case 'downloadLocation':
        case 'tempDirectory':
          if (value && typeof value === 'string' && !path.isAbsolute(value)) {
            result.warnings?.push('Path should be absolute');
          }
          break;
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return result;
  }
}

// Export a singleton instance
export const settingsService = new SettingsService();

import { UserSettings, ISettingsService, SettingsValidationResult, SettingsExportData } from '../../shared/types/settings-types';
interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare class SettingsService implements ISettingsService {
    private store;
    private logger;
    constructor(logger?: Logger);
    /**
     * Get a setting value by key with type safety
     */
    get<K extends keyof UserSettings>(key: K): UserSettings[K];
    /**
     * Set a setting value by key with validation
     */
    set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void;
    /**
     * Get all settings
     */
    getAll(): UserSettings;
    /**
     * Reset all settings to defaults
     */
    reset(): void;
    /**
     * Check if a setting exists (has been set)
     */
    has(key: keyof UserSettings): boolean;
    /**
     * Delete a specific setting (revert to default)
     */
    delete(key: keyof UserSettings): void;
    /**
     * Validate all settings and return detailed results
     */
    validate(): SettingsValidationResult;
    /**
     * Sanitize settings by fixing invalid values
     */
    sanitize(): void;
    /**
     * Export settings with metadata
     */
    export(): SettingsExportData;
    /**
     * Import settings with validation
     */
    import(data: SettingsExportData): boolean;
    /**
     * Get the file path where settings are stored
     */
    getStorePath(): string;
    /**
     * Initialize default settings and directories
     */
    initializeDefaults(): Promise<void>;
    /**
     * Validate a single setting value
     */
    private validateSingleSetting;
}
export declare const settingsService: SettingsService;
export {};
//# sourceMappingURL=settingsService.d.ts.map
interface AppSettings {
    theme: 'light' | 'dark';
    downloadLocation: string;
    videoQuality: 'best' | 'worst' | '720p' | '1080p';
    maxConcurrentDownloads: number;
    autoUpdatePlaylist: boolean;
    notificationsEnabled: boolean;
    windowSize: {
        width: number;
        height: number;
    };
    windowPosition: {
        x: number;
        y: number;
    };
}
export declare class SettingsService {
    private store;
    constructor();
    /**
     * Get a setting value by key
     */
    get<K extends keyof AppSettings>(key: K): AppSettings[K];
    /**
     * Set a setting value by key
     */
    set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void;
    /**
     * Get all settings
     */
    getAll(): AppSettings;
    /**
     * Reset all settings to defaults
     */
    reset(): void;
    /**
     * Check if a setting has been customized (not default)
     */
    hasCustomValue<K extends keyof AppSettings>(key: K): boolean;
    /**
     * Get the file path where settings are stored
     */
    getStorePath(): string;
    /**
     * Initialize default download location if not set
     */
    initializeDownloadLocation(): Promise<void>;
    /**
     * Validate and sanitize settings
     */
    validateSettings(): boolean;
    /**
     * Export settings to JSON
     */
    exportSettings(): string;
    /**
     * Import settings from JSON
     */
    importSettings(jsonString: string): boolean;
}
export declare const settingsService: SettingsService;
export {};
//# sourceMappingURL=settingsService.d.ts.map
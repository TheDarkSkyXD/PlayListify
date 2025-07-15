import Store from 'electron-store';

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

const defaultSettings: AppSettings = {
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

export class SettingsService {
  private store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({
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
  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  /**
   * Set a setting value by key
   */
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
  }

  /**
   * Get all settings
   */
  getAll(): AppSettings {
    return this.store.store;
  }

  /**
   * Reset all settings to defaults
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * Check if a setting has been customized (not default)
   */
  hasCustomValue<K extends keyof AppSettings>(key: K): boolean {
    return this.store.has(key);
  }

  /**
   * Get the file path where settings are stored
   */
  getStorePath(): string {
    return this.store.path;
  }

  /**
   * Initialize default download location if not set
   */
  async initializeDownloadLocation(): Promise<void> {
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
  validateSettings(): boolean {
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
    } catch (error) {
      console.error('Settings validation failed:', error);
      return false;
    }
  }

  /**
   * Export settings to JSON
   */
  exportSettings(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import settings from JSON
   */
  importSettings(jsonString: string): boolean {
    try {
      const settings = JSON.parse(jsonString) as Partial<AppSettings>;
      
      // Validate each setting before importing
      Object.keys(settings).forEach(key => {
        if (key in defaultSettings) {
          this.set(key as keyof AppSettings, settings[key as keyof AppSettings] as any);
        }
      });

      return this.validateSettings();
    } catch (error) {
      console.error('Settings import failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const settingsService = new SettingsService();
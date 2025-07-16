import { app, BrowserWindow } from 'electron';
import { getLogger } from './logger-service';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface DevelopmentConfig {
  enabled: boolean;
  hotReload: boolean;
  devTools: boolean;
  debugLogging: boolean;
  performanceMonitoring: boolean;
  memoryTracking: boolean;
}

export interface PerformanceMetrics {
  startupTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: string;
}

class DevelopmentService {
  private config: DevelopmentConfig;
  private logger = getLogger();
  private startTime: number;
  private performanceMetrics: PerformanceMetrics[] = [];
  private memoryTrackingInterval?: NodeJS.Timeout;

  constructor(config?: Partial<DevelopmentConfig>) {
    this.startTime = Date.now();
    
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      hotReload: process.env.NODE_ENV === 'development',
      devTools: process.env.NODE_ENV === 'development',
      debugLogging: process.env.NODE_ENV === 'development',
      performanceMonitoring: process.env.NODE_ENV === 'development',
      memoryTracking: process.env.NODE_ENV === 'development',
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.logger.debug('Development service initialized', 'DevelopmentService', {
      config: this.config
    });

    // Start performance monitoring
    if (this.config.performanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    // Start memory tracking
    if (this.config.memoryTracking) {
      this.startMemoryTracking();
    }

    // Set up development event listeners
    this.setupDevelopmentEventListeners();
  }

  private startPerformanceMonitoring(): void {
    const startupTime = Date.now() - this.startTime;
    
    const metrics: PerformanceMetrics = {
      startupTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.push(metrics);
    
    this.logger.debug('Performance metrics collected', 'DevelopmentService', {
      startupTime: `${startupTime}ms`,
      memoryUsage: this.formatMemoryUsage(metrics.memoryUsage)
    });
  }

  private startMemoryTracking(): void {
    // Track memory usage every 30 seconds in development
    this.memoryTrackingInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      this.logger.debug('Memory usage', 'DevelopmentService', {
        memory: this.formatMemoryUsage(memoryUsage)
      });

      // Warn if memory usage is high
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 100) {
        this.logger.warn('High memory usage detected', 'DevelopmentService', {
          heapUsedMB: Math.round(heapUsedMB),
          threshold: 100
        });
      }
    }, 30000);
  }

  private formatMemoryUsage(memoryUsage: NodeJS.MemoryUsage): any {
    return {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };
  }

  private setupDevelopmentEventListeners(): void {
    // Listen for app events and log them for debugging
    app.on('browser-window-created', (event, window) => {
      this.logger.debug('Browser window created', 'DevelopmentService', {
        windowId: window.id,
        title: window.getTitle()
      });

      // Set up window-specific development features
      if (this.config.devTools) {
        window.webContents.on('did-finish-load', () => {
          this.logger.debug('Window finished loading', 'DevelopmentService', {
            windowId: window.id,
            url: window.webContents.getURL()
          });
        });

        window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          this.logger.error('Window failed to load', 'DevelopmentService', {
            windowId: window.id,
            errorCode,
            errorDescription,
            url: validatedURL
          });
        });
      }
    });

    app.on('browser-window-focus', (event, window) => {
      this.logger.debug('Window focused', 'DevelopmentService', {
        windowId: window.id
      });
    });

    app.on('browser-window-blur', (event, window) => {
      this.logger.debug('Window blurred', 'DevelopmentService', {
        windowId: window.id
      });
    });
  }

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  public getCurrentMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  public getFormattedMemoryUsage(): any {
    return this.formatMemoryUsage(this.getCurrentMemoryUsage());
  }

  public logSystemInfo(): void {
    if (!this.config.enabled) return;

    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      v8Version: process.versions.v8,
      appVersion: app.getVersion(),
      appName: app.getName(),
      userDataPath: app.getPath('userData'),
      tempPath: app.getPath('temp'),
      homePath: app.getPath('home')
    };

    this.logger.info('System information', 'DevelopmentService', systemInfo);
  }

  public async exportDevelopmentData(): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Development service is not enabled');
    }

    const developmentData = {
      config: this.config,
      performanceMetrics: this.performanceMetrics,
      currentMemoryUsage: this.getCurrentMemoryUsage(),
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        v8Version: process.versions.v8,
        appVersion: app.getVersion()
      },
      timestamp: new Date().toISOString()
    };

    try {
      const userDataPath = app.getPath('userData');
      const exportPath = path.join(userDataPath, 'development-data.json');
      
      await fs.writeJson(exportPath, developmentData, { spaces: 2 });
      
      this.logger.info('Development data exported', 'DevelopmentService', {
        exportPath
      });

      return exportPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to export development data', 'DevelopmentService', {
        error: errorMessage
      });
      throw error;
    }
  }

  public enableDevTools(window?: BrowserWindow): void {
    if (!this.config.enabled) return;

    const targetWindow = window || BrowserWindow.getFocusedWindow();
    
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.openDevTools();
      this.logger.debug('DevTools opened', 'DevelopmentService', {
        windowId: targetWindow.id
      });
    }
  }

  public disableDevTools(window?: BrowserWindow): void {
    if (!this.config.enabled) return;

    const targetWindow = window || BrowserWindow.getFocusedWindow();
    
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.closeDevTools();
      this.logger.debug('DevTools closed', 'DevelopmentService', {
        windowId: targetWindow.id
      });
    }
  }

  public toggleDevTools(window?: BrowserWindow): void {
    if (!this.config.enabled) return;

    const targetWindow = window || BrowserWindow.getFocusedWindow();
    
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.toggleDevTools();
      this.logger.debug('DevTools toggled', 'DevelopmentService', {
        windowId: targetWindow.id
      });
    }
  }

  public forceGarbageCollection(): void {
    if (!this.config.enabled) return;

    if (global.gc) {
      const beforeMemory = process.memoryUsage();
      global.gc();
      const afterMemory = process.memoryUsage();
      
      this.logger.debug('Garbage collection forced', 'DevelopmentService', {
        before: this.formatMemoryUsage(beforeMemory),
        after: this.formatMemoryUsage(afterMemory),
        freed: `${Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024)}MB`
      });
    } else {
      this.logger.warn('Garbage collection not available', 'DevelopmentService', {
        hint: 'Start with --expose-gc flag to enable manual garbage collection'
      });
    }
  }

  public getConfig(): DevelopmentConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<DevelopmentConfig>): void {
    this.config = { ...this.config, ...updates };
    
    this.logger.debug('Development config updated', 'DevelopmentService', {
      updates,
      newConfig: this.config
    });

    // Restart services if needed
    if (updates.memoryTracking !== undefined) {
      if (this.memoryTrackingInterval) {
        clearInterval(this.memoryTrackingInterval);
        this.memoryTrackingInterval = undefined;
      }
      
      if (updates.memoryTracking && this.config.enabled) {
        this.startMemoryTracking();
      }
    }
  }

  public shutdown(): void {
    this.logger.debug('Development service shutting down', 'DevelopmentService');

    // Clear intervals
    if (this.memoryTrackingInterval) {
      clearInterval(this.memoryTrackingInterval);
      this.memoryTrackingInterval = undefined;
    }

    // Log final performance metrics
    if (this.config.performanceMonitoring) {
      const totalRuntime = Date.now() - this.startTime;
      const finalMemory = process.memoryUsage();
      
      this.logger.info('Final development metrics', 'DevelopmentService', {
        totalRuntime: `${totalRuntime}ms`,
        finalMemory: this.formatMemoryUsage(finalMemory),
        totalMetricsCollected: this.performanceMetrics.length
      });
    }
  }
}

// Create singleton instance
let developmentServiceInstance: DevelopmentService | null = null;

export function createDevelopmentService(config?: Partial<DevelopmentConfig>): DevelopmentService {
  if (!developmentServiceInstance) {
    developmentServiceInstance = new DevelopmentService(config);
  }
  return developmentServiceInstance;
}

export function getDevelopmentService(): DevelopmentService | null {
  return developmentServiceInstance;
}

export { DevelopmentService };
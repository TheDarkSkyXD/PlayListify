/**
 * Performance Service - Comprehensive performance monitoring and optimization
 * Handles startup performance, memory tracking, build optimization, and lazy loading
 */

import { app } from 'electron';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { getLogger } from './logger-service';

export interface PerformanceConfig {
  enabled: boolean;
  startupMonitoring: boolean;
  memoryTracking: boolean;
  cpuTracking: boolean;
  diskTracking: boolean;
  networkTracking: boolean;
  metricsCollection: boolean;
  lazyLoading: boolean;
  optimizations: boolean;
}

export interface StartupMetrics {
  processStart: number;
  appReady: number;
  windowCreated: number;
  rendererReady: number;
  totalStartupTime: number;
  phases: {
    initialization: number;
    serviceSetup: number;
    windowCreation: number;
    rendererLoad: number;
  };
}

export interface MemoryMetrics {
  timestamp: number;
  process: NodeJS.MemoryUsage;
  system: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  heap: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
}

export interface CPUMetrics {
  timestamp: number;
  process: NodeJS.CpuUsage;
  system: {
    loadAverage: number[];
    cpuCount: number;
    usage: number;
  };
}

export interface DiskMetrics {
  timestamp: number;
  userDataSize: number;
  tempSize: number;
  logSize: number;
  totalAppSize: number;
}

export interface NetworkMetrics {
  timestamp: number;
  bytesReceived: number;
  bytesSent: number;
  requestCount: number;
  errorCount: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  startup: StartupMetrics | null;
  memory: MemoryMetrics;
  cpu: CPUMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'memory' | 'cpu' | 'disk' | 'network' | 'startup';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export interface LazyLoadableService {
  name: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  loader: () => Promise<any>;
  loaded: boolean;
  loadTime?: number;
}

class PerformanceService {
  private config: PerformanceConfig;
  private logger = getLogger();
  private startupMetrics: StartupMetrics | null = null;
  private metricsHistory: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private lazyServices: Map<string, LazyLoadableService> = new Map();

  // Tracking intervals
  private memoryTrackingInterval?: NodeJS.Timeout;
  private cpuTrackingInterval?: NodeJS.Timeout;
  private diskTrackingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  // Performance thresholds
  private readonly thresholds = {
    memory: {
      warning: 100 * 1024 * 1024, // 100MB
      error: 200 * 1024 * 1024, // 200MB
      critical: 500 * 1024 * 1024, // 500MB
    },
    cpu: {
      warning: 50, // 50%
      error: 75, // 75%
      critical: 90, // 90%
    },
    startup: {
      warning: 3000, // 3 seconds
      error: 5000, // 5 seconds
      critical: 10000, // 10 seconds
    },
    disk: {
      warning: 100 * 1024 * 1024, // 100MB
      error: 500 * 1024 * 1024, // 500MB
      critical: 1024 * 1024 * 1024, // 1GB
    },
  };

  // Timing markers
  private timingMarkers: Map<string, number> = new Map();

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      startupMonitoring: true,
      memoryTracking: true,
      cpuTracking: true,
      diskTracking: true,
      networkTracking: false, // Disabled by default as it requires more setup
      metricsCollection: true,
      lazyLoading: true,
      optimizations: true,
      ...config,
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.logger.debug(
      'Performance service initializing',
      'PerformanceService',
      {
        config: this.config,
      },
    );

    // Mark process start time
    this.markTiming('process-start', Date.now());

    // Start monitoring systems
    if (this.config.startupMonitoring) {
      this.initializeStartupMonitoring();
    }

    if (this.config.memoryTracking) {
      this.startMemoryTracking();
    }

    if (this.config.cpuTracking) {
      this.startCPUTracking();
    }

    if (this.config.diskTracking) {
      this.startDiskTracking();
    }

    // Set up cleanup interval
    this.startCleanupInterval();

    this.logger.info('Performance service initialized', 'PerformanceService');
  }

  // Startup Performance Monitoring
  private initializeStartupMonitoring(): void {
    this.markTiming('app-ready', Date.now());

    app.on('ready', () => {
      this.markTiming('electron-ready', Date.now());
    });

    app.on('browser-window-created', (event, window) => {
      this.markTiming('window-created', Date.now());

      window.webContents.on('did-finish-load', () => {
        this.markTiming('renderer-ready', Date.now());
        this.calculateStartupMetrics();
      });
    });
  }

  private calculateStartupMetrics(): void {
    const processStart = this.timingMarkers.get('process-start') || Date.now();
    const appReady = this.timingMarkers.get('electron-ready') || processStart;
    const windowCreated = this.timingMarkers.get('window-created') || appReady;
    const rendererReady =
      this.timingMarkers.get('renderer-ready') || windowCreated;

    this.startupMetrics = {
      processStart,
      appReady,
      windowCreated,
      rendererReady,
      totalStartupTime: rendererReady - processStart,
      phases: {
        initialization: appReady - processStart,
        serviceSetup: windowCreated - appReady,
        windowCreation: rendererReady - windowCreated,
        rendererLoad: rendererReady - windowCreated,
      },
    };

    this.logger.info('Startup performance calculated', 'PerformanceService', {
      totalTime: `${this.startupMetrics.totalStartupTime}ms`,
      phases: {
        initialization: `${this.startupMetrics.phases.initialization}ms`,
        serviceSetup: `${this.startupMetrics.phases.serviceSetup}ms`,
        windowCreation: `${this.startupMetrics.phases.windowCreation}ms`,
        rendererLoad: `${this.startupMetrics.phases.rendererLoad}ms`,
      },
    });

    // Check startup performance thresholds
    this.checkStartupThresholds();
  }

  private checkStartupThresholds(): void {
    if (!this.startupMetrics) return;

    const { totalStartupTime } = this.startupMetrics;

    if (totalStartupTime > this.thresholds.startup.critical) {
      this.createAlert(
        'critical',
        'startup',
        'Critical startup time detected',
        totalStartupTime,
        this.thresholds.startup.critical,
      );
    } else if (totalStartupTime > this.thresholds.startup.error) {
      this.createAlert(
        'error',
        'startup',
        'Slow startup time detected',
        totalStartupTime,
        this.thresholds.startup.error,
      );
    } else if (totalStartupTime > this.thresholds.startup.warning) {
      this.createAlert(
        'warning',
        'startup',
        'Startup time above optimal',
        totalStartupTime,
        this.thresholds.startup.warning,
      );
    }
  }

  // Memory Tracking
  private startMemoryTracking(): void {
    this.memoryTrackingInterval = setInterval(() => {
      const memoryMetrics = this.collectMemoryMetrics();
      this.checkMemoryThresholds(memoryMetrics);
    }, 30000); // Every 30 seconds
  }

  private collectMemoryMetrics(): MemoryMetrics {
    const processMemory = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    };

    const heapLimit = 1.4 * 1024 * 1024 * 1024; // Approximate V8 heap limit (1.4GB)
    const heapMetrics = {
      used: processMemory.heapUsed,
      total: processMemory.heapTotal,
      limit: heapLimit,
      percentage: (processMemory.heapUsed / heapLimit) * 100,
    };

    return {
      timestamp: Date.now(),
      process: processMemory,
      system: systemMemory,
      heap: heapMetrics,
    };
  }

  private checkMemoryThresholds(metrics: MemoryMetrics): void {
    const heapUsed = metrics.process.heapUsed;

    if (heapUsed > this.thresholds.memory.critical) {
      this.createAlert(
        'critical',
        'memory',
        'Critical memory usage detected',
        heapUsed,
        this.thresholds.memory.critical,
      );
      this.triggerMemoryCleanup();
    } else if (heapUsed > this.thresholds.memory.error) {
      this.createAlert(
        'error',
        'memory',
        'High memory usage detected',
        heapUsed,
        this.thresholds.memory.error,
      );
    } else if (heapUsed > this.thresholds.memory.warning) {
      this.createAlert(
        'warning',
        'memory',
        'Memory usage above optimal',
        heapUsed,
        this.thresholds.memory.warning,
      );
    }
  }

  // CPU Tracking
  private startCPUTracking(): void {
    this.cpuTrackingInterval = setInterval(() => {
      const cpuMetrics = this.collectCPUMetrics();
      this.checkCPUThresholds(cpuMetrics);
    }, 60000); // Every minute
  }

  private collectCPUMetrics(): CPUMetrics {
    const processCPU = process.cpuUsage();
    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;

    return {
      timestamp: Date.now(),
      process: processCPU,
      system: {
        loadAverage,
        cpuCount,
        usage: (loadAverage[0] / cpuCount) * 100,
      },
    };
  }

  private checkCPUThresholds(metrics: CPUMetrics): void {
    const cpuUsage = metrics.system.usage;

    if (cpuUsage > this.thresholds.cpu.critical) {
      this.createAlert(
        'critical',
        'cpu',
        'Critical CPU usage detected',
        cpuUsage,
        this.thresholds.cpu.critical,
      );
    } else if (cpuUsage > this.thresholds.cpu.error) {
      this.createAlert(
        'error',
        'cpu',
        'High CPU usage detected',
        cpuUsage,
        this.thresholds.cpu.error,
      );
    } else if (cpuUsage > this.thresholds.cpu.warning) {
      this.createAlert(
        'warning',
        'cpu',
        'CPU usage above optimal',
        cpuUsage,
        this.thresholds.cpu.warning,
      );
    }
  }

  // Disk Tracking
  private startDiskTracking(): void {
    this.diskTrackingInterval = setInterval(async () => {
      const diskMetrics = await this.collectDiskMetrics();
      this.checkDiskThresholds(diskMetrics);
    }, 300000); // Every 5 minutes
  }

  private async collectDiskMetrics(): Promise<DiskMetrics> {
    const userDataPath = app.getPath('userData');
    const tempPath = app.getPath('temp');

    const [userDataSize, tempSize, logSize] = await Promise.all([
      this.getDirectorySize(userDataPath),
      this.getDirectorySize(path.join(tempPath, 'playlistify')),
      this.getDirectorySize(path.join(userDataPath, 'logs')),
    ]);

    return {
      timestamp: Date.now(),
      userDataSize,
      tempSize,
      logSize,
      totalAppSize: userDataSize + tempSize,
    };
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      if (!(await fs.pathExists(dirPath))) {
        return 0;
      }

      const stats = await fs.stat(dirPath);
      if (stats.isFile()) {
        return stats.size;
      }

      const files = await fs.readdir(dirPath);
      const sizes = await Promise.all(
        files.map(file => this.getDirectorySize(path.join(dirPath, file))),
      );

      return sizes.reduce((total, size) => total + size, 0);
    } catch (error) {
      this.logger.warn(
        'Failed to calculate directory size',
        'PerformanceService',
        {
          path: dirPath,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      return 0;
    }
  }

  private checkDiskThresholds(metrics: DiskMetrics): void {
    const totalSize = metrics.totalAppSize;

    if (totalSize > this.thresholds.disk.critical) {
      this.createAlert(
        'critical',
        'disk',
        'Critical disk usage detected',
        totalSize,
        this.thresholds.disk.critical,
      );
    } else if (totalSize > this.thresholds.disk.error) {
      this.createAlert(
        'error',
        'disk',
        'High disk usage detected',
        totalSize,
        this.thresholds.disk.error,
      );
    } else if (totalSize > this.thresholds.disk.warning) {
      this.createAlert(
        'warning',
        'disk',
        'Disk usage above optimal',
        totalSize,
        this.thresholds.disk.warning,
      );
    }
  }

  // Alert Management
  private createAlert(
    type: PerformanceAlert['type'],
    category: PerformanceAlert['category'],
    message: string,
    value: number,
    threshold: number,
  ): void {
    const alert: PerformanceAlert = {
      id: `${category}-${type}-${Date.now()}`,
      type,
      category,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    this.logger.warn('Performance alert created', 'PerformanceService', {
      alert: {
        type: alert.type,
        category: alert.category,
        message: alert.message,
        value: this.formatValue(alert.value, alert.category),
        threshold: this.formatValue(alert.threshold, alert.category),
      },
    });
  }

  private formatValue(value: number, category: string): string {
    switch (category) {
      case 'memory':
      case 'disk':
        return `${Math.round(value / 1024 / 1024)}MB`;
      case 'cpu':
        return `${Math.round(value)}%`;
      case 'startup':
        return `${value}ms`;
      default:
        return String(value);
    }
  }

  // Cleanup and Memory Management
  private triggerMemoryCleanup(): void {
    this.logger.info('Triggering memory cleanup', 'PerformanceService');

    // Force garbage collection if available
    if (global.gc) {
      const beforeMemory = process.memoryUsage();
      global.gc();
      const afterMemory = process.memoryUsage();

      this.logger.info('Garbage collection completed', 'PerformanceService', {
        before: `${Math.round(beforeMemory.heapUsed / 1024 / 1024)}MB`,
        after: `${Math.round(afterMemory.heapUsed / 1024 / 1024)}MB`,
        freed: `${Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024)}MB`,
      });
    }

    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
      this.cleanupResolvedAlerts();
    }, 3600000); // Every hour
  }

  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;

    const beforeCount = this.metricsHistory.length;
    this.metricsHistory = this.metricsHistory.filter(
      metric => metric.timestamp > cutoff,
    );
    const afterCount = this.metricsHistory.length;

    if (beforeCount > afterCount) {
      this.logger.debug('Cleaned up old metrics', 'PerformanceService', {
        removed: beforeCount - afterCount,
        remaining: afterCount,
      });
    }
  }

  private cleanupResolvedAlerts(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - maxAge;

    const beforeCount = this.alerts.length;
    this.alerts = this.alerts.filter(
      alert => !alert.resolved || alert.timestamp > cutoff,
    );
    const afterCount = this.alerts.length;

    if (beforeCount > afterCount) {
      this.logger.debug('Cleaned up old alerts', 'PerformanceService', {
        removed: beforeCount - afterCount,
        remaining: afterCount,
      });
    }
  }

  // Timing utilities
  public markTiming(name: string, timestamp?: number): void {
    this.timingMarkers.set(name, timestamp || Date.now());
  }

  public measureTiming(startMark: string, endMark?: string): number {
    const start = this.timingMarkers.get(startMark);
    const end = endMark ? this.timingMarkers.get(endMark) : Date.now();

    if (!start) {
      this.logger.warn('Start timing mark not found', 'PerformanceService', {
        mark: startMark,
      });
      return 0;
    }

    return (end || Date.now()) - start;
  }

  // Public API methods
  public getStartupMetrics(): StartupMetrics | null {
    return this.startupMetrics;
  }

  public getCurrentMemoryMetrics(): MemoryMetrics {
    return this.collectMemoryMetrics();
  }

  public getCurrentCPUMetrics(): CPUMetrics {
    return this.collectCPUMetrics();
  }

  public async getCurrentDiskMetrics(): Promise<DiskMetrics> {
    return this.collectDiskMetrics();
  }

  public getMetricsHistory(): PerformanceSnapshot[] {
    return [...this.metricsHistory];
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info('Performance alert resolved', 'PerformanceService', {
        alertId,
      });
      return true;
    }
    return false;
  }

  public async takePerformanceSnapshot(): Promise<PerformanceSnapshot> {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      startup: this.startupMetrics,
      memory: this.collectMemoryMetrics(),
      cpu: this.collectCPUMetrics(),
      disk: await this.collectDiskMetrics(),
      network: {
        timestamp: Date.now(),
        bytesReceived: 0,
        bytesSent: 0,
        requestCount: 0,
        errorCount: 0,
      },
    };

    if (this.config.metricsCollection) {
      this.metricsHistory.push(snapshot);
    }

    return snapshot;
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PerformanceConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    this.logger.info('Performance config updated', 'PerformanceService', {
      updates,
      newConfig: this.config,
    });

    // Restart services if needed
    if (oldConfig.memoryTracking !== this.config.memoryTracking) {
      if (this.memoryTrackingInterval) {
        clearInterval(this.memoryTrackingInterval);
        this.memoryTrackingInterval = undefined;
      }
      if (this.config.memoryTracking && this.config.enabled) {
        this.startMemoryTracking();
      }
    }

    if (oldConfig.cpuTracking !== this.config.cpuTracking) {
      if (this.cpuTrackingInterval) {
        clearInterval(this.cpuTrackingInterval);
        this.cpuTrackingInterval = undefined;
      }
      if (this.config.cpuTracking && this.config.enabled) {
        this.startCPUTracking();
      }
    }

    if (oldConfig.diskTracking !== this.config.diskTracking) {
      if (this.diskTrackingInterval) {
        clearInterval(this.diskTrackingInterval);
        this.diskTrackingInterval = undefined;
      }
      if (this.config.diskTracking && this.config.enabled) {
        this.startDiskTracking();
      }
    }
  }

  public async exportPerformanceData(): Promise<string> {
    const exportData = {
      config: this.config,
      startupMetrics: this.startupMetrics,
      metricsHistory: this.metricsHistory,
      alerts: this.alerts,
      timingMarkers: Object.fromEntries(this.timingMarkers),
      exportTimestamp: new Date().toISOString(),
    };

    try {
      const userDataPath = app.getPath('userData');
      const exportPath = path.join(userDataPath, 'performance-data.json');

      await fs.writeJson(exportPath, exportData, { spaces: 2 });

      this.logger.info('Performance data exported', 'PerformanceService', {
        exportPath,
        metricsCount: this.metricsHistory.length,
        alertsCount: this.alerts.length,
      });

      return exportPath;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Failed to export performance data',
        'PerformanceService',
        {
          error: errorMessage,
        },
      );
      throw error;
    }
  }

  public shutdown(): void {
    this.logger.info('Performance service shutting down', 'PerformanceService');

    // Clear all intervals
    if (this.memoryTrackingInterval) {
      clearInterval(this.memoryTrackingInterval);
      this.memoryTrackingInterval = undefined;
    }

    if (this.cpuTrackingInterval) {
      clearInterval(this.cpuTrackingInterval);
      this.cpuTrackingInterval = undefined;
    }

    if (this.diskTrackingInterval) {
      clearInterval(this.diskTrackingInterval);
      this.diskTrackingInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Log final performance summary
    if (this.config.enabled) {
      const finalMemory = this.collectMemoryMetrics();
      const activeAlerts = this.getActiveAlerts();

      this.logger.info('Final performance summary', 'PerformanceService', {
        startupTime: this.startupMetrics?.totalStartupTime || 'N/A',
        finalMemory: `${Math.round(finalMemory.process.heapUsed / 1024 / 1024)}MB`,
        totalMetrics: this.metricsHistory.length,
        activeAlerts: activeAlerts.length,
        totalAlerts: this.alerts.length,
      });
    }
  }
}

// Singleton instance
let performanceServiceInstance: PerformanceService | null = null;

export function createPerformanceService(
  config?: Partial<PerformanceConfig>,
): PerformanceService {
  if (!performanceServiceInstance) {
    performanceServiceInstance = new PerformanceService(config);
  }
  return performanceServiceInstance;
}

export function getPerformanceService(): PerformanceService | null {
  return performanceServiceInstance;
}

export { PerformanceService };

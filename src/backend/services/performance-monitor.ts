/**
 * Performance Monitor - Integrates all performance monitoring services
 * Provides a unified interface for performance tracking and optimization
 */

import {
  createDevelopmentService,
  getDevelopmentService,
} from './development-service';
import {
  createLazyLoadingService,
  getLazyLoadingService,
} from './lazy-loading-service';
import { getLogger } from './logger-service';
import {
  createPerformanceService,
  getPerformanceService,
} from './performance-service';

export interface PerformanceMonitorConfig {
  enabled: boolean;
  startupOptimization: boolean;
  memoryOptimization: boolean;
  buildOptimization: boolean;
  lazyLoading: boolean;
  metricsCollection: boolean;
  alerting: boolean;
}

export interface PerformanceReport {
  timestamp: string;
  startup: {
    totalTime: number;
    phases: Record<string, number>;
  };
  memory: {
    current: number;
    peak: number;
    alerts: number;
  };
  services: {
    total: number;
    loaded: number;
    failed: number;
    averageLoadTime: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private logger = getLogger();
  private initialized = false;

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      startupOptimization: true,
      memoryOptimization: true,
      buildOptimization: process.env.NODE_ENV === 'production',
      lazyLoading: true,
      metricsCollection: true,
      alerting: true,
      ...config,
    };

    this.logger.debug('Performance monitor created', 'PerformanceMonitor', {
      config: this.config,
    });
  }

  /**
   * Initialize all performance monitoring services
   */
  public async initialize(): Promise<void> {
    if (this.initialized || !this.config.enabled) {
      return;
    }

    try {
      this.logger.info(
        'Initializing performance monitoring',
        'PerformanceMonitor',
      );

      // Initialize performance service
      const performanceService = createPerformanceService({
        enabled: this.config.enabled,
        startupMonitoring: this.config.startupOptimization,
        memoryTracking: this.config.memoryOptimization,
        metricsCollection: this.config.metricsCollection,
        lazyLoading: this.config.lazyLoading,
        optimizations: true,
      });

      // Initialize development service if in development
      if (process.env.NODE_ENV === 'development') {
        createDevelopmentService({
          enabled: true,
          performanceMonitoring: this.config.metricsCollection,
          memoryTracking: this.config.memoryOptimization,
        });
      }

      // Initialize lazy loading service
      if (this.config.lazyLoading) {
        createLazyLoadingService({
          enabled: true,
          maxConcurrentLoads: 3,
          loadTimeout: 30000,
        });
      }

      // Register non-critical services for lazy loading
      await this.registerLazyServices();

      this.initialized = true;
      this.logger.info(
        'Performance monitoring initialized',
        'PerformanceMonitor',
      );

      // Start monitoring if alerting is enabled
      if (this.config.alerting) {
        this.startPerformanceMonitoring();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Failed to initialize performance monitoring',
        'PerformanceMonitor',
        {
          error: errorMessage,
        },
      );
      throw error;
    }
  }

  /**
   * Register non-critical services for lazy loading
   */
  private async registerLazyServices(): Promise<void> {
    const lazyLoadingService = getLazyLoadingService();
    if (!lazyLoadingService) return;

    // Register YouTube service for lazy loading
    lazyLoadingService.registerService({
      name: 'youtube-service',
      priority: 'medium',
      dependencies: [],
      maxRetries: 3,
      loader: async () => {
        const YouTubeService = await import('./youtubeService');
        return YouTubeService.default
          ? new YouTubeService.default()
          : new (YouTubeService as any)();
      },
    });

    // Register playlist service for lazy loading
    lazyLoadingService.registerService({
      name: 'playlist-service',
      priority: 'high',
      dependencies: [],
      maxRetries: 3,
      loader: async () => {
        const PlaylistService = await import('./playlistService');
        return PlaylistService.default
          ? new PlaylistService.default()
          : new (PlaylistService as any)();
      },
    });

    // Register file system service for lazy loading
    lazyLoadingService.registerService({
      name: 'file-system-service',
      priority: 'low',
      dependencies: [],
      maxRetries: 3,
      loader: async () => {
        const { FileSystemService } = await import('./file-system-service');
        return new FileSystemService();
      },
    });

    this.logger.debug('Lazy services registered', 'PerformanceMonitor', {
      services: ['youtube-service', 'playlist-service', 'file-system-service'],
    });
  }

  /**
   * Start performance monitoring and alerting
   */
  private startPerformanceMonitoring(): void {
    const performanceService = getPerformanceService();
    if (!performanceService) return;

    // Monitor for performance alerts
    setInterval(() => {
      const alerts = performanceService.getActiveAlerts();
      if (alerts.length > 0) {
        this.handlePerformanceAlerts(alerts);
      }
    }, 60000); // Check every minute

    this.logger.debug('Performance monitoring started', 'PerformanceMonitor');
  }

  /**
   * Handle performance alerts
   */
  private handlePerformanceAlerts(alerts: any[]): void {
    for (const alert of alerts) {
      this.logger.warn('Performance alert detected', 'PerformanceMonitor', {
        type: alert.type,
        category: alert.category,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
      });

      // Take action based on alert type
      switch (alert.category) {
        case 'memory':
          if (alert.type === 'critical') {
            this.triggerMemoryOptimization();
          }
          break;
        case 'startup':
          if (alert.type === 'error' || alert.type === 'critical') {
            this.optimizeStartup();
          }
          break;
      }
    }
  }

  /**
   * Trigger memory optimization
   */
  private triggerMemoryOptimization(): void {
    this.logger.info('Triggering memory optimization', 'PerformanceMonitor');

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clean up lazy loading service
    const lazyLoadingService = getLazyLoadingService();
    if (lazyLoadingService) {
      // Could implement cleanup of unused services here
    }

    // Clean up development service if in development
    const developmentService = getDevelopmentService();
    if (developmentService) {
      developmentService.forceGarbageCollection();
    }
  }

  /**
   * Optimize startup performance
   */
  private optimizeStartup(): void {
    this.logger.info('Optimizing startup performance', 'PerformanceMonitor');

    // Enable more aggressive lazy loading
    const lazyLoadingService = getLazyLoadingService();
    if (lazyLoadingService) {
      lazyLoadingService.updateConfig({
        maxConcurrentLoads: 2, // Reduce concurrent loads
        priorityDelays: {
          critical: 0,
          high: 200,
          medium: 1000,
          low: 3000,
        },
      });
    }
  }

  /**
   * Generate performance report
   */
  public async generateReport(): Promise<PerformanceReport> {
    const performanceService = getPerformanceService();
    const lazyLoadingService = getLazyLoadingService();
    const developmentService = getDevelopmentService();

    const startupMetrics = performanceService?.getStartupMetrics();
    const memoryMetrics = performanceService?.getCurrentMemoryMetrics();
    const alerts = performanceService?.getActiveAlerts() || [];
    const loadingStats = lazyLoadingService?.getLoadingStats();

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (startupMetrics && startupMetrics.totalStartupTime > 5000) {
      recommendations.push(
        'Consider enabling more aggressive lazy loading to improve startup time',
      );
    }

    if (memoryMetrics && memoryMetrics.process.heapUsed > 200 * 1024 * 1024) {
      recommendations.push(
        'Memory usage is high, consider implementing memory cleanup procedures',
      );
    }

    if (loadingStats && loadingStats.failedServices > 0) {
      recommendations.push(
        `${loadingStats.failedServices} services failed to load, check service dependencies`,
      );
    }

    if (alerts.length > 0) {
      recommendations.push(
        `${alerts.length} active performance alerts require attention`,
      );
    }

    return {
      timestamp: new Date().toISOString(),
      startup: {
        totalTime: startupMetrics?.totalStartupTime || 0,
        phases: startupMetrics?.phases || {},
      },
      memory: {
        current: Math.round(
          (memoryMetrics?.process.heapUsed || 0) / 1024 / 1024,
        ),
        peak: Math.round((memoryMetrics?.process.heapTotal || 0) / 1024 / 1024),
        alerts: alerts.filter(a => a.category === 'memory').length,
      },
      services: {
        total: loadingStats?.totalServices || 0,
        loaded: loadingStats?.loadedServices || 0,
        failed: loadingStats?.failedServices || 0,
        averageLoadTime: Math.round(loadingStats?.averageLoadTime || 0),
      },
      recommendations,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): PerformanceMonitorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...updates };

    this.logger.info(
      'Performance monitor config updated',
      'PerformanceMonitor',
      {
        updates,
        newConfig: this.config,
      },
    );

    // Update underlying services
    const performanceService = getPerformanceService();
    if (performanceService) {
      performanceService.updateConfig({
        enabled: this.config.enabled,
        startupMonitoring: this.config.startupOptimization,
        memoryTracking: this.config.memoryOptimization,
        metricsCollection: this.config.metricsCollection,
      });
    }

    const developmentService = getDevelopmentService();
    if (developmentService) {
      developmentService.updateConfig({
        performanceMonitoring: this.config.metricsCollection,
        memoryTracking: this.config.memoryOptimization,
      });
    }
  }

  /**
   * Shutdown performance monitoring
   */
  public shutdown(): void {
    this.logger.info('Performance monitor shutting down', 'PerformanceMonitor');

    // Shutdown all services
    const performanceService = getPerformanceService();
    if (performanceService) {
      performanceService.shutdown();
    }

    const developmentService = getDevelopmentService();
    if (developmentService) {
      developmentService.shutdown();
    }

    const lazyLoadingService = getLazyLoadingService();
    if (lazyLoadingService) {
      lazyLoadingService.shutdown();
    }

    this.initialized = false;
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function createPerformanceMonitor(
  config?: Partial<PerformanceMonitorConfig>,
): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
  }
  return performanceMonitorInstance;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitorInstance;
}

export { PerformanceMonitor };

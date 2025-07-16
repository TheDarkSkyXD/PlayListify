/**
 * Lazy Loading Service - Manages lazy loading of non-critical services
 * Implements priority-based loading and dependency management
 */

import { getLogger } from './logger-service';

export interface LazyLoadableService {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  loader: () => Promise<any>;
  loaded: boolean;
  loadTime?: number;
  error?: Error;
  retryCount: number;
  maxRetries: number;
}

export interface LazyLoadingConfig {
  enabled: boolean;
  maxConcurrentLoads: number;
  loadTimeout: number;
  retryDelay: number;
  priorityDelays: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface LoadingStats {
  totalServices: number;
  loadedServices: number;
  failedServices: number;
  pendingServices: number;
  averageLoadTime: number;
  totalLoadTime: number;
}

class LazyLoadingService {
  private config: LazyLoadingConfig;
  private logger = getLogger();
  private services: Map<string, LazyLoadableService> = new Map();
  private loadingQueue: string[] = [];
  private currentlyLoading: Set<string> = new Set();
  private loadedInstances: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor(config?: Partial<LazyLoadingConfig>) {
    this.config = {
      enabled: true,
      maxConcurrentLoads: 3,
      loadTimeout: 30000, // 30 seconds
      retryDelay: 1000, // 1 second
      priorityDelays: {
        critical: 0, // Load immediately
        high: 100, // 100ms delay
        medium: 500, // 500ms delay
        low: 2000, // 2 second delay
      },
      ...config,
    };

    this.logger.debug(
      'Lazy loading service initialized',
      'LazyLoadingService',
      {
        config: this.config,
      },
    );
  }

  /**
   * Register a service for lazy loading
   */
  public registerService(
    service: Omit<LazyLoadableService, 'loaded' | 'retryCount'>,
  ): void {
    const lazyService: LazyLoadableService = {
      ...service,
      loaded: false,
      retryCount: 0,
      maxRetries: service.maxRetries || 3,
    };

    this.services.set(service.name, lazyService);

    this.logger.debug(
      'Service registered for lazy loading',
      'LazyLoadingService',
      {
        name: service.name,
        priority: service.priority,
        dependencies: service.dependencies,
      },
    );

    // Add to loading queue if enabled
    if (this.config.enabled) {
      this.queueService(service.name);
    }
  }

  /**
   * Queue a service for loading based on priority
   */
  private queueService(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (!service || service.loaded || this.loadingQueue.includes(serviceName)) {
      return;
    }

    // Insert based on priority
    const priorities = ['critical', 'high', 'medium', 'low'];
    const servicePriorityIndex = priorities.indexOf(service.priority);

    let insertIndex = this.loadingQueue.length;
    for (let i = 0; i < this.loadingQueue.length; i++) {
      const queuedService = this.services.get(this.loadingQueue[i]);
      if (queuedService) {
        const queuedPriorityIndex = priorities.indexOf(queuedService.priority);
        if (servicePriorityIndex < queuedPriorityIndex) {
          insertIndex = i;
          break;
        }
      }
    }

    this.loadingQueue.splice(insertIndex, 0, serviceName);

    this.logger.debug('Service queued for loading', 'LazyLoadingService', {
      name: serviceName,
      priority: service.priority,
      queuePosition: insertIndex,
      queueLength: this.loadingQueue.length,
    });

    // Start processing queue
    this.processQueue();
  }

  /**
   * Process the loading queue
   */
  private async processQueue(): Promise<void> {
    if (!this.config.enabled) return;

    while (
      this.loadingQueue.length > 0 &&
      this.currentlyLoading.size < this.config.maxConcurrentLoads
    ) {
      const serviceName = this.loadingQueue.shift();
      if (!serviceName) continue;

      const service = this.services.get(serviceName);
      if (!service || service.loaded) continue;

      // Check if dependencies are loaded
      if (!this.areDependenciesLoaded(service.dependencies)) {
        // Re-queue at the end if dependencies aren't ready
        this.loadingQueue.push(serviceName);
        continue;
      }

      // Start loading the service
      this.loadService(serviceName);
    }
  }

  /**
   * Check if all dependencies are loaded
   */
  private areDependenciesLoaded(dependencies: string[]): boolean {
    return dependencies.every(dep => {
      const service = this.services.get(dep);
      return service?.loaded || this.loadedInstances.has(dep);
    });
  }

  /**
   * Load a specific service
   */
  private async loadService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service || service.loaded || this.currentlyLoading.has(serviceName)) {
      return;
    }

    this.currentlyLoading.add(serviceName);

    // Apply priority delay
    const delay = this.config.priorityDelays[service.priority];
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const startTime = Date.now();

    try {
      this.logger.debug('Loading service', 'LazyLoadingService', {
        name: serviceName,
        priority: service.priority,
        attempt: service.retryCount + 1,
      });

      // Create loading promise with timeout
      const loadingPromise = Promise.race([
        service.loader(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Service loading timeout')),
            this.config.loadTimeout,
          ),
        ),
      ]);

      this.loadingPromises.set(serviceName, loadingPromise);

      const instance = await loadingPromise;
      const loadTime = Date.now() - startTime;

      // Mark as loaded
      service.loaded = true;
      service.loadTime = loadTime;
      this.loadedInstances.set(serviceName, instance);

      this.logger.info('Service loaded successfully', 'LazyLoadingService', {
        name: serviceName,
        priority: service.priority,
        loadTime: `${loadTime}ms`,
        attempt: service.retryCount + 1,
      });
    } catch (error) {
      const loadTime = Date.now() - startTime;
      service.error = error instanceof Error ? error : new Error(String(error));
      service.retryCount++;

      this.logger.warn('Service loading failed', 'LazyLoadingService', {
        name: serviceName,
        priority: service.priority,
        loadTime: `${loadTime}ms`,
        attempt: service.retryCount,
        maxRetries: service.maxRetries,
        error: service.error.message,
      });

      // Retry if under max retries
      if (service.retryCount < service.maxRetries) {
        setTimeout(() => {
          this.queueService(serviceName);
        }, this.config.retryDelay * service.retryCount);
      } else {
        this.logger.error(
          'Service loading failed permanently',
          'LazyLoadingService',
          {
            name: serviceName,
            priority: service.priority,
            totalAttempts: service.retryCount,
            error: service.error.message,
          },
        );
      }
    } finally {
      this.currentlyLoading.delete(serviceName);
      this.loadingPromises.delete(serviceName);

      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Get a loaded service instance
   */
  public async getService<T = any>(serviceName: string): Promise<T | null> {
    // Return immediately if already loaded
    if (this.loadedInstances.has(serviceName)) {
      return this.loadedInstances.get(serviceName) as T;
    }

    // Check if currently loading
    const loadingPromise = this.loadingPromises.get(serviceName);
    if (loadingPromise) {
      try {
        await loadingPromise;
        return (this.loadedInstances.get(serviceName) as T) || null;
      } catch (error) {
        this.logger.warn(
          'Failed to wait for service loading',
          'LazyLoadingService',
          {
            name: serviceName,
            error: error instanceof Error ? error.message : String(error),
          },
        );
        return null;
      }
    }

    // Service not loaded and not loading
    const service = this.services.get(serviceName);
    if (!service) {
      this.logger.warn('Service not registered', 'LazyLoadingService', {
        name: serviceName,
      });
      return null;
    }

    if (!service.loaded && service.retryCount >= service.maxRetries) {
      this.logger.warn(
        'Service failed to load permanently',
        'LazyLoadingService',
        { name: serviceName },
      );
      return null;
    }

    // Queue for loading if not already queued
    if (
      !this.loadingQueue.includes(serviceName) &&
      !this.currentlyLoading.has(serviceName)
    ) {
      this.queueService(serviceName);
    }

    return null;
  }

  /**
   * Force load a service immediately
   */
  public async forceLoadService<T = any>(
    serviceName: string,
  ): Promise<T | null> {
    const service = this.services.get(serviceName);
    if (!service) {
      this.logger.warn(
        'Cannot force load unregistered service',
        'LazyLoadingService',
        { name: serviceName },
      );
      return null;
    }

    if (service.loaded) {
      return this.loadedInstances.get(serviceName) as T;
    }

    // Remove from queue if present
    const queueIndex = this.loadingQueue.indexOf(serviceName);
    if (queueIndex !== -1) {
      this.loadingQueue.splice(queueIndex, 1);
    }

    // Load immediately
    await this.loadService(serviceName);
    return (this.loadedInstances.get(serviceName) as T) || null;
  }

  /**
   * Check if a service is loaded
   */
  public isServiceLoaded(serviceName: string): boolean {
    return this.loadedInstances.has(serviceName);
  }

  /**
   * Get loading statistics
   */
  public getLoadingStats(): LoadingStats {
    const services = Array.from(this.services.values());
    const loadedServices = services.filter(s => s.loaded);
    const failedServices = services.filter(
      s => s.error && s.retryCount >= s.maxRetries,
    );
    const pendingServices = services.filter(
      s => !s.loaded && (!s.error || s.retryCount < s.maxRetries),
    );

    const totalLoadTime = loadedServices.reduce(
      (sum, s) => sum + (s.loadTime || 0),
      0,
    );
    const averageLoadTime =
      loadedServices.length > 0 ? totalLoadTime / loadedServices.length : 0;

    return {
      totalServices: services.length,
      loadedServices: loadedServices.length,
      failedServices: failedServices.length,
      pendingServices: pendingServices.length,
      averageLoadTime,
      totalLoadTime,
    };
  }

  /**
   * Get service status
   */
  public getServiceStatus(serviceName: string): {
    registered: boolean;
    loaded: boolean;
    loading: boolean;
    failed: boolean;
    retryCount: number;
    loadTime?: number;
    error?: string;
  } {
    const service = this.services.get(serviceName);

    if (!service) {
      return {
        registered: false,
        loaded: false,
        loading: false,
        failed: false,
        retryCount: 0,
      };
    }

    return {
      registered: true,
      loaded: service.loaded,
      loading: this.currentlyLoading.has(serviceName),
      failed: !!service.error && service.retryCount >= service.maxRetries,
      retryCount: service.retryCount,
      loadTime: service.loadTime,
      error: service.error?.message,
    };
  }

  /**
   * Get all service statuses
   */
  public getAllServiceStatuses(): Record<
    string,
    ReturnType<typeof this.getServiceStatus>
  > {
    const statuses: Record<
      string,
      ReturnType<typeof this.getServiceStatus>
    > = {};

    for (const serviceName of this.services.keys()) {
      statuses[serviceName] = this.getServiceStatus(serviceName);
    }

    return statuses;
  }

  /**
   * Wait for all services to finish loading (or fail)
   */
  public async waitForAllServices(
    timeout: number = 60000,
  ): Promise<LoadingStats> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const stats = this.getLoadingStats();

      if (stats.pendingServices === 0 && this.currentlyLoading.size === 0) {
        this.logger.info(
          'All services finished loading',
          'LazyLoadingService',
          stats,
        );
        return stats;
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const finalStats = this.getLoadingStats();
    this.logger.warn(
      'Timeout waiting for services to load',
      'LazyLoadingService',
      {
        timeout: `${timeout}ms`,
        finalStats,
      },
    );

    return finalStats;
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<LazyLoadingConfig>): void {
    this.config = { ...this.config, ...updates };

    this.logger.debug('Lazy loading config updated', 'LazyLoadingService', {
      updates,
      newConfig: this.config,
    });

    // Restart processing if enabled
    if (this.config.enabled && this.loadingQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): LazyLoadingConfig {
    return { ...this.config };
  }

  /**
   * Shutdown the service
   */
  public shutdown(): void {
    this.logger.info(
      'Lazy loading service shutting down',
      'LazyLoadingService',
    );

    // Clear queues and loading state
    this.loadingQueue.length = 0;
    this.currentlyLoading.clear();
    this.loadingPromises.clear();

    // Log final statistics
    const stats = this.getLoadingStats();
    this.logger.info(
      'Final lazy loading statistics',
      'LazyLoadingService',
      stats,
    );
  }
}

// Singleton instance
let lazyLoadingServiceInstance: LazyLoadingService | null = null;

export function createLazyLoadingService(
  config?: Partial<LazyLoadingConfig>,
): LazyLoadingService {
  if (!lazyLoadingServiceInstance) {
    lazyLoadingServiceInstance = new LazyLoadingService(config);
  }
  return lazyLoadingServiceInstance;
}

export function getLazyLoadingService(): LazyLoadingService | null {
  return lazyLoadingServiceInstance;
}

export { LazyLoadingService };

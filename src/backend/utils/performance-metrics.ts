/**
 * Performance Metrics Collection Utilities
 * Provides utilities for collecting and analyzing performance metrics in development
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { getLogger } from '../services/logger-service';

export interface PerformanceMetric {
  name: string;
  type: 'measure' | 'mark' | 'navigation' | 'resource' | 'custom';
  startTime: number;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetric[];
  summary: {
    totalMeasures: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  };
  categories: Record<string, PerformanceMetric[]>;
}

export interface TimingConfig {
  enabled: boolean;
  collectMarks: boolean;
  collectMeasures: boolean;
  collectResources: boolean;
  maxMetrics: number;
  reportInterval: number;
}

class PerformanceMetricsCollector {
  private config: TimingConfig;
  private logger = getLogger();
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private reportInterval: NodeJS.Timeout | null = null;
  private startTime: number;

  constructor(config?: Partial<TimingConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      collectMarks: true,
      collectMeasures: true,
      collectResources: false, // Disabled by default as it's mainly for web
      maxMetrics: 1000,
      reportInterval: 60000, // 1 minute
      ...config,
    };

    this.startTime = performance.now();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.logger.debug(
      'Performance metrics collector initializing',
      'PerformanceMetrics',
      {
        config: this.config,
      },
    );

    // Set up performance observer
    if (this.config.collectMarks || this.config.collectMeasures) {
      this.setupPerformanceObserver();
    }

    // Set up periodic reporting
    if (this.config.reportInterval > 0) {
      this.startPeriodicReporting();
    }

    this.logger.info(
      'Performance metrics collector initialized',
      'PerformanceMetrics',
    );
  }

  private setupPerformanceObserver(): void {
    try {
      const entryTypes: string[] = [];

      if (this.config.collectMarks) entryTypes.push('mark');
      if (this.config.collectMeasures) entryTypes.push('measure');
      if (this.config.collectResources) entryTypes.push('resource');

      this.observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        for (const entry of entries) {
          this.addMetric({
            name: entry.name,
            type: entry.entryType as PerformanceMetric['type'],
            startTime: entry.startTime,
            duration: entry.duration,
            timestamp: Date.now(),
            metadata: this.extractEntryMetadata(entry),
          });
        }
      });

      this.observer.observe({ entryTypes });

      this.logger.debug('Performance observer set up', 'PerformanceMetrics', {
        entryTypes,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to set up performance observer',
        'PerformanceMetrics',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  private extractEntryMetadata(entry: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Add common properties
    if (entry.detail !== undefined) metadata.detail = entry.detail;
    if (entry.entryType) metadata.entryType = entry.entryType;

    // Add resource-specific properties
    if (entry.entryType === 'resource') {
      metadata.transferSize = entry.transferSize;
      metadata.encodedBodySize = entry.encodedBodySize;
      metadata.decodedBodySize = entry.decodedBodySize;
    }

    return metadata;
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Trim metrics if we exceed the limit
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    this.logger.debug('Performance metric added', 'PerformanceMetrics', {
      name: metric.name,
      type: metric.type,
      duration: `${metric.duration.toFixed(2)}ms`,
    });
  }

  private startPeriodicReporting(): void {
    this.reportInterval = setInterval(() => {
      const report = this.generateReport();
      this.logReport(report);
    }, this.config.reportInterval);
  }

  /**
   * Create a performance mark
   */
  public mark(name: string, metadata?: Record<string, any>): void {
    if (!this.config.enabled) return;

    try {
      performance.mark(name);

      // Add custom metric with metadata
      if (metadata) {
        this.addMetric({
          name,
          type: 'mark',
          startTime: performance.now(),
          duration: 0,
          timestamp: Date.now(),
          metadata,
        });
      }
    } catch (error) {
      this.logger.warn(
        'Failed to create performance mark',
        'PerformanceMetrics',
        {
          name,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Create a performance measure between two marks
   */
  public measure(name: string, startMark: string, endMark?: string): number {
    if (!this.config.enabled) return 0;

    try {
      performance.measure(name, startMark, endMark);

      // Get the measure duration
      const measures = performance.getEntriesByName(name, 'measure');
      const latestMeasure = measures[measures.length - 1];

      return latestMeasure ? latestMeasure.duration : 0;
    } catch (error) {
      this.logger.warn(
        'Failed to create performance measure',
        'PerformanceMetrics',
        {
          name,
          startMark,
          endMark,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      return 0;
    }
  }

  /**
   * Time a function execution
   */
  public async timeFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>,
  ): Promise<T> {
    if (!this.config.enabled) {
      return await fn();
    }

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);

      const duration = this.measure(name, startMark, endMark);

      this.logger.debug('Function execution timed', 'PerformanceMetrics', {
        name,
        duration: `${duration.toFixed(2)}ms`,
        metadata,
      });

      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }

  /**
   * Create a timing wrapper for a function
   */
  public createTimingWrapper<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    metadata?: Record<string, any>,
  ): T {
    if (!this.config.enabled) {
      return fn;
    }

    return ((...args: Parameters<T>) => {
      return this.timeFunction(name, () => fn(...args), metadata);
    }) as T;
  }

  /**
   * Add a custom metric
   */
  public addCustomMetric(
    name: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    if (!this.config.enabled) return;

    this.addMetric({
      name,
      type: 'custom',
      startTime: performance.now() - duration,
      duration,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get metrics by type
   */
  public getMetricsByType(
    type: PerformanceMetric['type'],
  ): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get metrics within a time range
   */
  public getMetricsInRange(
    startTime: number,
    endTime: number,
  ): PerformanceMetric[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime,
    );
  }

  /**
   * Generate a performance report
   */
  public generateReport(timeRange?: {
    start: number;
    end: number;
  }): PerformanceReport {
    const reportMetrics = timeRange
      ? this.getMetricsInRange(timeRange.start, timeRange.end)
      : this.metrics;

    const measures = reportMetrics.filter(
      m => m.type === 'measure' || m.type === 'custom',
    );
    const totalDuration = measures.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration =
      measures.length > 0 ? totalDuration / measures.length : 0;

    const slowestOperation = measures.reduce(
      (slowest, current) =>
        !slowest || current.duration > slowest.duration ? current : slowest,
      null as PerformanceMetric | null,
    );

    const fastestOperation = measures.reduce(
      (fastest, current) =>
        !fastest || current.duration < fastest.duration ? current : fastest,
      null as PerformanceMetric | null,
    );

    // Group metrics by category (first part of name before '-' or '.')
    const categories: Record<string, PerformanceMetric[]> = {};
    for (const metric of reportMetrics) {
      const category = metric.name.split(/[-.]/, 1)[0] || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(metric);
    }

    return {
      timestamp: Date.now(),
      duration: performance.now() - this.startTime,
      metrics: reportMetrics,
      summary: {
        totalMeasures: measures.length,
        averageDuration,
        slowestOperation,
        fastestOperation,
      },
      categories,
    };
  }

  /**
   * Log a performance report
   */
  private logReport(report: PerformanceReport): void {
    const { summary, categories } = report;

    this.logger.info('Performance report', 'PerformanceMetrics', {
      totalMetrics: report.metrics.length,
      totalMeasures: summary.totalMeasures,
      averageDuration: `${summary.averageDuration.toFixed(2)}ms`,
      slowestOperation: summary.slowestOperation
        ? {
            name: summary.slowestOperation.name,
            duration: `${summary.slowestOperation.duration.toFixed(2)}ms`,
          }
        : null,
      fastestOperation: summary.fastestOperation
        ? {
            name: summary.fastestOperation.name,
            duration: `${summary.fastestOperation.duration.toFixed(2)}ms`,
          }
        : null,
      categories: Object.keys(categories).map(category => ({
        name: category,
        count: categories[category].length,
        avgDuration:
          categories[category].length > 0
            ? `${(categories[category].reduce((sum, m) => sum + m.duration, 0) / categories[category].length).toFixed(2)}ms`
            : '0ms',
      })),
    });
  }

  /**
   * Export performance data
   */
  public async exportPerformanceData(outputPath: string): Promise<void> {
    const report = this.generateReport();

    try {
      const fs = await import('fs-extra');
      await fs.writeJson(outputPath, report, { spaces: 2 });

      this.logger.info('Performance data exported', 'PerformanceMetrics', {
        outputPath,
        metricsCount: report.metrics.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Failed to export performance data',
        'PerformanceMetrics',
        {
          outputPath,
          error: errorMessage,
        },
      );
      throw error;
    }
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.length = 0;

    // Clear performance entries
    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch (error) {
      this.logger.warn(
        'Failed to clear performance entries',
        'PerformanceMetrics',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }

    this.logger.debug('Performance metrics cleared', 'PerformanceMetrics');
  }

  /**
   * Get current configuration
   */
  public getConfig(): TimingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<TimingConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    this.logger.debug(
      'Performance metrics config updated',
      'PerformanceMetrics',
      {
        updates,
        newConfig: this.config,
      },
    );

    // Restart observer if needed
    if (oldConfig.enabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.initialize();
      } else {
        this.shutdown();
      }
    }

    // Restart periodic reporting if interval changed
    if (oldConfig.reportInterval !== this.config.reportInterval) {
      if (this.reportInterval) {
        clearInterval(this.reportInterval);
        this.reportInterval = null;
      }

      if (this.config.reportInterval > 0 && this.config.enabled) {
        this.startPeriodicReporting();
      }
    }
  }

  /**
   * Shutdown the collector
   */
  public shutdown(): void {
    this.logger.info(
      'Performance metrics collector shutting down',
      'PerformanceMetrics',
    );

    // Stop observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Stop periodic reporting
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    // Log final report
    if (this.metrics.length > 0) {
      const finalReport = this.generateReport();
      this.logReport(finalReport);
    }
  }
}

// Singleton instance
let performanceMetricsInstance: PerformanceMetricsCollector | null = null;

export function createPerformanceMetricsCollector(
  config?: Partial<TimingConfig>,
): PerformanceMetricsCollector {
  if (!performanceMetricsInstance) {
    performanceMetricsInstance = new PerformanceMetricsCollector(config);
  }
  return performanceMetricsInstance;
}

export function getPerformanceMetricsCollector(): PerformanceMetricsCollector | null {
  return performanceMetricsInstance;
}

// Convenience functions for common operations
export function mark(name: string, metadata?: Record<string, any>): void {
  performanceMetricsInstance?.mark(name, metadata);
}

export function measure(
  name: string,
  startMark: string,
  endMark?: string,
): number {
  return performanceMetricsInstance?.measure(name, startMark, endMark) || 0;
}

export async function timeFunction<T>(
  name: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>,
): Promise<T> {
  if (performanceMetricsInstance) {
    return performanceMetricsInstance.timeFunction(name, fn, metadata);
  }
  return await fn();
}

export { PerformanceMetricsCollector };

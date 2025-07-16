/**
 * Frontend Performance Metrics Collection
 * Tracks and reports frontend performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

export interface NavigationTiming {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export interface PerformanceReport {
  timestamp: string;
  navigation: NavigationTiming;
  resources: ResourceTiming[];
  metrics: PerformanceMetric[];
  vitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
}

class PerformanceMetrics {
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private navigationTiming?: NavigationTiming;
  private vitals = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Initialize performance observers
    this.initializeNavigationObserver();
    this.initializeResourceObserver();
    this.initializeVitalsObserver();

    // Collect initial navigation timing
    this.collectNavigationTiming();

    // Set up periodic metrics collection
    this.startPeriodicCollection();
  }

  private initializeNavigationObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Failed to initialize navigation observer:', error);
    }
  }

  private initializeResourceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to initialize resource observer:', error);
    }
  }

  private initializeVitalsObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.lcp = lastEntry.startTime;
        this.recordMetric('lcp', lastEntry.startTime, 'timing');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.vitals.fid = entry.processingStart - entry.startTime;
          this.recordMetric('fid', this.vitals.fid, 'timing');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.vitals.cls += entry.value;
          }
        }
        this.recordMetric('cls', this.vitals.cls, 'gauge');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to initialize vitals observer:', error);
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.navigationTiming = {
      navigationStart: entry.navigationStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart,
      firstPaint: 0, // Will be updated by paint observer
      firstContentfulPaint: 0, // Will be updated by paint observer
      largestContentfulPaint: this.vitals.lcp,
      firstInputDelay: this.vitals.fid,
      cumulativeLayoutShift: this.vitals.cls,
    };

    // Record navigation metrics
    this.recordMetric('navigation_start', entry.navigationStart, 'timing');
    this.recordMetric(
      'dom_content_loaded',
      this.navigationTiming.domContentLoaded,
      'timing',
    );
    this.recordMetric(
      'load_complete',
      this.navigationTiming.loadComplete,
      'timing',
    );
    this.recordMetric(
      'ttfb',
      entry.responseStart - entry.navigationStart,
      'timing',
    );

    this.vitals.ttfb = entry.responseStart - entry.navigationStart;
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Record resource loading metrics
    this.recordMetric('resource_duration', entry.duration, 'timing', {
      resource_name: entry.name,
      resource_type: this.getResourceType(entry.name),
    });

    // Track large resources
    if (entry.transferSize && entry.transferSize > 100000) {
      // > 100KB
      this.recordMetric('large_resource', entry.transferSize, 'gauge', {
        resource_name: entry.name,
        size: entry.transferSize.toString(),
      });
    }
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
        return 'script';
      case 'css':
        return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      default:
        return 'other';
    }
  }

  private collectNavigationTiming(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const navigationStart = timing.navigationStart;

    // Collect paint metrics
    if ('getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') {
          this.vitals.fcp = entry.startTime;
          this.recordMetric('first_paint', entry.startTime, 'timing');
        } else if (entry.name === 'first-contentful-paint') {
          this.vitals.fcp = entry.startTime;
          this.recordMetric(
            'first_contentful_paint',
            entry.startTime,
            'timing',
          );
        }
      }
    }
  }

  private startPeriodicCollection(): void {
    // Collect memory metrics every 30 seconds
    setInterval(() => {
      this.collectMemoryMetrics();
    }, 30000);

    // Collect connection metrics every minute
    setInterval(() => {
      this.collectConnectionMetrics();
    }, 60000);
  }

  private collectMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;

      this.recordMetric('memory_used', memory.usedJSHeapSize, 'gauge');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'gauge');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'gauge');

      // Calculate memory usage percentage
      const memoryUsagePercent =
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      this.recordMetric('memory_usage_percent', memoryUsagePercent, 'gauge');
    }
  }

  private collectConnectionMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      this.recordMetric('connection_downlink', connection.downlink, 'gauge');
      this.recordMetric('connection_rtt', connection.rtt, 'gauge');
      this.recordMetric(
        'connection_effective_type',
        this.connectionTypeToNumber(connection.effectiveType),
        'gauge',
      );
    }
  }

  private connectionTypeToNumber(type: string): number {
    switch (type) {
      case 'slow-2g':
        return 1;
      case '2g':
        return 2;
      case '3g':
        return 3;
      case '4g':
        return 4;
      default:
        return 0;
    }
  }

  public recordMetric(
    name: string,
    value: number,
    type: 'timing' | 'counter' | 'gauge',
    tags?: Record<string, string>,
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getNavigationTiming(): NavigationTiming | undefined {
    return this.navigationTiming;
  }

  public getVitals() {
    return { ...this.vitals };
  }

  public generateReport(): PerformanceReport {
    const resources: ResourceTiming[] = [];

    if ('getEntriesByType' in performance) {
      const resourceEntries = performance.getEntriesByType(
        'resource',
      ) as PerformanceResourceTiming[];

      for (const entry of resourceEntries) {
        resources.push({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0,
          type: this.getResourceType(entry.name),
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      navigation: this.navigationTiming || {
        navigationStart: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
      },
      resources,
      metrics: this.getMetrics(),
      vitals: this.getVitals(),
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
let performanceMetricsInstance: PerformanceMetrics | null = null;

export function createPerformanceMetrics(): PerformanceMetrics {
  if (!performanceMetricsInstance) {
    performanceMetricsInstance = new PerformanceMetrics();
  }
  return performanceMetricsInstance;
}

export function getPerformanceMetrics(): PerformanceMetrics | null {
  return performanceMetricsInstance;
}

export { PerformanceMetrics };

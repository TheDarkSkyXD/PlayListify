/**
 * Lazy Component Loading Utilities
 * Provides optimized lazy loading for React components with performance monitoring
 */

import React, { ComponentType, LazyExoticComponent, Suspense } from 'react';
import { getPerformanceMetrics } from './performance-metrics';

export interface LazyComponentOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
}

export interface LazyComponentStats {
  name: string;
  loadTime: number;
  loadAttempts: number;
  lastLoadTime: number;
  errors: number;
  preloaded: boolean;
}

// Default loading fallback component
const DefaultFallback: React.FC = () => (
  <div className='flex items-center justify-center p-8'>
    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary'></div>
  </div>
);

// Default error boundary component
const DefaultErrorBoundary: React.FC<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <div className='flex flex-col items-center justify-center p-8 text-center'>
    <div className='mb-4 text-red-500'>
      <svg
        className='mx-auto mb-2 h-12 w-12'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
        />
      </svg>
      <p className='text-sm font-medium'>Failed to load component</p>
    </div>
    <p className='mb-4 text-xs text-muted-foreground'>{error.message}</p>
    <button
      onClick={retry}
      className='rounded bg-primary px-4 py-2 text-xs text-primary-foreground hover:bg-primary/90'
    >
      Retry
    </button>
  </div>
);

class LazyComponentManager {
  private stats: Map<string, LazyComponentStats> = new Map();
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private performanceMetrics = getPerformanceMetrics();

  /**
   * Create a lazy-loaded component with performance monitoring
   */
  public createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    name: string,
    options: LazyComponentOptions = {},
  ): LazyExoticComponent<T> {
    const {
      fallback = DefaultFallback,
      errorBoundary = DefaultErrorBoundary,
      preload = false,
      priority = 'medium',
      timeout = 10000,
    } = options;

    // Initialize stats
    this.stats.set(name, {
      name,
      loadTime: 0,
      loadAttempts: 0,
      lastLoadTime: 0,
      errors: 0,
      preloaded: false,
    });

    // Create enhanced import function with monitoring
    const enhancedImportFn = async (): Promise<{ default: T }> => {
      const startTime = Date.now();
      const stats = this.stats.get(name)!;

      stats.loadAttempts++;
      this.stats.set(name, stats);

      try {
        // Add timeout to import
        const importPromise = importFn();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Component ${name} load timeout`)),
            timeout,
          );
        });

        const result = await Promise.race([importPromise, timeoutPromise]);
        const loadTime = Date.now() - startTime;

        // Update stats
        stats.loadTime = loadTime;
        stats.lastLoadTime = Date.now();
        this.stats.set(name, stats);

        // Record performance metric
        this.performanceMetrics?.recordMetric(
          'component_load_time',
          loadTime,
          'timing',
          { component: name, priority },
        );

        return result;
      } catch (error) {
        const loadTime = Date.now() - startTime;
        stats.errors++;
        stats.lastLoadTime = Date.now();
        this.stats.set(name, stats);

        // Record error metric
        this.performanceMetrics?.recordMetric(
          'component_load_error',
          1,
          'counter',
          {
            component: name,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );

        throw error;
      }
    };

    // Create lazy component
    const LazyComponent = React.lazy(enhancedImportFn);

    // Preload if requested
    if (preload) {
      this.preloadComponent(name, enhancedImportFn);
    }

    // Return wrapped component with error boundary
    return LazyComponent;
  }

  /**
   * Preload a component
   */
  public async preloadComponent(
    name: string,
    importFn: () => Promise<{ default: any }>,
  ): Promise<void> {
    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name);
    }

    const preloadPromise = importFn()
      .then(() => {
        const stats = this.stats.get(name);
        if (stats) {
          stats.preloaded = true;
          this.stats.set(name, stats);
        }
      })
      .catch(error => {
        console.warn(`Failed to preload component ${name}:`, error);
      });

    this.preloadPromises.set(name, preloadPromise);
    return preloadPromise;
  }

  /**
   * Get component loading statistics
   */
  public getStats(): LazyComponentStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Get stats for a specific component
   */
  public getComponentStats(name: string): LazyComponentStats | undefined {
    return this.stats.get(name);
  }

  /**
   * Clear all statistics
   */
  public clearStats(): void {
    this.stats.clear();
    this.preloadPromises.clear();
  }
}

// Singleton instance
const lazyComponentManager = new LazyComponentManager();

/**
 * Create a lazy-loaded component with performance monitoring
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name: string,
  options?: LazyComponentOptions,
): LazyExoticComponent<T> {
  return lazyComponentManager.createLazyComponent(importFn, name, options);
}

/**
 * Preload a component for better performance
 */
export function preloadComponent(
  name: string,
  importFn: () => Promise<{ default: any }>,
): Promise<void> {
  return lazyComponentManager.preloadComponent(name, importFn);
}

/**
 * Higher-order component for lazy loading with error boundary
 */
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyComponentOptions = {},
): React.FC<P> {
  const { fallback = DefaultFallback, errorBoundary = DefaultErrorBoundary } =
    options;

  return function LazyWrapper(props: P) {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryKey, setRetryKey] = React.useState(0);

    const retry = React.useCallback(() => {
      setError(null);
      setRetryKey(prev => prev + 1);
    }, []);

    if (error) {
      const ErrorComponent = errorBoundary;
      return <ErrorComponent error={error} retry={retry} />;
    }

    return (
      <React.ErrorBoundary
        fallback={({ error }) => {
          setError(error);
          return null;
        }}
      >
        <Suspense fallback={<fallback />}>
          <LazyComponent key={retryKey} {...props} />
        </Suspense>
      </React.ErrorBoundary>
    );
  };
}

/**
 * Hook for accessing lazy component statistics
 */
export function useLazyComponentStats() {
  const [stats, setStats] = React.useState<LazyComponentStats[]>([]);

  React.useEffect(() => {
    const updateStats = () => {
      setStats(lazyComponentManager.getStats());
    };

    // Update stats initially
    updateStats();

    // Update stats periodically
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    getComponentStats: (name: string) =>
      lazyComponentManager.getComponentStats(name),
    clearStats: () => lazyComponentManager.clearStats(),
  };
}

/**
 * Utility for batch preloading components
 */
export async function preloadComponents(
  components: Array<{
    name: string;
    importFn: () => Promise<{ default: any }>;
    priority?: 'high' | 'medium' | 'low';
  }>,
): Promise<void> {
  // Sort by priority
  const sortedComponents = components.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (
      priorityOrder[a.priority || 'medium'] -
      priorityOrder[b.priority || 'medium']
    );
  });

  // Preload high priority components first
  const highPriority = sortedComponents.filter(c => c.priority === 'high');
  const mediumPriority = sortedComponents.filter(
    c => c.priority === 'medium' || !c.priority,
  );
  const lowPriority = sortedComponents.filter(c => c.priority === 'low');

  // Load high priority components immediately
  await Promise.all(
    highPriority.map(c =>
      lazyComponentManager.preloadComponent(c.name, c.importFn),
    ),
  );

  // Load medium priority components with slight delay
  setTimeout(() => {
    Promise.all(
      mediumPriority.map(c =>
        lazyComponentManager.preloadComponent(c.name, c.importFn),
      ),
    );
  }, 100);

  // Load low priority components with longer delay
  setTimeout(() => {
    Promise.all(
      lowPriority.map(c =>
        lazyComponentManager.preloadComponent(c.name, c.importFn),
      ),
    );
  }, 1000);
}

export { lazyComponentManager };

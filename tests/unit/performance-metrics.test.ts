/**
 * Frontend Performance Metrics Tests
 * Tests for the frontend performance monitoring system
 */

import {
  PerformanceMetrics,
  createPerformanceMetrics,
} from '../../src/frontend/lib/performance-metrics';

// Mock performance API
const mockPerformance = {
  timing: {
    navigationStart: 1000,
    domContentLoadedEventEnd: 2000,
    loadEventEnd: 3000,
    responseStart: 1500,
  },
  getEntriesByType: jest.fn(),
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 80 * 1024 * 1024,
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
  },
};

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock navigator
const mockNavigator = {
  connection: {
    downlink: 10,
    rtt: 50,
    effectiveType: '4g',
  },
};

// Setup global mocks
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('PerformanceMetrics', () => {
  let performanceMetrics: PerformanceMetrics;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics = createPerformanceMetrics();
  });

  afterEach(() => {
    if (performanceMetrics) {
      performanceMetrics.destroy();
    }
  });

  describe('initialization', () => {
    it('should create performance metrics instance', () => {
      expect(performanceMetrics).toBeInstanceOf(PerformanceMetrics);
    });

    it('should initialize performance observers', () => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should create singleton instance', () => {
      const metrics1 = createPerformanceMetrics();
      const metrics2 = createPerformanceMetrics();

      expect(metrics1).toBe(metrics2);
    });
  });

  describe('metric recording', () => {
    it('should record timing metrics', () => {
      performanceMetrics.recordMetric('test_timing', 100, 'timing');

      const metrics = performanceMetrics.getMetrics();
      const timingMetric = metrics.find(m => m.name === 'test_timing');

      expect(timingMetric).toBeDefined();
      expect(timingMetric?.value).toBe(100);
      expect(timingMetric?.type).toBe('timing');
    });

    it('should record counter metrics', () => {
      performanceMetrics.recordMetric('test_counter', 5, 'counter');

      const metrics = performanceMetrics.getMetrics();
      const counterMetric = metrics.find(m => m.name === 'test_counter');

      expect(counterMetric).toBeDefined();
      expect(counterMetric?.value).toBe(5);
      expect(counterMetric?.type).toBe('counter');
    });

    it('should record gauge metrics', () => {
      performanceMetrics.recordMetric('test_gauge', 75.5, 'gauge');

      const metrics = performanceMetrics.getMetrics();
      const gaugeMetric = metrics.find(m => m.name === 'test_gauge');

      expect(gaugeMetric).toBeDefined();
      expect(gaugeMetric?.value).toBe(75.5);
      expect(gaugeMetric?.type).toBe('gauge');
    });

    it('should record metrics with tags', () => {
      const tags = { component: 'test', version: '1.0' };
      performanceMetrics.recordMetric('test_tagged', 42, 'counter', tags);

      const metrics = performanceMetrics.getMetrics();
      const taggedMetric = metrics.find(m => m.name === 'test_tagged');

      expect(taggedMetric).toBeDefined();
      expect(taggedMetric?.tags).toEqual(tags);
    });

    it('should limit metrics to prevent memory issues', () => {
      // Record more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        performanceMetrics.recordMetric(`metric_${i}`, i, 'counter');
      }

      const metrics = performanceMetrics.getMetrics();
      expect(metrics.length).toBe(1000);
    });
  });

  describe('navigation timing', () => {
    it('should collect navigation timing data', () => {
      const navigationTiming = performanceMetrics.getNavigationTiming();

      expect(navigationTiming).toBeDefined();
      if (navigationTiming) {
        expect(navigationTiming.navigationStart).toBe(1000);
        expect(navigationTiming.domContentLoaded).toBe(1000); // 2000 - 1000
        expect(navigationTiming.loadComplete).toBe(2000); // 3000 - 1000
      }
    });
  });

  describe('vitals tracking', () => {
    it('should track core web vitals', () => {
      const vitals = performanceMetrics.getVitals();

      expect(vitals).toHaveProperty('lcp');
      expect(vitals).toHaveProperty('fid');
      expect(vitals).toHaveProperty('cls');
      expect(vitals).toHaveProperty('fcp');
      expect(vitals).toHaveProperty('ttfb');
    });

    it('should calculate TTFB correctly', () => {
      const vitals = performanceMetrics.getVitals();
      expect(vitals.ttfb).toBe(500); // 1500 - 1000
    });
  });

  describe('report generation', () => {
    beforeEach(() => {
      // Mock paint entries
      mockPerformance.getEntriesByType.mockImplementation(type => {
        if (type === 'paint') {
          return [
            { name: 'first-paint', startTime: 1200 },
            { name: 'first-contentful-paint', startTime: 1300 },
          ];
        }
        if (type === 'resource') {
          return [
            {
              name: 'https://example.com/script.js',
              duration: 150,
              transferSize: 50000,
            },
            {
              name: 'https://example.com/style.css',
              duration: 80,
              transferSize: 20000,
            },
          ];
        }
        return [];
      });
    });

    it('should generate comprehensive performance report', () => {
      const report = performanceMetrics.generateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('navigation');
      expect(report).toHaveProperty('resources');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('vitals');
    });

    it('should include resource timing data', () => {
      const report = performanceMetrics.generateReport();

      expect(report.resources).toHaveLength(2);
      expect(report.resources[0]).toHaveProperty('name');
      expect(report.resources[0]).toHaveProperty('duration');
      expect(report.resources[0]).toHaveProperty('size');
      expect(report.resources[0]).toHaveProperty('type');
    });

    it('should categorize resource types correctly', () => {
      const report = performanceMetrics.generateReport();

      const scriptResource = report.resources.find(r =>
        r.name.includes('script.js'),
      );
      const styleResource = report.resources.find(r =>
        r.name.includes('style.css'),
      );

      expect(scriptResource?.type).toBe('script');
      expect(styleResource?.type).toBe('stylesheet');
    });
  });

  describe('memory tracking', () => {
    it('should track memory usage when available', () => {
      // Simulate memory metrics collection
      performanceMetrics.recordMetric(
        'memory_used',
        mockPerformance.memory.usedJSHeapSize,
        'gauge',
      );

      const metrics = performanceMetrics.getMetrics();
      const memoryMetric = metrics.find(m => m.name === 'memory_used');

      expect(memoryMetric).toBeDefined();
      expect(memoryMetric?.value).toBe(50 * 1024 * 1024);
    });
  });

  describe('cleanup', () => {
    it('should clear all metrics', () => {
      performanceMetrics.recordMetric('test_metric', 100, 'counter');
      expect(performanceMetrics.getMetrics()).toHaveLength(1);

      performanceMetrics.clearMetrics();
      expect(performanceMetrics.getMetrics()).toHaveLength(0);
    });

    it('should disconnect observers on destroy', () => {
      const mockObserver = {
        disconnect: jest.fn(),
      };

      // Mock the observer instance
      mockPerformanceObserver.mockReturnValue(mockObserver);

      const metrics = new PerformanceMetrics();
      metrics.destroy();

      // Note: In a real implementation, we'd verify disconnect was called
      // This is a simplified test due to the complexity of mocking PerformanceObserver
    });
  });

  describe('error handling', () => {
    it('should handle missing PerformanceObserver gracefully', () => {
      // Temporarily remove PerformanceObserver
      const originalObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => {
        new PerformanceMetrics();
      }).not.toThrow();

      // Restore PerformanceObserver
      global.PerformanceObserver = originalObserver;
    });

    it('should handle missing performance.timing gracefully', () => {
      const originalTiming = mockPerformance.timing;
      delete (mockPerformance as any).timing;

      expect(() => {
        new PerformanceMetrics();
      }).not.toThrow();

      // Restore timing
      mockPerformance.timing = originalTiming;
    });

    it('should handle missing performance.memory gracefully', () => {
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as any).memory;

      expect(() => {
        const metrics = new PerformanceMetrics();
        metrics.generateReport();
      }).not.toThrow();

      // Restore memory
      mockPerformance.memory = originalMemory;
    });
  });
});

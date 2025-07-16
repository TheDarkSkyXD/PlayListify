/**
 * Performance Monitor Tests
 * Tests for the performance monitoring and optimization system
 */

import {
  PerformanceMonitor,
  createPerformanceMonitor,
} from '../../src/backend/services/performance-monitor';

// Mock the logger service
jest.mock('../../src/backend/services/logger-service', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock the performance service
jest.mock('../../src/backend/services/performance-service', () => ({
  createPerformanceService: jest.fn(() => ({
    getStartupMetrics: jest.fn(() => ({
      totalStartupTime: 2500,
      phases: {
        initialization: 500,
        serviceSetup: 800,
        windowCreation: 700,
        rendererLoad: 500,
      },
    })),
    getCurrentMemoryMetrics: jest.fn(() => ({
      process: {
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 80 * 1024 * 1024, // 80MB
      },
    })),
    getActiveAlerts: jest.fn(() => []),
    updateConfig: jest.fn(),
    shutdown: jest.fn(),
  })),
  getPerformanceService: jest.fn(() => null),
}));

// Mock the development service
jest.mock('../../src/backend/services/development-service', () => ({
  createDevelopmentService: jest.fn(() => ({
    updateConfig: jest.fn(),
    shutdown: jest.fn(),
    forceGarbageCollection: jest.fn(),
  })),
  getDevelopmentService: jest.fn(() => null),
}));

// Mock the lazy loading service
jest.mock('../../src/backend/services/lazy-loading-service', () => ({
  createLazyLoadingService: jest.fn(() => ({
    registerService: jest.fn(),
    getLoadingStats: jest.fn(() => ({
      totalServices: 3,
      loadedServices: 2,
      failedServices: 0,
      averageLoadTime: 150,
    })),
    updateConfig: jest.fn(),
    shutdown: jest.fn(),
  })),
  getLazyLoadingService: jest.fn(() => null),
}));

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor = createPerformanceMonitor({
      enabled: true,
      startupOptimization: true,
      memoryOptimization: true,
      lazyLoading: true,
      metricsCollection: true,
      alerting: true,
    });
  });

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.shutdown();
    }
  });

  describe('initialization', () => {
    it('should create performance monitor with default config', () => {
      const monitor = createPerformanceMonitor();
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should initialize with custom config', () => {
      const config = {
        enabled: false,
        startupOptimization: false,
        memoryOptimization: false,
      };

      const monitor = createPerformanceMonitor(config);
      const actualConfig = monitor.getConfig();

      expect(actualConfig.enabled).toBe(false);
      expect(actualConfig.startupOptimization).toBe(false);
      expect(actualConfig.memoryOptimization).toBe(false);
    });

    it('should initialize all services when enabled', async () => {
      const {
        createPerformanceService,
      } = require('../../src/backend/services/performance-service');
      const {
        createLazyLoadingService,
      } = require('../../src/backend/services/lazy-loading-service');

      await performanceMonitor.initialize();

      expect(createPerformanceService).toHaveBeenCalledWith({
        enabled: true,
        startupMonitoring: true,
        memoryTracking: true,
        metricsCollection: true,
        lazyLoading: true,
        optimizations: true,
      });

      expect(createLazyLoadingService).toHaveBeenCalledWith({
        enabled: true,
        maxConcurrentLoads: 3,
        loadTimeout: 30000,
      });
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = performanceMonitor.getConfig();

      expect(config).toEqual({
        enabled: true,
        startupOptimization: true,
        memoryOptimization: true,
        buildOptimization: false, // Should be false in test environment
        lazyLoading: true,
        metricsCollection: true,
        alerting: true,
      });
    });

    it('should update configuration', () => {
      const updates = {
        memoryOptimization: false,
        alerting: false,
      };

      performanceMonitor.updateConfig(updates);
      const config = performanceMonitor.getConfig();

      expect(config.memoryOptimization).toBe(false);
      expect(config.alerting).toBe(false);
    });
  });

  describe('report generation', () => {
    beforeEach(async () => {
      // Mock the services to return data
      const {
        getPerformanceService,
      } = require('../../src/backend/services/performance-service');
      const {
        getLazyLoadingService,
      } = require('../../src/backend/services/lazy-loading-service');

      getPerformanceService.mockReturnValue({
        getStartupMetrics: () => ({
          totalStartupTime: 2500,
          phases: {
            initialization: 500,
            serviceSetup: 800,
            windowCreation: 700,
            rendererLoad: 500,
          },
        }),
        getCurrentMemoryMetrics: () => ({
          process: {
            heapUsed: 50 * 1024 * 1024, // 50MB
            heapTotal: 80 * 1024 * 1024, // 80MB
          },
        }),
        getActiveAlerts: () => [],
      });

      getLazyLoadingService.mockReturnValue({
        getLoadingStats: () => ({
          totalServices: 3,
          loadedServices: 2,
          failedServices: 0,
          averageLoadTime: 150,
        }),
      });

      await performanceMonitor.initialize();
    });

    it('should generate performance report', async () => {
      const report = await performanceMonitor.generateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('startup');
      expect(report).toHaveProperty('memory');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('recommendations');

      expect(report.startup.totalTime).toBe(2500);
      expect(report.memory.current).toBe(50); // 50MB
      expect(report.services.total).toBe(3);
      expect(report.services.loaded).toBe(2);
    });

    it('should include recommendations in report', async () => {
      const report = await performanceMonitor.generateReport();

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing service data gracefully', async () => {
      const {
        getPerformanceService,
      } = require('../../src/backend/services/performance-service');
      getPerformanceService.mockReturnValue(null);

      const report = await performanceMonitor.generateReport();

      expect(report.startup.totalTime).toBe(0);
      expect(report.memory.current).toBe(0);
    });
  });

  describe('shutdown', () => {
    it('should shutdown all services', () => {
      const mockPerformanceService = {
        shutdown: jest.fn(),
      };
      const mockDevelopmentService = {
        shutdown: jest.fn(),
      };
      const mockLazyLoadingService = {
        shutdown: jest.fn(),
      };

      const {
        getPerformanceService,
      } = require('../../src/backend/services/performance-service');
      const {
        getDevelopmentService,
      } = require('../../src/backend/services/development-service');
      const {
        getLazyLoadingService,
      } = require('../../src/backend/services/lazy-loading-service');

      getPerformanceService.mockReturnValue(mockPerformanceService);
      getDevelopmentService.mockReturnValue(mockDevelopmentService);
      getLazyLoadingService.mockReturnValue(mockLazyLoadingService);

      performanceMonitor.shutdown();

      expect(mockPerformanceService.shutdown).toHaveBeenCalled();
      expect(mockDevelopmentService.shutdown).toHaveBeenCalled();
      expect(mockLazyLoadingService.shutdown).toHaveBeenCalled();
    });
  });
});

describe('Performance Monitor Integration', () => {
  it('should create singleton instance', () => {
    const monitor1 = createPerformanceMonitor();
    const monitor2 = createPerformanceMonitor();

    expect(monitor1).toBe(monitor2);
  });

  it('should handle initialization errors gracefully', async () => {
    const {
      createPerformanceService,
    } = require('../../src/backend/services/performance-service');
    createPerformanceService.mockImplementation(() => {
      throw new Error('Service initialization failed');
    });

    const monitor = createPerformanceMonitor({ enabled: true });

    await expect(monitor.initialize()).rejects.toThrow(
      'Service initialization failed',
    );
  });

  it('should skip initialization when disabled', async () => {
    const monitor = createPerformanceMonitor({ enabled: false });
    const {
      createPerformanceService,
    } = require('../../src/backend/services/performance-service');

    await monitor.initialize();

    expect(createPerformanceService).not.toHaveBeenCalled();
  });
});

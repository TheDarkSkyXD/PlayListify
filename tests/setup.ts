// tests/setup.ts

/**
 * Jest Test Setup
 * 
 * This file runs before each test file and sets up global test configuration.
 */

// Basic Jest setup without external dependencies

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);

// Mock Date.now for consistent timestamps in tests
const mockDate = new Date('2025-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock process.env for consistent testing
process.env.NODE_ENV = 'test';
process.env.ELECTRON_IS_DEV = '1';

// Mock Electron app paths globally
const mockElectronPaths = {
  userData: '/mock/userData',
  downloads: '/mock/downloads',
  documents: '/mock/documents',
  desktop: '/mock/desktop',
  temp: '/mock/temp',
  appData: '/mock/appData',
  home: '/mock/home',
  logs: '/mock/logs',
};

// Global mock for electron app.getPath
(global as any).mockElectronGetPath = jest.fn((name: string) => {
  return mockElectronPaths[name as keyof typeof mockElectronPaths] || '/mock/path';
});

// Mock timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0];
  if (typeof message === 'string') {
    if (message.includes('React Router')) return;
    if (message.includes('Warning: ')) return;
  }
  originalWarn.apply(console, args);
};

// Basic test utilities without complex type declarations

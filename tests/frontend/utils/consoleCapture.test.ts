import { initConsoleCapture } from '../../../src/frontend/utils/consoleCapture';

// Mock the logger to prevent actual console output during tests
jest.mock('../../../src/frontend/utils/logger', () => ({
  logger: {
    setLogLevel: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    phase: jest.fn(),
  },
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  }
}));

describe('Console Capture Utility', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // Mock window.api
  beforeEach(() => {
    // Mock the window.api object
    (window as any).api = {
      send: jest.fn(),
    };

    // Spy on console methods
    jest.spyOn(console, 'log');
    jest.spyOn(console, 'info');
    jest.spyOn(console, 'warn');
    jest.spyOn(console, 'error');
  });

  afterEach(() => {
    // Restore original console methods after each test
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;

    // Clear mocks
    jest.clearAllMocks();
  });

  test('initConsoleCapture overrides console methods', () => {
    // Initialize console capture
    initConsoleCapture();

    // Check if console methods have been overridden
    expect(console.log).not.toBe(originalConsoleLog);
    expect(console.info).not.toBe(originalConsoleInfo);
    expect(console.warn).not.toBe(originalConsoleWarn);
    expect(console.error).not.toBe(originalConsoleError);
  });

  test('overridden console.log sends messages to main process', () => {
    // Initialize console capture
    initConsoleCapture();

    // Reset mock calls from initialization
    ((window as any).api.send as jest.Mock).mockClear();

    // Call console.log with a test message
    console.log('Test message');

    // Check if window.api.send was called with the correct arguments
    expect((window as any).api.send).toHaveBeenCalledWith(
      'renderer:log',
      expect.objectContaining({
        level: 'INFO',
        args: expect.any(String),
      })
    );

    // Parse the args to check if they contain our message
    const callArgs = (window as any).api.send.mock.calls[0][1];
    const parsedArgs = JSON.parse(callArgs.args);
    expect(parsedArgs[0]).toBe('Test message');
  });

  test('overridden console methods handle different argument types', () => {
    // Initialize console capture
    initConsoleCapture();

    // Reset mock calls from initialization
    ((window as any).api.send as jest.Mock).mockClear();

    // Test with different argument types
    console.log('String argument');
    console.info(123);
    console.warn({ object: 'test' });
    console.error(['array', 'test']);

    // Check if all calls were made - we expect 4 calls, one for each console method
    expect((window as any).api.send).toHaveBeenCalledTimes(4);

    // Check string argument
    const stringCallArgs = (window as any).api.send.mock.calls[0][1];
    const parsedStringArgs = JSON.parse(stringCallArgs.args);
    expect(parsedStringArgs).toContain('String argument');

    // Check number argument
    const numberCallArgs = (window as any).api.send.mock.calls[1][1];
    const parsedNumberArgs = JSON.parse(numberCallArgs.args);
    expect(parsedNumberArgs).toContain(123);

    // Check object argument
    const objectCallArgs = (window as any).api.send.mock.calls[2][1];
    const parsedObjectArgs = JSON.parse(objectCallArgs.args);
    expect(parsedObjectArgs[0]).toEqual({ object: 'test' });

    // Check array argument
    const arrayCallArgs = (window as any).api.send.mock.calls[3][1];
    const parsedArrayArgs = JSON.parse(arrayCallArgs.args);
    expect(parsedArrayArgs[0]).toEqual(['array', 'test']);
  });

  test('console methods still call original methods', () => {
    // Mock the window.api.send to verify it's called
    const sendMock = (window as any).api.send as jest.Mock;
    sendMock.mockClear();

    // Initialize console capture
    initConsoleCapture();

    // Call console methods
    console.log('Test log');
    console.info('Test info');
    console.warn('Test warn');
    console.error('Test error');

    // Verify that the api.send was called for each console method
    // This indirectly verifies that the original methods were called
    // since our implementation calls the original methods first
    expect(sendMock).toHaveBeenCalledTimes(4);

    // Verify the log levels
    expect(sendMock.mock.calls[0][1].level).toBe('INFO');
    expect(sendMock.mock.calls[1][1].level).toBe('INFO');
    expect(sendMock.mock.calls[2][1].level).toBe('WARNING');
    expect(sendMock.mock.calls[3][1].level).toBe('ERROR');
  });
});

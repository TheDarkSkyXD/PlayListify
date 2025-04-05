import { initConsoleCapture } from '../../../src/frontend/utils/consoleCapture';

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
    expect(parsedArgs).toContain('Test message');
  });

  test('overridden console methods handle different argument types', () => {
    // Initialize console capture
    initConsoleCapture();

    // Test with different argument types
    console.log('String argument');
    console.info(123);
    console.warn({ object: 'test' });
    console.error(['array', 'test']);

    // Check if all calls were made
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
    // Create spies for the original methods
    const logSpy = jest.fn();
    const infoSpy = jest.fn();
    const warnSpy = jest.fn();
    const errorSpy = jest.fn();

    // Replace console methods with spies
    console.log = logSpy;
    console.info = infoSpy;
    console.warn = warnSpy;
    console.error = errorSpy;

    // Initialize console capture
    initConsoleCapture();

    // Call console methods
    console.log('Test log');
    console.info('Test info');
    console.warn('Test warn');
    console.error('Test error');

    // Check if original methods were called
    expect(logSpy).toHaveBeenCalledWith('Test log');
    expect(infoSpy).toHaveBeenCalledWith('Test info');
    expect(warnSpy).toHaveBeenCalledWith('Test warn');
    expect(errorSpy).toHaveBeenCalledWith('Test error');
  });
});

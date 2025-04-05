import fs from 'fs-extra';
import path from 'path';
import { initLogger, logToFile, getConsoleLogFilePath } from '../../../src/backend/services/logger';

// Mock the fs-extra and path modules
jest.mock('fs-extra');
jest.mock('path');

describe('Logger Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('initLogger creates log directories and files', () => {
    // Mock implementation for this test
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (fs.ensureDirSync as jest.Mock).mockImplementation(() => true);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => true);

    // Call the function to test
    initLogger();

    // Check if the directory was created
    expect(fs.ensureDirSync).toHaveBeenCalled();
    
    // Check if log files were initialized
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  test('logToFile formats and writes log messages correctly', () => {
    // Mock implementation
    (fs.appendFileSync as jest.Mock).mockImplementation(() => true);
    (path.join as jest.Mock).mockReturnValue('/mock/logs/consolelogs.txt');

    // Test with different types of arguments
    logToFile('INFO', 'Test message');
    logToFile('ERROR', { error: 'Test error' });
    logToFile('WARNING', 'Multiple', 'arguments', 123);

    // Check if appendFileSync was called with correctly formatted messages
    expect(fs.appendFileSync).toHaveBeenCalledTimes(3);
    
    // Get the calls to appendFileSync
    const calls = (fs.appendFileSync as jest.Mock).mock.calls;
    
    // Check first call (string argument)
    expect(calls[0][1]).toContain('[INFO] Test message');
    
    // Check second call (object argument)
    expect(calls[1][1]).toContain('[ERROR]');
    expect(calls[1][1]).toContain('{"error":"Test error"}');
    
    // Check third call (multiple arguments)
    expect(calls[2][1]).toContain('[WARNING] Multiple arguments 123');
  });

  test('getConsoleLogFilePath returns the correct path', () => {
    // Mock path
    const mockPath = '/mock/logs/consolelogs.txt';
    (path.join as jest.Mock).mockReturnValue(mockPath);
    
    // Initialize logger to set the path
    initLogger();
    
    // Get the path
    const result = getConsoleLogFilePath();
    
    // Check if the correct path is returned
    expect(result).toBe(mockPath);
  });
});

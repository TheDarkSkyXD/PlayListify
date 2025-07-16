/**
 * IPC Communication Tests
 * Tests for Inter-Process Communication between main and renderer processes
 */

import { createIPCTestEnvironment, testIPCRoundTrip, registerMockIPCHandlers } from '../utils/ipc-test-utils';

describe('IPC Test Utilities', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  afterEach(() => {
    ipcEnv.cleanup();
  });

  describe('MockIPCMain', () => {
    it('should register and invoke handlers', async () => {
      const mockHandler = jest.fn().mockResolvedValue('test result');
      
      ipcEnv.ipcMain.handle('test-channel', mockHandler);
      
      const result = await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg1', 'arg2');
      
      expect(result).toBe('test result');
      expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should track handler calls', async () => {
      const mockHandler = jest.fn().mockResolvedValue('result');
      
      ipcEnv.ipcMain.handle('test-channel', mockHandler);
      
      await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg1');
      await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg2');
      
      const calls = ipcEnv.ipcMain.getHandlerCalls('test-channel');
      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual(['arg1']);
      expect(calls[1]).toEqual(['arg2']);
    });

    it('should handle once handlers', async () => {
      const mockHandler = jest.fn().mockResolvedValue('result');
      
      ipcEnv.ipcMain.handleOnce('test-channel', mockHandler);
      
      await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg1');
      
      expect(mockHandler).toHaveBeenCalledWith('arg1');
      expect(ipcEnv.ipcMain.hasHandler('test-channel')).toBe(false);
    });

    it('should remove handlers', () => {
      const mockHandler = jest.fn();
      
      ipcEnv.ipcMain.handle('test-channel', mockHandler);
      expect(ipcEnv.ipcMain.hasHandler('test-channel')).toBe(true);
      
      ipcEnv.ipcMain.removeHandler('test-channel');
      expect(ipcEnv.ipcMain.hasHandler('test-channel')).toBe(false);
    });

    it('should list registered channels', () => {
      ipcEnv.ipcMain.handle('channel1', jest.fn());
      ipcEnv.ipcMain.handle('channel2', jest.fn());
      
      const channels = ipcEnv.ipcMain.getRegisteredChannels();
      expect(channels).toContain('channel1');
      expect(channels).toContain('channel2');
    });

    it('should clear handler calls', async () => {
      const mockHandler = jest.fn().mockResolvedValue('result');
      
      ipcEnv.ipcMain.handle('test-channel', mockHandler);
      await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg1');
      
      expect(ipcEnv.ipcMain.getHandlerCalls('test-channel')).toHaveLength(1);
      
      ipcEnv.ipcMain.clearHandlerCalls('test-channel');
      expect(ipcEnv.ipcMain.getHandlerCalls('test-channel')).toHaveLength(0);
    });

    it('should throw error for unregistered handlers', async () => {
      await expect(
        ipcEnv.ipcMain.invokeHandler('nonexistent-channel')
      ).rejects.toThrow('No handler registered for channel: nonexistent-channel');
    });
  });

  describe('MockIPCRenderer', () => {
    it('should invoke with mock responses', async () => {
      ipcEnv.ipcRenderer.mockResponse('test-channel', 'mock result');
      
      const result = await ipcEnv.ipcRenderer.invoke('test-channel', 'arg1');
      
      expect(result).toBe('mock result');
    });

    it('should track invoke calls', async () => {
      ipcEnv.ipcRenderer.mockResponse('test-channel', 'result');
      
      await ipcEnv.ipcRenderer.invoke('test-channel', 'arg1', 'arg2');
      
      const calls = ipcEnv.ipcRenderer.getInvokeCalls('test-channel');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual(['arg1', 'arg2']);
    });

    it('should handle function responses', async () => {
      const mockFunction = jest.fn().mockReturnValue('dynamic result');
      ipcEnv.ipcRenderer.mockResponse('test-channel', mockFunction);
      
      const result = await ipcEnv.ipcRenderer.invoke('test-channel', 'arg1');
      
      expect(result).toBe('dynamic result');
      expect(mockFunction).toHaveBeenCalledWith('arg1');
    });

    it('should mock errors', async () => {
      const mockError = new Error('Test error');
      ipcEnv.ipcRenderer.mockError('test-channel', mockError);
      
      await expect(
        ipcEnv.ipcRenderer.invoke('test-channel')
      ).rejects.toThrow('Test error');
    });

    it('should emit send events', () => {
      const sendListener = jest.fn();
      ipcEnv.ipcRenderer.on('send', sendListener);
      
      ipcEnv.ipcRenderer.send('test-channel', 'arg1', 'arg2');
      
      expect(sendListener).toHaveBeenCalledWith('test-channel', 'arg1', 'arg2');
    });

    it('should clear invoke calls', async () => {
      ipcEnv.ipcRenderer.mockResponse('test-channel', 'result');
      await ipcEnv.ipcRenderer.invoke('test-channel', 'arg1');
      
      expect(ipcEnv.ipcRenderer.getInvokeCalls('test-channel')).toHaveLength(1);
      
      ipcEnv.ipcRenderer.clearInvokeCalls('test-channel');
      expect(ipcEnv.ipcRenderer.getInvokeCalls('test-channel')).toHaveLength(0);
    });

    it('should reset all state', async () => {
      ipcEnv.ipcRenderer.mockResponse('test-channel', 'result');
      await ipcEnv.ipcRenderer.invoke('test-channel', 'arg1');
      
      ipcEnv.ipcRenderer.reset();
      
      expect(ipcEnv.ipcRenderer.getInvokeCalls('test-channel')).toHaveLength(0);
      
      // Should return null for unmocked channels after reset
      const result = await ipcEnv.ipcRenderer.invoke('test-channel');
      expect(result).toBeNull();
    });
  });

  describe('MockContextBridge', () => {
    it('should expose APIs in main world', () => {
      const api = {
        test: () => 'test result',
        getValue: (key: string) => `value for ${key}`,
      };
      
      ipcEnv.contextBridge.exposeInMainWorld('testAPI', api);
      
      expect(ipcEnv.contextBridge.hasExposedAPI('testAPI')).toBe(true);
      expect(ipcEnv.contextBridge.getExposedAPI('testAPI')).toBe(api);
    });

    it('should list exposed API keys', () => {
      ipcEnv.contextBridge.exposeInMainWorld('api1', {});
      ipcEnv.contextBridge.exposeInMainWorld('api2', {});
      
      const keys = ipcEnv.contextBridge.getExposedAPIKeys();
      expect(keys).toContain('api1');
      expect(keys).toContain('api2');
    });

    it('should clear exposed APIs', () => {
      ipcEnv.contextBridge.exposeInMainWorld('testAPI', {});
      expect(ipcEnv.contextBridge.hasExposedAPI('testAPI')).toBe(true);
      
      ipcEnv.contextBridge.clearExposedAPIs();
      expect(ipcEnv.contextBridge.hasExposedAPI('testAPI')).toBe(false);
    });
  });
});

describe('IPC Round-Trip Testing', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  afterEach(() => {
    ipcEnv.cleanup();
  });

  it('should test complete IPC round-trip', async () => {
    const mockHandler = jest.fn().mockResolvedValue('handler result');
    
    const result = await testIPCRoundTrip(
      ipcEnv.ipcMain,
      ipcEnv.ipcRenderer,
      'test-channel',
      mockHandler,
      'arg1',
      'arg2'
    );
    
    expect(result).toBe('handler result');
    expect(mockHandler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle async handlers', async () => {
    const mockHandler = jest.fn().mockImplementation(async (value: number) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return value * 2;
    });
    
    const result = await testIPCRoundTrip(
      ipcEnv.ipcMain,
      ipcEnv.ipcRenderer,
      'async-channel',
      mockHandler,
      5
    );
    
    expect(result).toBe(10);
    expect(mockHandler).toHaveBeenCalledWith(5);
  });

  it('should handle handler errors', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
    
    await expect(
      testIPCRoundTrip(
        ipcEnv.ipcMain,
        ipcEnv.ipcRenderer,
        'error-channel',
        mockHandler,
        'arg1'
      )
    ).rejects.toThrow('Handler error');
  });
});

describe('Mock IPC Handlers', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  afterEach(() => {
    ipcEnv.cleanup();
  });

  it('should register default mock handlers', () => {
    const handlers = registerMockIPCHandlers(ipcEnv.ipcMain);
    
    expect(ipcEnv.ipcMain.hasHandler('app:get-version')).toBe(true);
    expect(ipcEnv.ipcMain.hasHandler('settings:get')).toBe(true);
    expect(ipcEnv.ipcMain.hasHandler('fs:select-directory')).toBe(true);
    expect(ipcEnv.ipcMain.hasHandler('dependencies:check')).toBe(true);
    
    expect(handlers['app:get-version']).toBeDefined();
    expect(handlers['settings:get']).toBeDefined();
  });

  it('should use custom mock handlers', () => {
    const customHandlers = {
      'custom:handler': jest.fn().mockResolvedValue('custom result'),
    };
    
    registerMockIPCHandlers(ipcEnv.ipcMain, customHandlers);
    
    expect(ipcEnv.ipcMain.hasHandler('custom:handler')).toBe(true);
  });

  it('should invoke app handlers', async () => {
    registerMockIPCHandlers(ipcEnv.ipcMain);
    
    const version = await ipcEnv.ipcMain.invokeHandler('app:get-version');
    expect(version).toBe('1.0.0');
    
    await ipcEnv.ipcMain.invokeHandler('app:quit');
    await ipcEnv.ipcMain.invokeHandler('app:minimize');
    await ipcEnv.ipcMain.invokeHandler('app:maximize');
    
    // Should not throw
  });

  it('should invoke settings handlers', async () => {
    registerMockIPCHandlers(ipcEnv.ipcMain);
    
    const theme = await ipcEnv.ipcMain.invokeHandler('settings:get', 'theme');
    expect(theme).toBe('light');
    
    const language = await ipcEnv.ipcMain.invokeHandler('settings:get', 'language');
    expect(language).toBe('en');
    
    await ipcEnv.ipcMain.invokeHandler('settings:set', 'theme', 'dark');
    
    const allSettings = await ipcEnv.ipcMain.invokeHandler('settings:get-all');
    expect(allSettings).toEqual({});
    
    await ipcEnv.ipcMain.invokeHandler('settings:reset');
  });

  it('should invoke file system handlers', async () => {
    registerMockIPCHandlers(ipcEnv.ipcMain);
    
    const directory = await ipcEnv.ipcMain.invokeHandler('fs:select-directory');
    expect(directory).toBe('/mock/selected/directory');
    
    const exists = await ipcEnv.ipcMain.invokeHandler('fs:check-file-exists', '/path/to/file');
    expect(exists).toBe(true);
    
    await ipcEnv.ipcMain.invokeHandler('fs:create-directory', '/new/directory');
    
    const content = await ipcEnv.ipcMain.invokeHandler('fs:read-file', '/path/to/file');
    expect(content).toBe('mock file content');
    
    await ipcEnv.ipcMain.invokeHandler('fs:write-file', '/path/to/file', 'new content');
  });

  it('should invoke dependency handlers', async () => {
    registerMockIPCHandlers(ipcEnv.ipcMain);
    
    const status = await ipcEnv.ipcMain.invokeHandler('dependencies:check');
    expect(status).toEqual({
      ytdlp: { installed: true, version: '2023.01.06' },
      ffmpeg: { installed: true, version: '4.4.0' },
    });
    
    await ipcEnv.ipcMain.invokeHandler('dependencies:install', 'ytdlp');
  });
});

describe('IPC Error Handling', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  afterEach(() => {
    ipcEnv.cleanup();
  });

  it('should handle synchronous handler errors', async () => {
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Synchronous error');
    });
    
    ipcEnv.ipcMain.handle('error-channel', errorHandler);
    
    await expect(
      ipcEnv.ipcMain.invokeHandler('error-channel')
    ).rejects.toThrow('Synchronous error');
  });

  it('should handle asynchronous handler errors', async () => {
    const errorHandler = jest.fn().mockRejectedValue(new Error('Async error'));
    
    ipcEnv.ipcMain.handle('async-error-channel', errorHandler);
    
    await expect(
      ipcEnv.ipcMain.invokeHandler('async-error-channel')
    ).rejects.toThrow('Async error');
  });

  it('should handle renderer invoke errors', async () => {
    const mockError = new Error('Renderer error');
    ipcEnv.ipcRenderer.mockError('error-channel', mockError);
    
    await expect(
      ipcEnv.ipcRenderer.invoke('error-channel')
    ).rejects.toThrow('Renderer error');
  });
});

describe('IPC Performance Testing', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  afterEach(() => {
    ipcEnv.cleanup();
  });

  it('should handle multiple concurrent invocations', async () => {
    const handler = jest.fn().mockImplementation(async (value: number) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return value * 2;
    });
    
    ipcEnv.ipcMain.handle('concurrent-channel', handler);
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(ipcEnv.ipcMain.invokeHandler('concurrent-channel', i));
    }
    
    const results = await Promise.all(promises);
    
    expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    expect(handler).toHaveBeenCalledTimes(10);
  });

  it('should handle rapid sequential invocations', async () => {
    const handler = jest.fn().mockResolvedValue('result');
    
    ipcEnv.ipcMain.handle('rapid-channel', handler);
    
    for (let i = 0; i < 100; i++) {
      await ipcEnv.ipcMain.invokeHandler('rapid-channel', i);
    }
    
    expect(handler).toHaveBeenCalledTimes(100);
    
    const calls = ipcEnv.ipcMain.getHandlerCalls('rapid-channel');
    expect(calls).toHaveLength(100);
  });
});
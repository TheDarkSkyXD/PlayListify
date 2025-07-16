/**
 * IPC Testing Utilities
 * 
 * Utilities for testing IPC communication between main and renderer processes.
 */

import { EventEmitter } from 'events';

export interface MockIPCChannel {
  name: string;
  handler: (...args: any[]) => any;
  calls: any[][];
}

export class MockIPCMain extends EventEmitter {
  private handlers = new Map<string, MockIPCChannel>();

  handle(channel: string, handler: (...args: any[]) => any) {
    this.handlers.set(channel, {
      name: channel,
      handler,
      calls: [],
    });
  }

  handleOnce(channel: string, handler: (...args: any[]) => any) {
    const wrappedHandler = (...args: any[]) => {
      const result = handler(...args);
      this.removeHandler(channel);
      return result;
    };
    this.handle(channel, wrappedHandler);
  }

  removeHandler(channel: string) {
    this.handlers.delete(channel);
  }

  removeAllHandlers() {
    this.handlers.clear();
  }

  // Test utility methods
  async invokeHandler(channel: string, ...args: any[]) {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }

    handler.calls.push(args);
    return await handler.handler(...args);
  }

  getHandlerCalls(channel: string): any[][] {
    const handler = this.handlers.get(channel);
    return handler ? handler.calls : [];
  }

  hasHandler(channel: string): boolean {
    return this.handlers.has(channel);
  }

  getRegisteredChannels(): string[] {
    return Array.from(this.handlers.keys());
  }

  clearHandlerCalls(channel?: string) {
    if (channel) {
      const handler = this.handlers.get(channel);
      if (handler) {
        handler.calls = [];
      }
    } else {
      this.handlers.forEach(handler => {
        handler.calls = [];
      });
    }
  }
}

export class MockIPCRenderer extends EventEmitter {
  private mockResponses = new Map<string, any>();
  private invokeCalls = new Map<string, any[][]>();

  async invoke(channel: string, ...args: any[]): Promise<any> {
    // Record the call
    if (!this.invokeCalls.has(channel)) {
      this.invokeCalls.set(channel, []);
    }
    this.invokeCalls.get(channel)!.push(args);

    // Return mock response or throw if configured
    if (this.mockResponses.has(channel)) {
      const response = this.mockResponses.get(channel);
      if (response instanceof Error) {
        throw response;
      }
      return typeof response === 'function' ? response(...args) : response;
    }

    // Default response
    return Promise.resolve(null);
  }

  send(channel: string, ...args: any[]) {
    this.emit('send', channel, ...args);
  }

  sendSync(channel: string, ...args: any[]) {
    this.emit('sendSync', channel, ...args);
    return null;
  }

  // Test utility methods
  mockResponse(channel: string, response: any) {
    this.mockResponses.set(channel, response);
  }

  mockError(channel: string, error: Error) {
    this.mockResponses.set(channel, error);
  }

  getInvokeCalls(channel: string): any[][] {
    return this.invokeCalls.get(channel) || [];
  }

  clearInvokeCalls(channel?: string) {
    if (channel) {
      this.invokeCalls.delete(channel);
    } else {
      this.invokeCalls.clear();
    }
  }

  clearMockResponses() {
    this.mockResponses.clear();
  }

  reset() {
    this.clearInvokeCalls();
    this.clearMockResponses();
    this.removeAllListeners();
  }
}

export class MockContextBridge {
  private exposedAPIs = new Map<string, any>();

  exposeInMainWorld(apiKey: string, api: any) {
    this.exposedAPIs.set(apiKey, api);
  }

  // Test utility methods
  getExposedAPI(apiKey: string): any {
    return this.exposedAPIs.get(apiKey);
  }

  hasExposedAPI(apiKey: string): boolean {
    return this.exposedAPIs.has(apiKey);
  }

  getExposedAPIKeys(): string[] {
    return Array.from(this.exposedAPIs.keys());
  }

  clearExposedAPIs() {
    this.exposedAPIs.clear();
  }
}

/**
 * Creates a complete IPC testing environment
 */
export function createIPCTestEnvironment() {
  const mockIpcMain = new MockIPCMain();
  const mockIpcRenderer = new MockIPCRenderer();
  const mockContextBridge = new MockContextBridge();

  return {
    ipcMain: mockIpcMain,
    ipcRenderer: mockIpcRenderer,
    contextBridge: mockContextBridge,
    
    // Cleanup function
    cleanup() {
      mockIpcMain.removeAllHandlers();
      mockIpcRenderer.reset();
      mockContextBridge.clearExposedAPIs();
    },
  };
}

/**
 * Helper to test IPC round-trip communication
 */
export async function testIPCRoundTrip(
  ipcMain: MockIPCMain,
  ipcRenderer: MockIPCRenderer,
  channel: string,
  handler: (...args: any[]) => any,
  ...args: any[]
) {
  // Register handler
  ipcMain.handle(channel, handler);

  // Invoke from renderer
  const result = await ipcRenderer.invoke(channel, ...args);

  // Verify the call was made
  const calls = ipcMain.getHandlerCalls(channel);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toEqual(args);

  return result;
}

/**
 * Helper to create mock IPC handlers for testing
 */
export function createMockIPCHandlers() {
  return {
    // App handlers
    'app:get-version': jest.fn().mockResolvedValue('1.0.0'),
    'app:quit': jest.fn().mockResolvedValue(undefined),
    'app:minimize': jest.fn().mockResolvedValue(undefined),
    'app:maximize': jest.fn().mockResolvedValue(undefined),

    // Settings handlers
    'settings:get': jest.fn().mockImplementation((key: string) => {
      const mockSettings: Record<string, any> = {
        theme: 'light',
        language: 'en',
        downloadLocation: '/mock/downloads',
      };
      return Promise.resolve(mockSettings[key]);
    }),
    'settings:set': jest.fn().mockResolvedValue(undefined),
    'settings:get-all': jest.fn().mockResolvedValue({}),
    'settings:reset': jest.fn().mockResolvedValue(undefined),

    // File system handlers
    'fs:select-directory': jest.fn().mockResolvedValue('/mock/selected/directory'),
    'fs:check-file-exists': jest.fn().mockResolvedValue(true),
    'fs:create-directory': jest.fn().mockResolvedValue(undefined),
    'fs:read-file': jest.fn().mockResolvedValue('mock file content'),
    'fs:write-file': jest.fn().mockResolvedValue(undefined),

    // Dependency handlers
    'dependencies:check': jest.fn().mockResolvedValue({
      ytdlp: { installed: true, version: '2023.01.06' },
      ffmpeg: { installed: true, version: '4.4.0' },
    }),
    'dependencies:install': jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Helper to register mock IPC handlers
 */
export function registerMockIPCHandlers(ipcMain: MockIPCMain, handlers?: Record<string, jest.Mock>) {
  const mockHandlers = handlers || createMockIPCHandlers();
  
  Object.entries(mockHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  return mockHandlers;
}
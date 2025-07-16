// src/frontend/stores/store-test-utils.ts

import { act, renderHook } from '@testing-library/react';
import { StateCreator } from 'zustand';

/**
 * Test utilities for Zustand stores
 */

/**
 * Create a test store instance that doesn't persist to localStorage
 */
export const createTestStore = <T>(storeCreator: StateCreator<T>) => {
  // Mock localStorage for testing
  const mockStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  // Create store without persistence
  const { create } = require('zustand');
  return create<T>(storeCreator);
};

/**
 * Test helper to render a store hook with initial state
 */
export const renderStoreHook = <T, TResult>(
  hook: () => TResult,
  initialState?: Partial<T>,
) => {
  const result = renderHook(hook);

  if (initialState) {
    act(() => {
      // Apply initial state if provided
      // This would need to be customized based on the specific store
    });
  }

  return result;
};

/**
 * Mock store state for testing
 */
export const createMockStoreState = <T>(overrides: Partial<T> = {}): T => {
  const defaultState = {
    // Default mock state - customize based on your stores
  } as T;

  return { ...defaultState, ...overrides };
};

/**
 * Test helper to wait for store updates
 */
export const waitForStoreUpdate = async (
  store: { getState: () => any },
  predicate: (state: any) => boolean,
  timeout = 1000,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Store update timeout after ${timeout}ms`));
    }, timeout);

    const unsubscribe = store.subscribe?.((state: any) => {
      if (predicate(state)) {
        clearTimeout(timeoutId);
        unsubscribe?.();
        resolve();
      }
    });

    // Check immediately in case the condition is already met
    if (predicate(store.getState())) {
      clearTimeout(timeoutId);
      unsubscribe?.();
      resolve();
    }
  });
};

/**
 * Store action test helper
 */
export const testStoreAction = async <T>(
  store: { getState: () => T },
  action: () => void | Promise<void>,
  expectedStateChange: (prevState: T, newState: T) => boolean,
) => {
  const prevState = store.getState();

  await act(async () => {
    await action();
  });

  const newState = store.getState();

  if (!expectedStateChange(prevState, newState)) {
    throw new Error('Store state did not change as expected');
  }

  return { prevState, newState };
};

/**
 * Mock store dependencies for testing
 */
export const createMockStoreDependencies = () => ({
  localStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  sessionStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  window: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    matchMedia: jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  },
  document: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});

/**
 * Store performance test helper
 */
export const measureStorePerformance = async <T>(
  store: { getState: () => T },
  action: () => void | Promise<void>,
  iterations = 1000,
) => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    await act(async () => {
      await action();
    });

    const end = performance.now();
    times.push(end - start);
  }

  const average = times.reduce((sum, time) => sum + time, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    average,
    min,
    max,
    times,
  };
};

/**
 * Store memory usage test helper
 */
export const measureStoreMemoryUsage = <T>(
  store: { getState: () => T },
  action: () => void,
  iterations = 100,
) => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

  for (let i = 0; i < iterations; i++) {
    action();
  }

  // Force garbage collection if available
  if ((window as any).gc) {
    (window as any).gc();
  }

  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

  return {
    initialMemory,
    finalMemory,
    difference: finalMemory - initialMemory,
    averagePerIteration: (finalMemory - initialMemory) / iterations,
  };
};

/**
 * Store state snapshot utility for testing
 */
export const createStoreSnapshot = <T>(store: { getState: () => T }) => {
  const state = store.getState();
  return JSON.parse(JSON.stringify(state));
};

/**
 * Compare store states for testing
 */
export const compareStoreStates = <T>(
  state1: T,
  state2: T,
  ignorePaths: string[] = [],
): { equal: boolean; differences: string[] } => {
  const differences: string[] = [];

  const compare = (obj1: any, obj2: any, path = '') => {
    if (ignorePaths.includes(path)) return;

    if (obj1 === obj2) return;

    if (typeof obj1 !== typeof obj2) {
      differences.push(`${path}: type mismatch`);
      return;
    }

    if (obj1 === null || obj2 === null) {
      differences.push(`${path}: null mismatch`);
      return;
    }

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      const allKeys = new Set([...keys1, ...keys2]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;

        if (!(key in obj1)) {
          differences.push(`${newPath}: missing in first object`);
        } else if (!(key in obj2)) {
          differences.push(`${newPath}: missing in second object`);
        } else {
          compare(obj1[key], obj2[key], newPath);
        }
      }
    } else {
      differences.push(`${path}: value mismatch`);
    }
  };

  compare(state1, state2);

  return {
    equal: differences.length === 0,
    differences,
  };
};

/**
 * Store test suite generator
 */
export const createStoreTestSuite = <T>(
  storeName: string,
  storeHook: () => T,
  testCases: Array<{
    name: string;
    action: (store: T) => void | Promise<void>;
    expectedState?: Partial<T>;
    expectedChange?: (prevState: T, newState: T) => boolean;
  }>,
) => {
  return () => {
    describe(storeName, () => {
      testCases.forEach(({ name, action, expectedState, expectedChange }) => {
        it(name, async () => {
          const { result } = renderHook(storeHook);
          const prevState = { ...result.current };

          await act(async () => {
            await action(result.current);
          });

          const newState = result.current;

          if (expectedState) {
            expect(newState).toMatchObject(expectedState);
          }

          if (expectedChange) {
            expect(expectedChange(prevState, newState)).toBe(true);
          }
        });
      });
    });
  };
};

/**
 * Mock timers for store testing
 */
export const createMockTimers = () => {
  const timers = new Map<number, NodeJS.Timeout>();
  let timerId = 0;

  const mockSetTimeout = jest.fn((callback: () => void, delay: number) => {
    const id = ++timerId;
    const timer = setTimeout(() => {
      timers.delete(id);
      callback();
    }, delay);
    timers.set(id, timer);
    return id;
  });

  const mockClearTimeout = jest.fn((id: number) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  });

  const mockSetInterval = jest.fn((callback: () => void, delay: number) => {
    const id = ++timerId;
    const timer = setInterval(callback, delay);
    timers.set(id, timer);
    return id;
  });

  const mockClearInterval = jest.fn((id: number) => {
    const timer = timers.get(id);
    if (timer) {
      clearInterval(timer);
      timers.delete(id);
    }
  });

  const cleanup = () => {
    timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers.clear();
  };

  return {
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout,
    setInterval: mockSetInterval,
    clearInterval: mockClearInterval,
    cleanup,
  };
};

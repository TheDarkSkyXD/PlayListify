// src/frontend/stores/store-utils.ts

import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';

/**
 * Utility types for store creation
 */
export type StoreSlice<T> = StateCreator<T, [], [], T>;
export type PersistentStoreSlice<T> = StateCreator<T, [], [], T> & {
  persist?: PersistOptions<T>;
};

/**
 * Common store configuration
 */
export const STORE_CONFIG = {
  // Default persistence options
  persistence: {
    version: 1,
    migrate: (persistedState: any, version: number) => {
      // Handle store migrations here
      return persistedState;
    },
  },

  // Performance settings
  performance: {
    debounceMs: 100,
    throttleMs: 16, // ~60fps
  },

  // Storage limits
  limits: {
    maxHistorySize: 50,
    maxNotifications: 20,
    maxRecentItems: 100,
    maxSearchHistory: 10,
  },
} as const;

/**
 * Store action types for consistent naming
 */
export const STORE_ACTIONS = {
  // UI Actions
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_VIEW_MODE: 'SET_VIEW_MODE',

  // Playlist Actions
  CREATE_PLAYLIST: 'CREATE_PLAYLIST',
  UPDATE_PLAYLIST: 'UPDATE_PLAYLIST',
  DELETE_PLAYLIST: 'DELETE_PLAYLIST',
  IMPORT_PLAYLIST: 'IMPORT_PLAYLIST',
  EXPORT_PLAYLIST: 'EXPORT_PLAYLIST',
  DUPLICATE_PLAYLIST: 'DUPLICATE_PLAYLIST',

  // Filter Actions
  SET_SEARCH: 'SET_SEARCH',
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // Selection Actions
  SELECT_ITEM: 'SELECT_ITEM',
  DESELECT_ITEM: 'DESELECT_ITEM',
  SELECT_ALL: 'SELECT_ALL',
  CLEAR_SELECTION: 'CLEAR_SELECTION',

  // Modal Actions
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',

  // Notification Actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',

  // History Actions
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  UNDO: 'UNDO',
  REDO: 'REDO',
} as const;

/**
 * Utility function to create consistent action creators
 */
export const createAction = <T extends Record<string, any>>(
  type: string,
  payload?: T,
) => ({
  type,
  payload,
  timestamp: Date.now(),
});

/**
 * Debounce utility for store actions
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): T => {
  let timeout: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

/**
 * Throttle utility for store actions
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): T => {
  let inThrottle: boolean;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

/**
 * Deep merge utility for store state updates
 */
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T => {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key] as any);
    } else {
      result[key] = source[key] as any;
    }
  }

  return result;
};

/**
 * Utility to create a store selector with memoization
 */
export const createSelector = <TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean,
) => {
  let lastResult: TSelected;
  let lastState: TState;

  return (state: TState): TSelected => {
    if (state !== lastState) {
      const newResult = selector(state);

      if (!equalityFn || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }

      lastState = state;
    }

    return lastResult;
  };
};

/**
 * Utility to validate store state
 */
export const validateStoreState = <T>(
  state: T,
  schema: Record<keyof T, (value: any) => boolean>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    if (!validator((state as any)[key])) {
      errors.push(`Invalid value for ${key}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Store event emitter for cross-store communication
 */
class StoreEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in store event listener for ${event}:`, error);
      }
    });
  }

  off(event: string, listener?: Function) {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const storeEvents = new StoreEventEmitter();

/**
 * Store middleware for logging actions in development
 */
export const createLoggingMiddleware = <T>(
  storeName: string,
  enabled: boolean = process.env.NODE_ENV === 'development',
) => {
  return (config: StateCreator<T>) => (set: any, get: any, api: any) => {
    const loggedSet = (...args: any[]) => {
      if (enabled) {
        console.group(`🏪 ${storeName} State Update`);
        console.log('Previous State:', get());
        console.log('Update Args:', args);
      }

      const result = set(...args);

      if (enabled) {
        console.log('New State:', get());
        console.groupEnd();
      }

      return result;
    };

    return config(loggedSet, get, api);
  };
};

/**
 * Store middleware for performance monitoring
 */
export const createPerformanceMiddleware = <T>(
  storeName: string,
  enabled: boolean = process.env.NODE_ENV === 'development',
) => {
  return (config: StateCreator<T>) => (set: any, get: any, api: any) => {
    const performanceSet = (...args: any[]) => {
      if (enabled) {
        const startTime = performance.now();
        const result = set(...args);
        const endTime = performance.now();

        if (endTime - startTime > 10) {
          // Log slow updates
          console.warn(`⚠️ Slow ${storeName} update: ${endTime - startTime}ms`);
        }

        return result;
      }

      return set(...args);
    };

    return config(performanceSet, get, api);
  };
};

/**
 * Utility to create store subscriptions with cleanup
 */
export const createStoreSubscription = <T>(
  store: { subscribe: (listener: (state: T) => void) => () => void },
  selector: (state: T) => any,
  callback: (selectedState: any, previousState: any) => void,
) => {
  let previousSelected: any;

  const unsubscribe = store.subscribe(state => {
    const selected = selector(state);

    if (selected !== previousSelected) {
      callback(selected, previousSelected);
      previousSelected = selected;
    }
  });

  return unsubscribe;
};

/**
 * Utility to batch store updates
 */
export const batchStoreUpdates = (updates: (() => void)[]) => {
  // Use React's unstable_batchedUpdates if available
  if (typeof (window as any).React?.unstable_batchedUpdates === 'function') {
    (window as any).React.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  } else {
    // Fallback to setTimeout batching
    Promise.resolve().then(() => {
      updates.forEach(update => update());
    });
  }
};

/**
 * Store hydration utility for SSR/SSG
 */
export const hydrateStore = <T>(
  store: { setState: (state: Partial<T>) => void },
  hydratedState: Partial<T>,
) => {
  try {
    store.setState(hydratedState);
  } catch (error) {
    console.error('Failed to hydrate store:', error);
  }
};

/**
 * Utility to create computed values that update when dependencies change
 */
export const createComputed = <TDeps extends readonly any[], TResult>(
  dependencies: TDeps,
  compute: (...deps: TDeps) => TResult,
  equalityFn?: (a: TResult, b: TResult) => boolean,
): TResult => {
  // This would typically be implemented with a more sophisticated caching mechanism
  // For now, just compute on every call
  return compute(...dependencies);
};

/**
 * Type-safe store action dispatcher
 */
export interface StoreAction<T = any> {
  type: string;
  payload?: T;
  meta?: Record<string, any>;
}

export const createStoreDispatcher = <TActions extends Record<string, any>>(
  actions: TActions,
) => {
  return <K extends keyof TActions>(
    type: K,
    payload?: TActions[K],
  ): StoreAction<TActions[K]> => ({
    type: type as string,
    payload,
    meta: {
      timestamp: Date.now(),
    },
  });
};

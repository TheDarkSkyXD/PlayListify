/**
 * React Testing Utilities
 * 
 * Utilities for testing React components with proper providers and mocking.
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';

// Mock window.api for renderer process tests
const mockAPI = {
  // App operations
  app: {
    getVersion: jest.fn().mockResolvedValue('1.0.0'),
    quit: jest.fn().mockResolvedValue(undefined),
    minimize: jest.fn().mockResolvedValue(undefined),
    maximize: jest.fn().mockResolvedValue(undefined),
  },

  // Settings operations
  settings: {
    get: jest.fn().mockImplementation((key: string) => {
      const mockSettings: Record<string, any> = {
        theme: 'light',
        language: 'en',
        downloadLocation: '/mock/downloads',
      };
      return Promise.resolve(mockSettings[key]);
    }),
    set: jest.fn().mockResolvedValue(undefined),
    getAll: jest.fn().mockResolvedValue({}),
    reset: jest.fn().mockResolvedValue(undefined),
  },

  // File system operations
  fs: {
    selectDirectory: jest.fn().mockResolvedValue('/mock/selected/directory'),
    checkFileExists: jest.fn().mockResolvedValue(true),
    createDirectory: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('mock file content'),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },

  // Dependency operations
  dependencies: {
    check: jest.fn().mockResolvedValue({
      ytdlp: { installed: true, version: '2023.01.06' },
      ffmpeg: { installed: true, version: '4.4.0' },
    }),
    install: jest.fn().mockResolvedValue(undefined),
  },

  // Playlist operations (future)
  playlists: {},

  // Download operations (future)
  downloads: {},
};

// Set up global window.api mock
Object.defineProperty(window, 'api', {
  value: mockAPI,
  writable: true,
});

/**
 * Creates a test QueryClient with sensible defaults for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Creates a test router with memory history
 */
export function createTestRouter(initialEntries: string[] = ['/']) {
  const history = createMemoryHistory({
    initialEntries,
  });

  // Create a minimal route tree for testing
  const routeTree = {
    id: '__root__',
    path: '/',
    component: () => <div data-testid="test-root">Test Root</div>,
    children: [
      {
        id: '/dashboard',
        path: '/dashboard',
        component: () => <div data-testid="dashboard">Dashboard</div>,
      },
      {
        id: '/settings',
        path: '/settings',
        component: () => <div data-testid="settings">Settings</div>,
      },
      {
        id: '/playlists',
        path: '/playlists',
        component: () => <div data-testid="playlists">Playlists</div>,
      },
    ],
  };

  return createRouter({
    routeTree,
    history,
  });
}

/**
 * Test wrapper component that provides all necessary contexts
 */
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  router?: any;
  initialRoute?: string;
}

export function TestWrapper({ 
  children, 
  queryClient, 
  router,
  initialRoute = '/' 
}: TestWrapperProps) {
  const testQueryClient = queryClient || createTestQueryClient();
  const testRouter = router || createTestRouter([initialRoute]);

  return (
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={testRouter}>
        {children}
      </RouterProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that includes all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  router?: any;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & {
  queryClient: QueryClient;
  router: any;
} {
  const { queryClient, router, initialRoute, ...renderOptions } = options;
  
  const testQueryClient = queryClient || createTestQueryClient();
  const testRouter = router || createTestRouter(initialRoute ? [initialRoute] : ['/']);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper 
      queryClient={testQueryClient} 
      router={testRouter}
      initialRoute={initialRoute}
    >
      {children}
    </TestWrapper>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient: testQueryClient,
    router: testRouter,
  };
}

/**
 * Helper to mock API responses for specific tests
 */
export function mockAPIResponse(method: string, response: any, shouldReject = false) {
  const keys = method.split('.');
  let target = mockAPI as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  const finalKey = keys[keys.length - 1];
  
  if (shouldReject) {
    target[finalKey] = jest.fn().mockRejectedValue(response);
  } else {
    target[finalKey] = jest.fn().mockResolvedValue(response);
  }
}

/**
 * Helper to get API call history
 */
export function getAPICallHistory(method: string): any[][] {
  const keys = method.split('.');
  let target = mockAPI as any;
  
  for (const key of keys) {
    target = target[key];
    if (!target) {
      return [];
    }
  }
  
  return target.mock?.calls || [];
}

/**
 * Helper to clear all API mocks
 */
export function clearAPIMocks() {
  const clearMocksRecursively = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'function' && obj[key].mockClear) {
        obj[key].mockClear();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        clearMocksRecursively(obj[key]);
      }
    }
  };
  
  clearMocksRecursively(mockAPI);
}

/**
 * Helper to wait for React Query to settle
 */
export async function waitForQueryToSettle(queryClient: QueryClient) {
  await queryClient.getQueryCache().getAll().forEach(query => {
    if (query.state.fetchStatus === 'fetching') {
      return new Promise(resolve => {
        const unsubscribe = query.subscribe(() => {
          if (query.state.fetchStatus !== 'fetching') {
            unsubscribe();
            resolve(undefined);
          }
        });
      });
    }
  });
}

/**
 * Helper to create mock theme context
 */
export function createMockThemeContext() {
  return {
    theme: 'light' as const,
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
  };
}

/**
 * Helper to create mock settings context
 */
export function createMockSettingsContext() {
  return {
    settings: {
      theme: 'light' as const,
      language: 'en',
      downloadLocation: '/mock/downloads',
    },
    updateSetting: jest.fn(),
    resetSettings: jest.fn(),
    isLoading: false,
    error: null,
  };
}

/**
 * Custom matchers for testing
 */
export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const pass = received && document.body.contains(received);
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
  
  toHaveClass: (received: any, className: string) => {
    const pass = received && received.classList && received.classList.contains(className);
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass,
    };
  },
};

// Export the mock API for direct access in tests
export { mockAPI };
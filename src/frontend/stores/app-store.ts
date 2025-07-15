/**
 * Application-wide state management using Zustand
 * 
 * This store manages global application state that doesn't map directly to server state,
 * including UI state, user preferences, and application-level settings.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Application state interface
export interface AppState {
  // UI State
  isLoading: boolean;
  isSidebarOpen: boolean;
  currentView: string;
  
  // Theme and appearance
  theme: Theme;
  
  // Window state
  isMaximized: boolean;
  windowSize: { width: number; height: number };
  
  // Application status
  isOnline: boolean;
  lastSyncTime: Date | null;
  
  // Error handling
  globalError: string | null;
  notifications: Notification[];
  
  // Development
  debugMode: boolean;
}

// Notification interface
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after this many ms
  persistent?: boolean; // Don't auto-dismiss
}

// Application actions interface
export interface AppActions {
  // UI actions
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  
  // Theme actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Window actions
  setMaximized: (maximized: boolean) => void;
  setWindowSize: (size: { width: number; height: number }) => void;
  
  // Status actions
  setOnline: (online: boolean) => void;
  updateLastSyncTime: () => void;
  
  // Error handling actions
  setGlobalError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Development actions
  setDebugMode: (debug: boolean) => void;
  
  // Reset actions
  resetUIState: () => void;
  resetAll: () => void;
}

// Combined store type
export type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  // UI State
  isLoading: false,
  isSidebarOpen: true,
  currentView: 'dashboard',
  
  // Theme and appearance
  theme: 'system',
  
  // Window state
  isMaximized: false,
  windowSize: { width: 800, height: 600 },
  
  // Application status
  isOnline: true,
  lastSyncTime: null,
  
  // Error handling
  globalError: null,
  notifications: [],
  
  // Development
  debugMode: false,
};

// Create the store with middleware
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // UI actions
        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },
        
        toggleSidebar: () => {
          set((state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
          });
        },
        
        setSidebarOpen: (open: boolean) => {
          set((state) => {
            state.isSidebarOpen = open;
          });
        },
        
        setCurrentView: (view: string) => {
          set((state) => {
            state.currentView = view;
          });
        },
        
        // Theme actions
        setTheme: (theme: Theme) => {
          set((state) => {
            state.theme = theme;
          });
        },
        
        toggleTheme: () => {
          set((state) => {
            const currentTheme = state.theme;
            if (currentTheme === 'light') {
              state.theme = 'dark';
            } else if (currentTheme === 'dark') {
              state.theme = 'system';
            } else {
              state.theme = 'light';
            }
          });
        },
        
        // Window actions
        setMaximized: (maximized: boolean) => {
          set((state) => {
            state.isMaximized = maximized;
          });
        },
        
        setWindowSize: (size: { width: number; height: number }) => {
          set((state) => {
            state.windowSize = size;
          });
        },
        
        // Status actions
        setOnline: (online: boolean) => {
          set((state) => {
            state.isOnline = online;
          });
        },
        
        updateLastSyncTime: () => {
          set((state) => {
            state.lastSyncTime = new Date();
          });
        },
        
        // Error handling actions
        setGlobalError: (error: string | null) => {
          set((state) => {
            state.globalError = error;
          });
        },
        
        addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              timestamp: new Date(),
            };
            state.notifications.push(newNotification);
          });
        },
        
        removeNotification: (id: string) => {
          set((state) => {
            const index = state.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
              state.notifications.splice(index, 1);
            }
          });
        },
        
        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },
        
        // Development actions
        setDebugMode: (debug: boolean) => {
          set((state) => {
            state.debugMode = debug;
          });
        },
        
        // Reset actions
        resetUIState: () => {
          set((state) => {
            state.isLoading = false;
            state.currentView = 'dashboard';
            state.globalError = null;
            state.notifications = [];
          });
        },
        
        resetAll: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'playlistify-app-store',
        // Only persist certain parts of the state
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
          windowSize: state.windowSize,
          debugMode: state.debugMode,
        }),
      }
    ),
    {
      name: 'AppStore',
    }
  )
);

// Selectors for optimized component subscriptions
export const appSelectors = {
  // UI selectors
  isLoading: (state: AppStore) => state.isLoading,
  isSidebarOpen: (state: AppStore) => state.isSidebarOpen,
  currentView: (state: AppStore) => state.currentView,
  
  // Theme selectors
  theme: (state: AppStore) => state.theme,
  
  // Window selectors
  isMaximized: (state: AppStore) => state.isMaximized,
  windowSize: (state: AppStore) => state.windowSize,
  
  // Status selectors
  isOnline: (state: AppStore) => state.isOnline,
  lastSyncTime: (state: AppStore) => state.lastSyncTime,
  
  // Error selectors
  globalError: (state: AppStore) => state.globalError,
  notifications: (state: AppStore) => state.notifications,
  hasNotifications: (state: AppStore) => state.notifications.length > 0,
  
  // Development selectors
  debugMode: (state: AppStore) => state.debugMode,
};

// Utility hooks for common patterns
export const useAppLoading = () => useAppStore(appSelectors.isLoading);
export const useAppTheme = () => useAppStore(appSelectors.theme);
export const useAppNotifications = () => useAppStore(appSelectors.notifications);
export const useAppError = () => useAppStore(appSelectors.globalError);
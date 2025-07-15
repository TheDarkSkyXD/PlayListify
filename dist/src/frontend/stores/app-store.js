"use strict";
/**
 * Application-wide state management using Zustand
 *
 * This store manages global application state that doesn't map directly to server state,
 * including UI state, user preferences, and application-level settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppError = exports.useAppNotifications = exports.useAppTheme = exports.useAppLoading = exports.appSelectors = exports.useAppStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const immer_1 = require("zustand/middleware/immer");
// Initial state
const initialState = {
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
exports.useAppStore = (0, zustand_1.create)()((0, middleware_1.devtools)((0, middleware_1.persist)((0, immer_1.immer)((set, get) => ({
    ...initialState,
    // UI actions
    setLoading: (loading) => {
        set((state) => {
            state.isLoading = loading;
        });
    },
    toggleSidebar: () => {
        set((state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        });
    },
    setSidebarOpen: (open) => {
        set((state) => {
            state.isSidebarOpen = open;
        });
    },
    setCurrentView: (view) => {
        set((state) => {
            state.currentView = view;
        });
    },
    // Theme actions
    setTheme: (theme) => {
        set((state) => {
            state.theme = theme;
        });
    },
    toggleTheme: () => {
        set((state) => {
            const currentTheme = state.theme;
            if (currentTheme === 'light') {
                state.theme = 'dark';
            }
            else if (currentTheme === 'dark') {
                state.theme = 'system';
            }
            else {
                state.theme = 'light';
            }
        });
    },
    // Window actions
    setMaximized: (maximized) => {
        set((state) => {
            state.isMaximized = maximized;
        });
    },
    setWindowSize: (size) => {
        set((state) => {
            state.windowSize = size;
        });
    },
    // Status actions
    setOnline: (online) => {
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
    setGlobalError: (error) => {
        set((state) => {
            state.globalError = error;
        });
    },
    addNotification: (notification) => {
        set((state) => {
            const newNotification = {
                ...notification,
                id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                timestamp: new Date(),
            };
            state.notifications.push(newNotification);
        });
    },
    removeNotification: (id) => {
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
    setDebugMode: (debug) => {
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
})), {
    name: 'playlistify-app-store',
    // Only persist certain parts of the state
    partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
        windowSize: state.windowSize,
        debugMode: state.debugMode,
    }),
}), {
    name: 'AppStore',
}));
// Selectors for optimized component subscriptions
exports.appSelectors = {
    // UI selectors
    isLoading: (state) => state.isLoading,
    isSidebarOpen: (state) => state.isSidebarOpen,
    currentView: (state) => state.currentView,
    // Theme selectors
    theme: (state) => state.theme,
    // Window selectors
    isMaximized: (state) => state.isMaximized,
    windowSize: (state) => state.windowSize,
    // Status selectors
    isOnline: (state) => state.isOnline,
    lastSyncTime: (state) => state.lastSyncTime,
    // Error selectors
    globalError: (state) => state.globalError,
    notifications: (state) => state.notifications,
    hasNotifications: (state) => state.notifications.length > 0,
    // Development selectors
    debugMode: (state) => state.debugMode,
};
// Utility hooks for common patterns
const useAppLoading = () => (0, exports.useAppStore)(exports.appSelectors.isLoading);
exports.useAppLoading = useAppLoading;
const useAppTheme = () => (0, exports.useAppStore)(exports.appSelectors.theme);
exports.useAppTheme = useAppTheme;
const useAppNotifications = () => (0, exports.useAppStore)(exports.appSelectors.notifications);
exports.useAppNotifications = useAppNotifications;
const useAppError = () => (0, exports.useAppStore)(exports.appSelectors.globalError);
exports.useAppError = useAppError;
//# sourceMappingURL=app-store.js.map
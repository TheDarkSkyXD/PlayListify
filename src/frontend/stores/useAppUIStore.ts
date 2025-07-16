// src/frontend/stores/useAppUIStore.ts

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface NotificationSettings {
  enabled: boolean;
  position: NotificationPosition;
  duration: number;
  showProgress: boolean;
  soundEnabled: boolean;
  maxVisible: number;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigationVisible: boolean;
}

export interface PerformanceSettings {
  enableAnimations: boolean;
  enableTransitions: boolean;
  enableVirtualScrolling: boolean;
  maxCacheSize: number;
  prefetchEnabled: boolean;
}

export interface AppUIState {
  // Theme and appearance
  theme: Theme;
  systemTheme: 'light' | 'dark';
  language: Language;
  fontSize: number; // Base font size multiplier (0.8 - 1.5)

  // Layout preferences
  sidebarWidth: number;
  headerHeight: number;
  footerVisible: boolean;
  breadcrumbsVisible: boolean;

  // Notification settings
  notifications: NotificationSettings;

  // Accessibility settings
  accessibility: AccessibilitySettings;

  // Performance settings
  performance: PerformanceSettings;

  // Application state
  isOnline: boolean;
  isLoading: boolean;
  loadingMessage?: string;
  lastActivity: number;
  idleTimeout: number; // minutes

  // Window state
  windowFocused: boolean;
  windowSize: {
    width: number;
    height: number;
  };

  // Feature flags
  features: {
    [key: string]: boolean;
  };

  // User preferences
  preferences: {
    autoSave: boolean;
    confirmBeforeDelete: boolean;
    showTooltips: boolean;
    enableKeyboardShortcuts: boolean;
    rememberWindowState: boolean;
    enableTelemetry: boolean;
  };

  // Actions
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: Language) => void;
  setFontSize: (size: number) => void;

  // Layout actions
  setSidebarWidth: (width: number) => void;
  setHeaderHeight: (height: number) => void;
  toggleFooter: () => void;
  toggleBreadcrumbs: () => void;

  // Notification actions
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Accessibility actions
  updateAccessibilitySettings: (
    settings: Partial<AccessibilitySettings>,
  ) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;

  // Performance actions
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void;

  // Application state actions
  setOnlineStatus: (isOnline: boolean) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  updateLastActivity: () => void;
  setIdleTimeout: (minutes: number) => void;

  // Window state actions
  setWindowFocused: (focused: boolean) => void;
  setWindowSize: (width: number, height: number) => void;

  // Feature flag actions
  setFeature: (key: string, enabled: boolean) => void;
  toggleFeature: (key: string) => void;

  // Preference actions
  updatePreferences: (preferences: Partial<typeof this.preferences>) => void;

  // Computed getters
  getEffectiveTheme: () => 'light' | 'dark';
  isIdle: () => boolean;
  shouldShowAnimations: () => boolean;
  shouldShowTransitions: () => boolean;
}

// Default settings
const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  position: 'top-right',
  duration: 4000,
  showProgress: true,
  soundEnabled: false,
  maxVisible: 5,
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
  keyboardNavigationVisible: true,
};

const defaultPerformanceSettings: PerformanceSettings = {
  enableAnimations: true,
  enableTransitions: true,
  enableVirtualScrolling: true,
  maxCacheSize: 100, // MB
  prefetchEnabled: true,
};

const defaultPreferences = {
  autoSave: true,
  confirmBeforeDelete: true,
  showTooltips: true,
  enableKeyboardShortcuts: true,
  rememberWindowState: true,
  enableTelemetry: false,
};

// Create the store
export const useAppUIStore = create<AppUIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      theme: 'system',
      systemTheme: 'light',
      language: 'en',
      fontSize: 1.0,

      sidebarWidth: 280,
      headerHeight: 64,
      footerVisible: true,
      breadcrumbsVisible: true,

      notifications: defaultNotificationSettings,
      accessibility: defaultAccessibilitySettings,
      performance: defaultPerformanceSettings,

      isOnline: navigator.onLine,
      isLoading: false,
      loadingMessage: undefined,
      lastActivity: Date.now(),
      idleTimeout: 30, // 30 minutes

      windowFocused: true,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },

      features: {
        betaFeatures: false,
        advancedSearch: true,
        bulkOperations: true,
        exportFeatures: true,
        importProgress: true,
      },

      preferences: defaultPreferences,

      // Theme actions
      setTheme: theme =>
        set(state => {
          state.theme = theme;
        }),

      setSystemTheme: theme =>
        set(state => {
          state.systemTheme = theme;
        }),

      setLanguage: language =>
        set(state => {
          state.language = language;
        }),

      setFontSize: size =>
        set(state => {
          state.fontSize = Math.max(0.8, Math.min(1.5, size));
        }),

      // Layout actions
      setSidebarWidth: width =>
        set(state => {
          state.sidebarWidth = Math.max(200, Math.min(400, width));
        }),

      setHeaderHeight: height =>
        set(state => {
          state.headerHeight = Math.max(48, Math.min(80, height));
        }),

      toggleFooter: () =>
        set(state => {
          state.footerVisible = !state.footerVisible;
        }),

      toggleBreadcrumbs: () =>
        set(state => {
          state.breadcrumbsVisible = !state.breadcrumbsVisible;
        }),

      // Notification actions
      updateNotificationSettings: settings =>
        set(state => {
          state.notifications = { ...state.notifications, ...settings };
        }),

      // Accessibility actions
      updateAccessibilitySettings: settings =>
        set(state => {
          state.accessibility = { ...state.accessibility, ...settings };
        }),

      toggleReducedMotion: () =>
        set(state => {
          state.accessibility.reducedMotion =
            !state.accessibility.reducedMotion;
        }),

      toggleHighContrast: () =>
        set(state => {
          state.accessibility.highContrast = !state.accessibility.highContrast;
        }),

      // Performance actions
      updatePerformanceSettings: settings =>
        set(state => {
          state.performance = { ...state.performance, ...settings };
        }),

      // Application state actions
      setOnlineStatus: isOnline =>
        set(state => {
          state.isOnline = isOnline;
        }),

      setLoading: (isLoading, message) =>
        set(state => {
          state.isLoading = isLoading;
          state.loadingMessage = message;
        }),

      updateLastActivity: () =>
        set(state => {
          state.lastActivity = Date.now();
        }),

      setIdleTimeout: minutes =>
        set(state => {
          state.idleTimeout = Math.max(5, Math.min(120, minutes));
        }),

      // Window state actions
      setWindowFocused: focused =>
        set(state => {
          state.windowFocused = focused;
          if (focused) {
            state.lastActivity = Date.now();
          }
        }),

      setWindowSize: (width, height) =>
        set(state => {
          state.windowSize = { width, height };
        }),

      // Feature flag actions
      setFeature: (key, enabled) =>
        set(state => {
          state.features[key] = enabled;
        }),

      toggleFeature: key =>
        set(state => {
          state.features[key] = !state.features[key];
        }),

      // Preference actions
      updatePreferences: preferences =>
        set(state => {
          state.preferences = { ...state.preferences, ...preferences };
        }),

      // Computed getters
      getEffectiveTheme: () => {
        const state = get();
        if (state.theme === 'system') {
          return state.systemTheme;
        }
        return state.theme as 'light' | 'dark';
      },

      isIdle: () => {
        const state = get();
        const idleThreshold = state.idleTimeout * 60 * 1000; // Convert to milliseconds
        return Date.now() - state.lastActivity > idleThreshold;
      },

      shouldShowAnimations: () => {
        const state = get();
        return (
          state.performance.enableAnimations &&
          !state.accessibility.reducedMotion
        );
      },

      shouldShowTransitions: () => {
        const state = get();
        return (
          state.performance.enableTransitions &&
          !state.accessibility.reducedMotion
        );
      },
    })),
    {
      name: 'app-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Persist user preferences and settings
        theme: state.theme,
        language: state.language,
        fontSize: state.fontSize,
        sidebarWidth: state.sidebarWidth,
        headerHeight: state.headerHeight,
        footerVisible: state.footerVisible,
        breadcrumbsVisible: state.breadcrumbsVisible,
        notifications: state.notifications,
        accessibility: state.accessibility,
        performance: state.performance,
        idleTimeout: state.idleTimeout,
        features: state.features,
        preferences: state.preferences,
        // Conditionally persist window state
        ...(state.preferences.rememberWindowState && {
          windowSize: state.windowSize,
        }),
      }),
    },
  ),
);

// Selector hooks for better performance
export const useTheme = () =>
  useAppUIStore(state => ({
    theme: state.theme,
    systemTheme: state.systemTheme,
    effectiveTheme: state.getEffectiveTheme(),
  }));

export const useLanguage = () => useAppUIStore(state => state.language);

export const useNotificationSettings = () =>
  useAppUIStore(state => state.notifications);

export const useAccessibilitySettings = () =>
  useAppUIStore(state => state.accessibility);

export const usePerformanceSettings = () =>
  useAppUIStore(state => state.performance);

export const useAppLoading = () =>
  useAppUIStore(state => ({
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
  }));

export const useWindowState = () =>
  useAppUIStore(state => ({
    focused: state.windowFocused,
    size: state.windowSize,
  }));

export const useFeatureFlags = () => useAppUIStore(state => state.features);

export const useAppPreferences = () =>
  useAppUIStore(state => state.preferences);

// Hook for system theme detection
export const useSystemThemeDetection = () => {
  const { setSystemTheme } = useAppUIStore();

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setSystemTheme]);
};

// Hook for online status detection
export const useOnlineStatusDetection = () => {
  const { setOnlineStatus } = useAppUIStore();

  React.useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);
};

// Hook for window focus detection
export const useWindowFocusDetection = () => {
  const { setWindowFocused } = useAppUIStore();

  React.useEffect(() => {
    const handleFocus = () => setWindowFocused(true);
    const handleBlur = () => setWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [setWindowFocused]);
};

// Hook for window resize detection
export const useWindowResizeDetection = () => {
  const { setWindowSize } = useAppUIStore();

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [setWindowSize]);
};

// Hook for activity tracking
export const useActivityTracking = () => {
  const { updateLastActivity } = useAppUIStore();

  React.useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateLastActivity]);
};

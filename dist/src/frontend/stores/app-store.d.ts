/**
 * Application-wide state management using Zustand
 *
 * This store manages global application state that doesn't map directly to server state,
 * including UI state, user preferences, and application-level settings.
 */
export type Theme = 'light' | 'dark' | 'system';
export interface AppState {
    isLoading: boolean;
    isSidebarOpen: boolean;
    currentView: string;
    theme: Theme;
    isMaximized: boolean;
    windowSize: {
        width: number;
        height: number;
    };
    isOnline: boolean;
    lastSyncTime: Date | null;
    globalError: string | null;
    notifications: Notification[];
    debugMode: boolean;
}
export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
    persistent?: boolean;
}
export interface AppActions {
    setLoading: (loading: boolean) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setCurrentView: (view: string) => void;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    setMaximized: (maximized: boolean) => void;
    setWindowSize: (size: {
        width: number;
        height: number;
    }) => void;
    setOnline: (online: boolean) => void;
    updateLastSyncTime: () => void;
    setGlobalError: (error: string | null) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    setDebugMode: (debug: boolean) => void;
    resetUIState: () => void;
    resetAll: () => void;
}
export type AppStore = AppState & AppActions;
export declare const useAppStore: import("zustand").UseBoundStore<Omit<Omit<Omit<import("zustand").StoreApi<AppStore>, "setState" | "devtools"> & {
    setState(partial: AppStore | Partial<AppStore> | ((state: AppStore) => AppStore | Partial<AppStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: AppStore | ((state: AppStore) => AppStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AppStore, {
            theme: Theme;
            isSidebarOpen: boolean;
            windowSize: {
                width: number;
                height: number;
            };
            debugMode: boolean;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AppStore) => void) => () => void;
        onFinishHydration: (fn: (state: AppStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AppStore, {
            theme: Theme;
            isSidebarOpen: boolean;
            windowSize: {
                width: number;
                height: number;
            };
            debugMode: boolean;
        }>>;
    };
}, "setState"> & {
    setState(nextStateOrUpdater: AppStore | Partial<AppStore> | ((state: import("immer").WritableDraft<AppStore>) => void), shouldReplace?: false, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(nextStateOrUpdater: AppStore | ((state: import("immer").WritableDraft<AppStore>) => void), shouldReplace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
}>;
export declare const appSelectors: {
    isLoading: (state: AppStore) => boolean;
    isSidebarOpen: (state: AppStore) => boolean;
    currentView: (state: AppStore) => string;
    theme: (state: AppStore) => Theme;
    isMaximized: (state: AppStore) => boolean;
    windowSize: (state: AppStore) => {
        width: number;
        height: number;
    };
    isOnline: (state: AppStore) => boolean;
    lastSyncTime: (state: AppStore) => Date | null;
    globalError: (state: AppStore) => string | null;
    notifications: (state: AppStore) => Notification[];
    hasNotifications: (state: AppStore) => boolean;
    debugMode: (state: AppStore) => boolean;
};
export declare const useAppLoading: () => boolean;
export declare const useAppTheme: () => Theme;
export declare const useAppNotifications: () => Notification[];
export declare const useAppError: () => string | null;
//# sourceMappingURL=app-store.d.ts.map
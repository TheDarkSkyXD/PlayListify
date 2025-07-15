/**
 * TypeScript interfaces for Zustand store types
 *
 * This file defines all the types used for client-side state management
 * throughout the application.
 */
export interface BaseStore<T> {
    state: T;
    setState: (partial: Partial<T>) => void;
    resetState: () => void;
    getState: () => T;
    subscribe: (listener: (state: T) => void) => () => void;
}
export interface PersistConfig<T> {
    name: string;
    partialize?: (state: T) => Partial<T>;
    version?: number;
    migrate?: (persistedState: any, version: number) => T;
    merge?: (persistedState: any, currentState: T) => T;
}
export interface DevtoolsConfig {
    name: string;
    enabled?: boolean;
    trace?: boolean;
    traceLimit?: number;
}
export interface ImmerConfig {
    enablePatches?: boolean;
    enableMapSet?: boolean;
}
export interface UIState {
    isLoading: boolean;
    loadingMessage?: string;
    modals: {
        [key: string]: {
            isOpen: boolean;
            data?: any;
        };
    };
    sidebar: {
        isOpen: boolean;
        width: number;
        collapsed: boolean;
    };
    layout: {
        currentView: string;
        previousView?: string;
        breadcrumbs: Breadcrumb[];
    };
    selection: {
        selectedItems: string[];
        selectionMode: 'single' | 'multiple' | 'none';
        lastSelected?: string;
    };
    dragDrop: {
        isDragging: boolean;
        draggedItem?: any;
        dropTarget?: string;
        dragType?: string;
    };
}
export interface Breadcrumb {
    id: string;
    label: string;
    path: string;
    icon?: string;
}
export interface ThemeState {
    theme: 'light' | 'dark' | 'system';
    systemTheme: 'light' | 'dark';
    customColors?: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        foreground: string;
    };
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;
    highContrast: boolean;
    reducedMotion: boolean;
}
export interface WindowState {
    isMaximized: boolean;
    isMinimized: boolean;
    isFullscreen: boolean;
    size: {
        width: number;
        height: number;
    };
    position: {
        x: number;
        y: number;
    };
    alwaysOnTop: boolean;
    resizable: boolean;
    windows: {
        [id: string]: {
            type: string;
            isOpen: boolean;
            size: {
                width: number;
                height: number;
            };
            position: {
                x: number;
                y: number;
            };
        };
    };
}
export interface AppStatusState {
    isOnline: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
    lastSyncTime: Date | null;
    syncInProgress: boolean;
    pendingChanges: number;
    performance: {
        memoryUsage: number;
        cpuUsage: number;
        diskUsage: number;
        networkSpeed: number;
    };
    health: {
        status: 'healthy' | 'warning' | 'error';
        issues: HealthIssue[];
        lastCheck: Date;
    };
}
export interface HealthIssue {
    id: string;
    type: 'warning' | 'error';
    message: string;
    details?: string;
    timestamp: Date;
    resolved: boolean;
}
export interface NotificationState {
    notifications: Notification[];
    settings: {
        enabled: boolean;
        sound: boolean;
        desktop: boolean;
        duration: number;
        position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    };
}
export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    duration?: number;
    persistent?: boolean;
    actions?: NotificationAction[];
    data?: any;
}
export interface NotificationAction {
    id: string;
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
}
export interface FormState<T = any> {
    data: T;
    initialData: T;
    errors: Record<string, string[]>;
    touched: Record<string, boolean>;
    isValid: boolean;
    isSubmitting: boolean;
    isSubmitted: boolean;
    isDirty: boolean;
    fields: Record<string, FieldState>;
}
export interface FieldState {
    value: any;
    error?: string;
    touched: boolean;
    focused: boolean;
    disabled: boolean;
    required: boolean;
}
export interface SearchState {
    query: string;
    filters: Record<string, any>;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    history: SearchHistoryItem[];
    savedSearches: SavedSearch[];
    suggestions: string[];
    isSearching: boolean;
    lastSearchTime?: Date;
}
export interface SearchHistoryItem {
    id: string;
    query: string;
    filters: Record<string, any>;
    timestamp: Date;
    resultCount: number;
}
export interface SavedSearch {
    id: string;
    name: string;
    query: string;
    filters: Record<string, any>;
    createdAt: Date;
    lastUsed: Date;
}
export interface TaskState {
    activeTasks: Task[];
    taskHistory: Task[];
    taskQueue: Task[];
    isProcessing: boolean;
    totalProgress: number;
}
export interface Task {
    id: string;
    type: string;
    title: string;
    description?: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
    result?: any;
    metadata?: Record<string, any>;
}
export interface SettingsState {
    preferences: UserPreferences;
    application: ApplicationSettings;
    advanced: AdvancedSettings;
    isLoading: boolean;
    hasUnsavedChanges: boolean;
    lastSaved?: Date;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    numberFormat: string;
}
export interface ApplicationSettings {
    downloadLocation: string;
    tempDirectory: string;
    maxConcurrentDownloads: number;
    autoUpdate: boolean;
    startMinimized: boolean;
    closeToTray: boolean;
    notifications: boolean;
}
export interface AdvancedSettings {
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    maxLogFiles: number;
    cacheSize: number;
    networkTimeout: number;
    retryAttempts: number;
}
export interface CacheState {
    stats: {
        totalSize: number;
        itemCount: number;
        hitRate: number;
        missRate: number;
    };
    config: {
        maxSize: number;
        maxAge: number;
        cleanupInterval: number;
    };
    operations: {
        isClearing: boolean;
        lastCleared?: Date;
        autoCleanup: boolean;
    };
}
export interface DevState {
    debug: {
        enabled: boolean;
        level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
        showQueries: boolean;
        showMutations: boolean;
        showStores: boolean;
    };
    performance: {
        enabled: boolean;
        metrics: PerformanceMetric[];
        alerts: PerformanceAlert[];
    };
    features: Record<string, boolean>;
    mocks: {
        enabled: boolean;
        scenarios: Record<string, any>;
    };
}
export interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    threshold?: number;
}
export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'error';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
}
export interface RootStore {
    app: any;
    ui: UIState;
    theme: ThemeState;
    window: WindowState;
    status: AppStatusState;
    notifications: NotificationState;
    search: SearchState;
    tasks: TaskState;
    settings: SettingsState;
    cache: CacheState;
    dev?: DevState;
}
export interface StoreActions<T> {
    set: (partial: Partial<T>) => void;
    reset: () => void;
    load: () => Promise<void>;
    save: () => Promise<void>;
    validate: () => boolean;
    subscribe: (listener: (state: T) => void) => () => void;
    getSnapshot: () => T;
}
//# sourceMappingURL=store-types.d.ts.map
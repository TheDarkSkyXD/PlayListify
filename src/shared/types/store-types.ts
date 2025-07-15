/**
 * TypeScript interfaces for Zustand store types
 * 
 * This file defines all the types used for client-side state management
 * throughout the application.
 */

// Base store types
export interface BaseStore<T> {
  // State
  state: T;
  
  // Actions
  setState: (partial: Partial<T>) => void;
  resetState: () => void;
  
  // Utilities
  getState: () => T;
  subscribe: (listener: (state: T) => void) => () => void;
}

// Persistence configuration
export interface PersistConfig<T> {
  name: string;
  partialize?: (state: T) => Partial<T>;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  merge?: (persistedState: any, currentState: T) => T;
}

// Store middleware types
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

// UI state types
export interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
  
  // Modal states
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: any;
    };
  };
  
  // Sidebar state
  sidebar: {
    isOpen: boolean;
    width: number;
    collapsed: boolean;
  };
  
  // Layout state
  layout: {
    currentView: string;
    previousView?: string;
    breadcrumbs: Breadcrumb[];
  };
  
  // Selection state
  selection: {
    selectedItems: string[];
    selectionMode: 'single' | 'multiple' | 'none';
    lastSelected?: string;
  };
  
  // Drag and drop state
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

// Theme and appearance types
export interface ThemeState {
  // Current theme
  theme: 'light' | 'dark' | 'system';
  
  // System theme detection
  systemTheme: 'light' | 'dark';
  
  // Custom theme settings
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  
  // Font settings
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
}

// Window state types
export interface WindowState {
  // Window properties
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  
  // Window size and position
  size: {
    width: number;
    height: number;
  };
  
  position: {
    x: number;
    y: number;
  };
  
  // Window behavior
  alwaysOnTop: boolean;
  resizable: boolean;
  
  // Multi-window support (future)
  windows: {
    [id: string]: {
      type: string;
      isOpen: boolean;
      size: { width: number; height: number };
      position: { x: number; y: number };
    };
  };
}

// Application status types
export interface AppStatusState {
  // Connection status
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Sync status
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  pendingChanges: number;
  
  // Performance metrics
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkSpeed: number;
  };
  
  // Application health
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

// Notification types
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

// Form state types
export interface FormState<T = any> {
  // Form data
  data: T;
  initialData: T;
  
  // Validation
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValid: boolean;
  
  // Form status
  isSubmitting: boolean;
  isSubmitted: boolean;
  isDirty: boolean;
  
  // Field states
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

// Search state types
export interface SearchState {
  // Current search
  query: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Search history
  history: SearchHistoryItem[];
  
  // Saved searches
  savedSearches: SavedSearch[];
  
  // Search suggestions
  suggestions: string[];
  
  // Search status
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

// Task and progress types
export interface TaskState {
  // Active tasks
  activeTasks: Task[];
  
  // Task history
  taskHistory: Task[];
  
  // Task queue
  taskQueue: Task[];
  
  // Global task status
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

// Settings state types
export interface SettingsState {
  // User preferences
  preferences: UserPreferences;
  
  // Application settings
  application: ApplicationSettings;
  
  // Advanced settings
  advanced: AdvancedSettings;
  
  // Settings status
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

// Cache state types
export interface CacheState {
  // Cache statistics
  stats: {
    totalSize: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  };
  
  // Cache configuration
  config: {
    maxSize: number;
    maxAge: number;
    cleanupInterval: number;
  };
  
  // Cache operations
  operations: {
    isClearing: boolean;
    lastCleared?: Date;
    autoCleanup: boolean;
  };
}

// Development state types (dev mode only)
export interface DevState {
  // Debug information
  debug: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    showQueries: boolean;
    showMutations: boolean;
    showStores: boolean;
  };
  
  // Performance monitoring
  performance: {
    enabled: boolean;
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
  };
  
  // Feature flags
  features: Record<string, boolean>;
  
  // Mock data
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

// Store composition types
export interface RootStore {
  app: any; // Will be properly typed when stores are integrated
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

// Store action types
export interface StoreActions<T> {
  // Basic actions
  set: (partial: Partial<T>) => void;
  reset: () => void;
  
  // Async actions
  load: () => Promise<void>;
  save: () => Promise<void>;
  
  // Validation
  validate: () => boolean;
  
  // Utilities
  subscribe: (listener: (state: T) => void) => () => void;
  getSnapshot: () => T;
}
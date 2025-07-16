// src/frontend/stores/usePlaylistStore.ts

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for playlist operations
export type PlaylistOperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface PlaylistOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'import' | 'export' | 'duplicate';
  status: PlaylistOperationStatus;
  progress?: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface PlaylistImportState {
  isImporting: boolean;
  currentImport?: {
    id: string;
    url: string;
    playlistName?: string;
    progress: number;
    status:
      | 'validating'
      | 'fetching'
      | 'processing'
      | 'saving'
      | 'complete'
      | 'error';
    error?: string;
    canCancel: boolean;
  };
  recentImports: Array<{
    id: string;
    url: string;
    playlistName: string;
    importedAt: Date;
    success: boolean;
    error?: string;
  }>;
}

export interface PlaylistNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  createdAt: Date;
}

export interface PlaylistStoreState {
  // Operation tracking
  operations: PlaylistOperation[];

  // Import state
  import: PlaylistImportState;

  // Notifications
  notifications: PlaylistNotification[];

  // Clipboard/Copy state
  clipboard: {
    type?: 'playlist' | 'video';
    data?: any;
    operation?: 'copy' | 'cut';
  };

  // Undo/Redo state
  history: {
    undoStack: Array<{
      action: string;
      data: any;
      timestamp: Date;
    }>;
    redoStack: Array<{
      action: string;
      data: any;
      timestamp: Date;
    }>;
    maxHistorySize: number;
  };

  // Keyboard shortcuts state
  shortcuts: {
    enabled: boolean;
    customShortcuts: Record<string, string>;
  };

  // Actions
  // Operation management
  startOperation: (type: PlaylistOperation['type'], id?: string) => string;
  updateOperation: (id: string, updates: Partial<PlaylistOperation>) => void;
  completeOperation: (id: string, success: boolean, error?: string) => void;
  clearCompletedOperations: () => void;

  // Import management
  startImport: (url: string, playlistName?: string) => string;
  updateImportProgress: (
    progress: number,
    status?: PlaylistImportState['currentImport']['status'],
  ) => void;
  completeImport: (success: boolean, error?: string) => void;
  cancelImport: () => void;
  clearImportHistory: () => void;

  // Notification management
  addNotification: (
    notification: Omit<PlaylistNotification, 'id' | 'createdAt'>,
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Clipboard management
  copyToClipboard: (type: 'playlist' | 'video', data: any) => void;
  cutToClipboard: (type: 'playlist' | 'video', data: any) => void;
  clearClipboard: () => void;

  // History management
  addToHistory: (action: string, data: any) => void;
  undo: () => any | null;
  redo: () => any | null;
  clearHistory: () => void;

  // Shortcuts management
  setShortcutsEnabled: (enabled: boolean) => void;
  setCustomShortcut: (action: string, shortcut: string) => void;
  removeCustomShortcut: (action: string) => void;

  // Getters
  getActiveOperations: () => PlaylistOperation[];
  getOperationById: (id: string) => PlaylistOperation | null;
  isOperationActive: (type: PlaylistOperation['type']) => boolean;
  getNotificationCount: () => number;
  canUndo: () => boolean;
  canRedo: () => boolean;
  hasClipboardData: () => boolean;
}

// Create the store
export const usePlaylistStore = create<PlaylistStoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      operations: [],

      import: {
        isImporting: false,
        recentImports: [],
      },

      notifications: [],

      clipboard: {},

      history: {
        undoStack: [],
        redoStack: [],
        maxHistorySize: 50,
      },

      shortcuts: {
        enabled: true,
        customShortcuts: {},
      },

      // Operation management
      startOperation: (type, id) => {
        const operationId =
          id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        set(state => {
          state.operations.push({
            id: operationId,
            type,
            status: 'loading',
            startedAt: new Date(),
          });
        });

        return operationId;
      },

      updateOperation: (id, updates) => {
        set(state => {
          const operation = state.operations.find(op => op.id === id);
          if (operation) {
            Object.assign(operation, updates);
          }
        });
      },

      completeOperation: (id, success, error) => {
        set(state => {
          const operation = state.operations.find(op => op.id === id);
          if (operation) {
            operation.status = success ? 'success' : 'error';
            operation.error = error;
            operation.completedAt = new Date();
          }
        });
      },

      clearCompletedOperations: () => {
        set(state => {
          state.operations = state.operations.filter(
            op => op.status === 'loading',
          );
        });
      },

      // Import management
      startImport: (url, playlistName) => {
        const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        set(state => {
          state.import.isImporting = true;
          state.import.currentImport = {
            id: importId,
            url,
            playlistName,
            progress: 0,
            status: 'validating',
            canCancel: true,
          };
        });

        return importId;
      },

      updateImportProgress: (progress, status) => {
        set(state => {
          if (state.import.currentImport) {
            state.import.currentImport.progress = progress;
            if (status) {
              state.import.currentImport.status = status;
            }
            // Can't cancel during saving phase
            state.import.currentImport.canCancel = status !== 'saving';
          }
        });
      },

      completeImport: (success, error) => {
        set(state => {
          if (state.import.currentImport) {
            const currentImport = state.import.currentImport;

            // Add to recent imports
            state.import.recentImports.unshift({
              id: currentImport.id,
              url: currentImport.url,
              playlistName: currentImport.playlistName || 'Unknown Playlist',
              importedAt: new Date(),
              success,
              error,
            });

            // Keep only last 20 imports
            state.import.recentImports = state.import.recentImports.slice(
              0,
              20,
            );

            // Clear current import
            state.import.isImporting = false;
            state.import.currentImport = undefined;
          }
        });
      },

      cancelImport: () => {
        set(state => {
          if (state.import.currentImport?.canCancel) {
            state.import.isImporting = false;
            state.import.currentImport = undefined;
          }
        });
      },

      clearImportHistory: () => {
        set(state => {
          state.import.recentImports = [];
        });
      },

      // Notification management
      addNotification: notification => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        set(state => {
          state.notifications.push({
            ...notification,
            id,
            createdAt: new Date(),
          });
        });

        // Auto-remove non-persistent notifications
        if (!notification.persistent) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            set(state => {
              state.notifications = state.notifications.filter(
                n => n.id !== id,
              );
            });
          }, duration);
        }

        return id;
      },

      removeNotification: id => {
        set(state => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearAllNotifications: () => {
        set(state => {
          state.notifications = [];
        });
      },

      // Clipboard management
      copyToClipboard: (type, data) => {
        set(state => {
          state.clipboard = {
            type,
            data,
            operation: 'copy',
          };
        });
      },

      cutToClipboard: (type, data) => {
        set(state => {
          state.clipboard = {
            type,
            data,
            operation: 'cut',
          };
        });
      },

      clearClipboard: () => {
        set(state => {
          state.clipboard = {};
        });
      },

      // History management
      addToHistory: (action, data) => {
        set(state => {
          state.history.undoStack.push({
            action,
            data,
            timestamp: new Date(),
          });

          // Clear redo stack when new action is added
          state.history.redoStack = [];

          // Limit history size
          if (state.history.undoStack.length > state.history.maxHistorySize) {
            state.history.undoStack.shift();
          }
        });
      },

      undo: () => {
        const state = get();
        const lastAction =
          state.history.undoStack[state.history.undoStack.length - 1];

        if (lastAction) {
          set(draft => {
            draft.history.undoStack.pop();
            draft.history.redoStack.push(lastAction);
          });

          return lastAction;
        }

        return null;
      },

      redo: () => {
        const state = get();
        const nextAction =
          state.history.redoStack[state.history.redoStack.length - 1];

        if (nextAction) {
          set(draft => {
            draft.history.redoStack.pop();
            draft.history.undoStack.push(nextAction);
          });

          return nextAction;
        }

        return null;
      },

      clearHistory: () => {
        set(state => {
          state.history.undoStack = [];
          state.history.redoStack = [];
        });
      },

      // Shortcuts management
      setShortcutsEnabled: enabled => {
        set(state => {
          state.shortcuts.enabled = enabled;
        });
      },

      setCustomShortcut: (action, shortcut) => {
        set(state => {
          state.shortcuts.customShortcuts[action] = shortcut;
        });
      },

      removeCustomShortcut: action => {
        set(state => {
          delete state.shortcuts.customShortcuts[action];
        });
      },

      // Getters
      getActiveOperations: () => {
        const state = get();
        return state.operations.filter(op => op.status === 'loading');
      },

      getOperationById: id => {
        const state = get();
        return state.operations.find(op => op.id === id) || null;
      },

      isOperationActive: type => {
        const state = get();
        return state.operations.some(
          op => op.type === type && op.status === 'loading',
        );
      },

      getNotificationCount: () => {
        const state = get();
        return state.notifications.length;
      },

      canUndo: () => {
        const state = get();
        return state.history.undoStack.length > 0;
      },

      canRedo: () => {
        const state = get();
        return state.history.redoStack.length > 0;
      },

      hasClipboardData: () => {
        const state = get();
        return !!state.clipboard.type && !!state.clipboard.data;
      },
    })),
    {
      name: 'playlist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Persist only non-transient state
        shortcuts: state.shortcuts,
        import: {
          recentImports: state.import.recentImports,
        },
        // Don't persist operations, notifications, clipboard, or history
      }),
    },
  ),
);

// Selector hooks for better performance
export const usePlaylistOperations = () =>
  usePlaylistStore(state => state.operations);

export const useActiveOperations = () =>
  usePlaylistStore(state => state.getActiveOperations());

export const useImportState = () => usePlaylistStore(state => state.import);

export const useNotifications = () =>
  usePlaylistStore(state => state.notifications);

export const useClipboard = () => usePlaylistStore(state => state.clipboard);

export const useHistoryState = () =>
  usePlaylistStore(state => ({
    canUndo: state.canUndo(),
    canRedo: state.canRedo(),
    undoCount: state.history.undoStack.length,
    redoCount: state.history.redoStack.length,
  }));

export const useShortcuts = () => usePlaylistStore(state => state.shortcuts);

// Custom hooks for common operations
export const usePlaylistOperationTracker = () => {
  const { startOperation, updateOperation, completeOperation } =
    usePlaylistStore();

  const trackOperation = React.useCallback(
    async <T>(
      type: PlaylistOperation['type'],
      operation: () => Promise<T>,
      onProgress?: (progress: number) => void,
    ): Promise<T> => {
      const operationId = startOperation(type);

      try {
        if (onProgress) {
          updateOperation(operationId, { progress: 0 });
        }

        const result = await operation();

        if (onProgress) {
          updateOperation(operationId, { progress: 100 });
        }

        completeOperation(operationId, true);
        return result;
      } catch (error) {
        completeOperation(
          operationId,
          false,
          error instanceof Error ? error.message : 'Unknown error',
        );
        throw error;
      }
    },
    [startOperation, updateOperation, completeOperation],
  );

  return { trackOperation };
};

// Hook for managing notifications with common patterns
export const useNotificationManager = () => {
  const { addNotification, removeNotification } = usePlaylistStore();

  const showSuccess = React.useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification({
        type: 'success',
        title,
        message,
        duration,
      });
    },
    [addNotification],
  );

  const showError = React.useCallback(
    (title: string, message: string, persistent = false) => {
      return addNotification({
        type: 'error',
        title,
        message,
        persistent,
      });
    },
    [addNotification],
  );

  const showWarning = React.useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification({
        type: 'warning',
        title,
        message,
        duration,
      });
    },
    [addNotification],
  );

  const showInfo = React.useCallback(
    (title: string, message: string, duration?: number) => {
      return addNotification({
        type: 'info',
        title,
        message,
        duration,
      });
    },
    [addNotification],
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
};

// Hook for keyboard shortcuts
export const usePlaylistKeyboardShortcuts = () => {
  const { shortcuts } = usePlaylistStore();
  const { undo, redo } = usePlaylistStore();

  React.useEffect(() => {
    if (!shortcuts.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (
        ((event.ctrlKey || event.metaKey) &&
          event.key === 'z' &&
          event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        redo();
        return;
      }

      // Check custom shortcuts
      const shortcutKey = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`;

      for (const [action, customShortcut] of Object.entries(
        shortcuts.customShortcuts,
      )) {
        if (customShortcut === shortcutKey) {
          event.preventDefault();
          // Emit custom event for the action
          window.dispatchEvent(new CustomEvent(`playlist-shortcut:${action}`));
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, undo, redo]);
};

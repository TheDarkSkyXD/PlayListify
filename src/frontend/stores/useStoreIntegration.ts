// src/frontend/stores/useStoreIntegration.ts

import React from 'react';
import { useAppUIStore } from './useAppUIStore';
import { useModalStore } from './useModalStore';
import { useNotificationManager, usePlaylistStore } from './usePlaylistStore';
import { usePlaylistUIStore } from './usePlaylistUIStore';

/**
 * Integration hook that provides coordinated access to all stores
 * and handles cross-store interactions
 */
export const useStoreIntegration = () => {
  // Store selectors
  const appUI = useAppUIStore();
  const modal = useModalStore();
  const playlistUI = usePlaylistUIStore();
  const playlist = usePlaylistStore();

  // Notification manager
  const notifications = useNotificationManager();

  // Coordinated actions that involve multiple stores
  const coordinatedActions = React.useMemo(
    () => ({
      /**
       * Create a new playlist with full UI coordination
       */
      createPlaylistWithUI: async (data: {
        title: string;
        description?: string;
        type: 'custom' | 'youtube';
      }) => {
        try {
          // Start operation tracking
          const operationId = playlist.startOperation('create');

          // Show loading state
          appUI.setLoading(true, 'Creating playlist...');

          // TODO: Call actual playlist creation service via IPC
          // For now, simulate the operation
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Complete operation
          playlist.completeOperation(operationId, true);

          // Show success notification
          notifications.showSuccess(
            'Playlist Created',
            `"${data.title}" has been created successfully`,
          );

          // Add to history for undo functionality
          playlist.addToHistory('CREATE_PLAYLIST', data);

          // Clear any active filters to show the new playlist
          if (playlistUI.hasActiveFilters()) {
            playlistUI.clearFilters();
          }

          return true;
        } catch (error) {
          // Handle error
          const operationId = playlist
            .getActiveOperations()
            .find(op => op.type === 'create')?.id;
          if (operationId) {
            playlist.completeOperation(
              operationId,
              false,
              error instanceof Error ? error.message : 'Unknown error',
            );
          }

          notifications.showError(
            'Creation Failed',
            'Failed to create playlist',
          );
          return false;
        } finally {
          appUI.setLoading(false);
        }
      },

      /**
       * Import YouTube playlist with progress tracking
       */
      importYouTubePlaylistWithUI: async (url: string) => {
        try {
          // Start import process
          const importId = playlist.startImport(url);

          // Show import modal
          modal.showImportProgressModal({ jobId: importId, playlistUrl: url });

          // Simulate import progress
          const progressSteps = [
            {
              progress: 10,
              status: 'validating' as const,
              message: 'Validating URL...',
            },
            {
              progress: 30,
              status: 'fetching' as const,
              message: 'Fetching playlist data...',
            },
            {
              progress: 60,
              status: 'processing' as const,
              message: 'Processing videos...',
            },
            {
              progress: 90,
              status: 'saving' as const,
              message: 'Saving to database...',
            },
            {
              progress: 100,
              status: 'complete' as const,
              message: 'Import complete!',
            },
          ];

          for (const step of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            playlist.updateImportProgress(step.progress, step.status);
            appUI.setLoading(true, step.message);
          }

          // Complete import
          playlist.completeImport(true);

          // Close modal and show success
          modal.closeModal();
          notifications.showSuccess(
            'Import Complete',
            'YouTube playlist imported successfully',
          );

          return true;
        } catch (error) {
          playlist.completeImport(
            false,
            error instanceof Error ? error.message : 'Import failed',
          );
          notifications.showError(
            'Import Failed',
            'Failed to import YouTube playlist',
          );
          return false;
        } finally {
          appUI.setLoading(false);
        }
      },

      /**
       * Delete playlist with confirmation
       */
      deletePlaylistWithConfirmation: async (
        playlistId: string,
        playlistName: string,
      ) => {
        return new Promise<boolean>(resolve => {
          modal.showConfirmDialog({
            title: 'Delete Playlist',
            message: `Are you sure you want to delete "${playlistName}"? This action cannot be undone.`,
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
              try {
                const operationId = playlist.startOperation(
                  'delete',
                  playlistId,
                );
                appUI.setLoading(true, 'Deleting playlist...');

                // TODO: Call actual delete service
                await new Promise(resolve => setTimeout(resolve, 500));

                playlist.completeOperation(operationId, true);
                notifications.showSuccess(
                  'Playlist Deleted',
                  `"${playlistName}" has been deleted`,
                );

                // Remove from selection if selected
                if (playlistUI.isSelected(playlistId)) {
                  playlistUI.deselectPlaylist(playlistId);
                }

                // Add to history for potential undo
                playlist.addToHistory('DELETE_PLAYLIST', {
                  id: playlistId,
                  name: playlistName,
                });

                resolve(true);
              } catch (error) {
                notifications.showError(
                  'Delete Failed',
                  'Failed to delete playlist',
                );
                resolve(false);
              } finally {
                appUI.setLoading(false);
              }
            },
            onCancel: () => resolve(false),
          });
        });
      },

      /**
       * Bulk delete selected playlists
       */
      bulkDeletePlaylists: async () => {
        const selectedIds = Array.from(playlistUI.selection.selectedIds);
        if (selectedIds.length === 0) return false;

        return new Promise<boolean>(resolve => {
          modal.showConfirmDialog({
            title: 'Delete Playlists',
            message: `Are you sure you want to delete ${selectedIds.length} playlist(s)? This action cannot be undone.`,
            variant: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            onConfirm: async () => {
              try {
                const operationId = playlist.startOperation('delete');
                appUI.setLoading(
                  true,
                  `Deleting ${selectedIds.length} playlists...`,
                );

                // TODO: Call actual bulk delete service
                await new Promise(resolve => setTimeout(resolve, 1000));

                playlist.completeOperation(operationId, true);
                notifications.showSuccess(
                  'Playlists Deleted',
                  `${selectedIds.length} playlists have been deleted`,
                );

                // Clear selection
                playlistUI.deselectAll();

                resolve(true);
              } catch (error) {
                notifications.showError(
                  'Bulk Delete Failed',
                  'Failed to delete playlists',
                );
                resolve(false);
              } finally {
                appUI.setLoading(false);
              }
            },
            onCancel: () => resolve(false),
          });
        });
      },

      /**
       * Handle application-wide undo
       */
      performUndo: () => {
        const lastAction = playlist.undo();
        if (lastAction) {
          notifications.showInfo('Undo', `Undid: ${lastAction.action}`);
          // TODO: Implement actual undo logic based on action type
          return true;
        }
        return false;
      },

      /**
       * Handle application-wide redo
       */
      performRedo: () => {
        const nextAction = playlist.redo();
        if (nextAction) {
          notifications.showInfo('Redo', `Redid: ${nextAction.action}`);
          // TODO: Implement actual redo logic based on action type
          return true;
        }
        return false;
      },

      /**
       * Reset all UI state to defaults
       */
      resetUIState: () => {
        playlistUI.clearFilters();
        playlistUI.deselectAll();
        playlistUI.setCurrentPage(1);
        playlistUI.setViewMode('grid');
        modal.closeAllModals();
        playlist.clearAllNotifications();
        notifications.showInfo(
          'UI Reset',
          'All UI state has been reset to defaults',
        );
      },

      /**
       * Toggle theme with notification
       */
      toggleThemeWithFeedback: () => {
        const currentTheme = appUI.getEffectiveTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        appUI.setTheme(newTheme);
        notifications.showInfo(
          'Theme Changed',
          `Switched to ${newTheme} theme`,
        );
      },
    }),
    [appUI, modal, playlistUI, playlist, notifications],
  );

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      // Only handle shortcuts when no modal is open and shortcuts are enabled
      if (modal.isAnyModalOpen() || !playlist.shortcuts.enabled) return;

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd + N: New playlist
      if (isCtrlOrCmd && event.key === 'n') {
        event.preventDefault();
        modal.showCreatePlaylistModal();
        return;
      }

      // Ctrl/Cmd + I: Import playlist
      if (isCtrlOrCmd && event.key === 'i') {
        event.preventDefault();
        modal.showYouTubeImportModal();
        return;
      }

      // Ctrl/Cmd + A: Select all playlists
      if (isCtrlOrCmd && event.key === 'a') {
        event.preventDefault();
        // TODO: Get current playlist IDs and select all
        return;
      }

      // Delete: Delete selected playlists
      if (event.key === 'Delete' && playlistUI.selection.selectedIds.size > 0) {
        event.preventDefault();
        coordinatedActions.bulkDeletePlaylists();
        return;
      }

      // F2: Rename selected playlist
      if (event.key === 'F2' && playlistUI.selection.selectedIds.size === 1) {
        event.preventDefault();
        const selectedId = Array.from(playlistUI.selection.selectedIds)[0];
        // TODO: Open rename modal
        return;
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        if (playlistUI.selection.selectedIds.size > 0) {
          event.preventDefault();
          playlistUI.deselectAll();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleGlobalShortcuts);
    return () => document.removeEventListener('keydown', handleGlobalShortcuts);
  }, [
    modal,
    playlist.shortcuts.enabled,
    playlistUI.selection.selectedIds,
    coordinatedActions,
  ]);

  // Cross-store state synchronization
  React.useEffect(() => {
    // Sync loading states
    const hasActiveOperations = playlist.getActiveOperations().length > 0;
    if (hasActiveOperations !== appUI.isLoading) {
      appUI.setLoading(
        hasActiveOperations,
        hasActiveOperations ? 'Processing...' : undefined,
      );
    }
  }, [playlist.operations, appUI.isLoading]);

  // Return combined store interface
  return {
    // Individual stores
    appUI,
    modal,
    playlistUI,
    playlist,

    // Coordinated actions
    actions: coordinatedActions,

    // Computed state
    computed: {
      isAnyOperationActive: playlist.getActiveOperations().length > 0,
      hasSelection: playlistUI.selection.selectedIds.size > 0,
      selectedCount: playlistUI.selection.selectedIds.size,
      hasActiveFilters: playlistUI.hasActiveFilters(),
      canUndo: playlist.canUndo(),
      canRedo: playlist.canRedo(),
      notificationCount: playlist.getNotificationCount(),
      isImporting: playlist.import.isImporting,
      currentTheme: appUI.getEffectiveTheme(),
      isOnline: appUI.isOnline,
    },

    // Utility functions
    utils: {
      clearAllState: () => {
        coordinatedActions.resetUIState();
        playlist.clearHistory();
        playlist.clearImportHistory();
      },
      exportState: async () => {
        return {
          appUI: appUI,
          playlistUI: playlistUI,
          timestamp: new Date().toISOString(),
        };
      },
    },
  };
};

/**
 * Hook for components that only need read access to store state
 */
export const useStoreState = () => {
  const integration = useStoreIntegration();

  return {
    computed: integration.computed,
    appUI: {
      theme: integration.appUI.getEffectiveTheme(),
      language: integration.appUI.language,
      isLoading: integration.appUI.isLoading,
      loadingMessage: integration.appUI.loadingMessage,
      isOnline: integration.appUI.isOnline,
    },
    playlistUI: {
      viewMode: integration.playlistUI.viewMode,
      sortBy: integration.playlistUI.sortBy,
      sortOrder: integration.playlistUI.sortOrder,
      filters: integration.playlistUI.filters,
      selection: integration.playlistUI.selection,
      currentPage: integration.playlistUI.currentPage,
    },
    modal: {
      isAnyOpen: integration.modal.isAnyModalOpen(),
      topModal: integration.modal.getTopModal(),
      modalCount: integration.modal.getModalCount(),
    },
    playlist: {
      operations: integration.playlist.operations,
      notifications: integration.playlist.notifications,
      import: integration.playlist.import,
      clipboard: integration.playlist.clipboard,
    },
  };
};

/**
 * Hook for components that need action access
 */
export const useStoreActions = () => {
  const integration = useStoreIntegration();

  return integration.actions;
};

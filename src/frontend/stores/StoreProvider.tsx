// src/frontend/stores/StoreProvider.tsx

import React from 'react';
import {
  useActivityTracking,
  useOnlineStatusDetection,
  useSystemThemeDetection,
  useWindowFocusDetection,
  useWindowResizeDetection,
} from './useAppUIStore';
import {
  useModalBodyScrollLock,
  useModalKeyboardShortcuts,
} from './useModalStore';
import { usePlaylistKeyboardShortcuts } from './usePlaylistStore';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * StoreProvider component that initializes all store-related side effects
 * and provides a centralized place for store configuration.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  // Initialize app UI store side effects
  useSystemThemeDetection();
  useOnlineStatusDetection();
  useWindowFocusDetection();
  useWindowResizeDetection();
  useActivityTracking();

  // Initialize modal store side effects
  useModalKeyboardShortcuts();
  useModalBodyScrollLock();

  // Initialize playlist store side effects
  usePlaylistKeyboardShortcuts();

  return <>{children}</>;
};

/**
 * Hook to get all store states in a single object for debugging
 */
export const useStoreDebugInfo = () => {
  const [appUIStore, setAppUIStore] = React.useState<any>(null);
  const [modalStore, setModalStore] = React.useState<any>(null);
  const [playlistUIStore, setPlaylistUIStore] = React.useState<any>(null);
  const [playlistStore, setPlaylistStore] = React.useState<any>(null);

  React.useEffect(() => {
    // Dynamically import stores to avoid circular dependencies
    Promise.all([
      import('./useAppUIStore').then(m => m.useAppUIStore.getState()),
      import('./useModalStore').then(m => m.useModalStore.getState()),
      import('./usePlaylistUIStore').then(m => m.usePlaylistUIStore.getState()),
      import('./usePlaylistStore').then(m => m.usePlaylistStore.getState()),
    ]).then(([appUI, modal, playlistUI, playlist]) => {
      setAppUIStore(appUI);
      setModalStore(modal);
      setPlaylistUIStore(playlistUI);
      setPlaylistStore(playlist);
    });
  }, []);

  return {
    appUI: appUIStore,
    modal: modalStore,
    playlistUI: playlistUIStore,
    playlist: playlistStore,
  };
};

/**
 * Hook to reset all stores to their initial state
 * Useful for testing or user logout scenarios
 */
export const useStoreReset = () => {
  const resetStores = React.useCallback(async () => {
    // Clear localStorage for persisted stores
    localStorage.removeItem('app-ui-store');
    localStorage.removeItem('playlist-ui-store');
    localStorage.removeItem('playlist-store');

    // Reload the page to reinitialize stores
    window.location.reload();
  }, []);

  return { resetStores };
};

/**
 * Hook to export/import store state for backup/restore functionality
 */
export const useStoreBackup = () => {
  const exportStores = React.useCallback(async () => {
    const stores = await Promise.all([
      import('./useAppUIStore').then(m => ({
        name: 'appUI',
        state: m.useAppUIStore.getState(),
      })),
      import('./useModalStore').then(m => ({
        name: 'modal',
        state: m.useModalStore.getState(),
      })),
      import('./usePlaylistUIStore').then(m => ({
        name: 'playlistUI',
        state: m.usePlaylistUIStore.getState(),
      })),
      import('./usePlaylistStore').then(m => ({
        name: 'playlist',
        state: m.usePlaylistStore.getState(),
      })),
    ]);

    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      stores: stores.reduce(
        (acc, store) => {
          acc[store.name] = store.state;
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    return JSON.stringify(backup, null, 2);
  }, []);

  const importStores = React.useCallback(async (backupData: string) => {
    try {
      const backup = JSON.parse(backupData);

      if (!backup.version || !backup.stores) {
        throw new Error('Invalid backup format');
      }

      // Store backup data in localStorage
      if (backup.stores.appUI) {
        localStorage.setItem(
          'app-ui-store',
          JSON.stringify(backup.stores.appUI),
        );
      }
      if (backup.stores.playlistUI) {
        localStorage.setItem(
          'playlist-ui-store',
          JSON.stringify(backup.stores.playlistUI),
        );
      }
      if (backup.stores.playlist) {
        localStorage.setItem(
          'playlist-store',
          JSON.stringify(backup.stores.playlist),
        );
      }

      // Reload to apply imported state
      window.location.reload();
    } catch (error) {
      throw new Error(
        `Failed to import backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }, []);

  return { exportStores, importStores };
};

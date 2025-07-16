// src/frontend/stores/useModalStore.ts

import React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Modal types
export type ModalType =
  | 'createPlaylist'
  | 'editPlaylist'
  | 'deletePlaylist'
  | 'duplicatePlaylist'
  | 'youtubeImport'
  | 'importProgress'
  | 'playlistDetails'
  | 'songDetails'
  | 'bulkActions'
  | 'settings'
  | 'about'
  | 'confirmDialog'
  | 'errorDialog'
  | 'successDialog';

// Dialog types
export type DialogType = 'confirm' | 'alert' | 'prompt';

// Modal data interfaces
export interface CreatePlaylistModalData {
  initialName?: string;
  initialDescription?: string;
  initialTags?: string[];
  isPrivate?: boolean;
}

export interface EditPlaylistModalData {
  playlistId: string;
  currentName: string;
  currentDescription?: string;
  currentTags?: string[];
  isPrivate?: boolean;
}

export interface DeletePlaylistModalData {
  playlistId: string;
  playlistName: string;
  songCount: number;
}

export interface DuplicatePlaylistModalData {
  sourcePlaylistId: string;
  sourcePlaylistName: string;
  suggestedName?: string;
}

export interface YouTubeImportModalData {
  initialUrl?: string;
  targetPlaylistName?: string;
}

export interface ImportProgressModalData {
  jobId: string;
  playlistUrl: string;
  targetPlaylistName?: string;
}

export interface PlaylistDetailsModalData {
  playlistId: string;
}

export interface SongDetailsModalData {
  songId: string;
  playlistId?: string;
}

export interface BulkActionsModalData {
  selectedIds: string[];
  action: 'delete' | 'export' | 'addTags' | 'removeTags';
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertDialogData {
  title: string;
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  okText?: string;
  onOk?: () => void;
}

export interface PromptDialogData {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  validator?: (value: string) => string | null; // Returns error message or null
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

// Modal state interface
export interface ModalState {
  // Active modals stack (supports multiple modals)
  modals: Array<{
    id: string;
    type: ModalType;
    data?: any;
    closable?: boolean;
    persistent?: boolean; // Prevents closing on backdrop click
  }>;

  // Dialog state
  dialog: {
    isOpen: boolean;
    type?: DialogType;
    data?: ConfirmDialogData | AlertDialogData | PromptDialogData;
  };

  // Loading states for modal operations
  loading: {
    [modalId: string]: boolean;
  };

  // Actions
  openModal: <T = any>(
    type: ModalType,
    data?: T,
    options?: {
      closable?: boolean;
      persistent?: boolean;
    },
  ) => string;
  closeModal: (modalId?: string) => void; // Closes specific modal or top modal
  closeAllModals: () => void;
  updateModalData: <T = any>(modalId: string, data: Partial<T>) => void;
  setModalLoading: (modalId: string, loading: boolean) => void;

  // Dialog actions
  showConfirmDialog: (data: ConfirmDialogData) => void;
  showAlertDialog: (data: AlertDialogData) => void;
  showPromptDialog: (data: PromptDialogData) => void;
  closeDialog: () => void;

  // Convenience methods
  showCreatePlaylistModal: (data?: CreatePlaylistModalData) => string;
  showEditPlaylistModal: (data: EditPlaylistModalData) => string;
  showDeletePlaylistModal: (data: DeletePlaylistModalData) => string;
  showDuplicatePlaylistModal: (data: DuplicatePlaylistModalData) => string;
  showYouTubeImportModal: (data?: YouTubeImportModalData) => string;
  showImportProgressModal: (data: ImportProgressModalData) => string;
  showPlaylistDetailsModal: (data: PlaylistDetailsModalData) => string;
  showSongDetailsModal: (data: SongDetailsModalData) => string;
  showBulkActionsModal: (data: BulkActionsModalData) => string;

  // Getters
  getTopModal: () => { id: string; type: ModalType; data?: any } | null;
  isModalOpen: (type: ModalType) => boolean;
  getModalById: (
    id: string,
  ) => { id: string; type: ModalType; data?: any } | null;
  getModalCount: () => number;
  isAnyModalOpen: () => boolean;
}

// Create the store
export const useModalStore = create<ModalState>()(
  immer((set, get) => ({
    // Initial state
    modals: [],
    dialog: {
      isOpen: false,
    },
    loading: {},

    // Modal actions
    openModal: (type, data, options = {}) => {
      const modalId = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      set(state => {
        state.modals.push({
          id: modalId,
          type,
          data,
          closable: options.closable !== false,
          persistent: options.persistent || false,
        });
      });

      return modalId;
    },

    closeModal: modalId => {
      set(state => {
        if (modalId) {
          // Close specific modal
          const index = state.modals.findIndex(m => m.id === modalId);
          if (index !== -1) {
            state.modals.splice(index, 1);
            delete state.loading[modalId];
          }
        } else {
          // Close top modal
          if (state.modals.length > 0) {
            const topModal = state.modals[state.modals.length - 1];
            if (topModal.closable !== false) {
              state.modals.pop();
              delete state.loading[topModal.id];
            }
          }
        }
      });
    },

    closeAllModals: () => {
      set(state => {
        state.modals = [];
        state.loading = {};
      });
    },

    updateModalData: (modalId, data) => {
      set(state => {
        const modal = state.modals.find(m => m.id === modalId);
        if (modal) {
          modal.data = { ...modal.data, ...data };
        }
      });
    },

    setModalLoading: (modalId, loading) => {
      set(state => {
        if (loading) {
          state.loading[modalId] = true;
        } else {
          delete state.loading[modalId];
        }
      });
    },

    // Dialog actions
    showConfirmDialog: data => {
      set(state => {
        state.dialog = {
          isOpen: true,
          type: 'confirm',
          data,
        };
      });
    },

    showAlertDialog: data => {
      set(state => {
        state.dialog = {
          isOpen: true,
          type: 'alert',
          data,
        };
      });
    },

    showPromptDialog: data => {
      set(state => {
        state.dialog = {
          isOpen: true,
          type: 'prompt',
          data,
        };
      });
    },

    closeDialog: () => {
      set(state => {
        state.dialog = {
          isOpen: false,
        };
      });
    },

    // Convenience methods
    showCreatePlaylistModal: data => {
      return get().openModal('createPlaylist', data);
    },

    showEditPlaylistModal: data => {
      return get().openModal('editPlaylist', data);
    },

    showDeletePlaylistModal: data => {
      return get().openModal('deletePlaylist', data, { persistent: true });
    },

    showDuplicatePlaylistModal: data => {
      return get().openModal('duplicatePlaylist', data);
    },

    showYouTubeImportModal: data => {
      return get().openModal('youtubeImport', data);
    },

    showImportProgressModal: data => {
      return get().openModal('importProgress', data, {
        closable: false,
        persistent: true,
      });
    },

    showPlaylistDetailsModal: data => {
      return get().openModal('playlistDetails', data);
    },

    showSongDetailsModal: data => {
      return get().openModal('songDetails', data);
    },

    showBulkActionsModal: data => {
      return get().openModal('bulkActions', data);
    },

    // Getters
    getTopModal: () => {
      const state = get();
      return state.modals.length > 0
        ? state.modals[state.modals.length - 1]
        : null;
    },

    isModalOpen: type => {
      const state = get();
      return state.modals.some(m => m.type === type);
    },

    getModalById: id => {
      const state = get();
      return state.modals.find(m => m.id === id) || null;
    },

    getModalCount: () => {
      const state = get();
      return state.modals.length;
    },

    isAnyModalOpen: () => {
      const state = get();
      return state.modals.length > 0 || state.dialog.isOpen;
    },
  })),
);

// Selector hooks for better performance
export const useTopModal = () =>
  useModalStore(state =>
    state.modals.length > 0 ? state.modals[state.modals.length - 1] : null,
  );

export const useDialog = () => useModalStore(state => state.dialog);

export const useModalLoading = (modalId: string) =>
  useModalStore(state => state.loading[modalId] || false);

export const useIsModalOpen = (type: ModalType) =>
  useModalStore(state => state.modals.some(m => m.type === type));

export const useModalCount = () => useModalStore(state => state.modals.length);

export const useIsAnyModalOpen = () =>
  useModalStore(state => state.modals.length > 0 || state.dialog.isOpen);

// Hook for modal keyboard shortcuts
export const useModalKeyboardShortcuts = () => {
  const { closeModal, closeDialog, getTopModal, dialog } = useModalStore();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key handling
      if (event.key === 'Escape') {
        event.preventDefault();

        // Close dialog first if open
        if (dialog.isOpen) {
          closeDialog();
          return;
        }

        // Then close top modal if closable
        const topModal = getTopModal();
        if (topModal && topModal.closable !== false) {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal, closeDialog, getTopModal, dialog.isOpen]);
};

// Hook for preventing body scroll when modals are open
export const useModalBodyScrollLock = () => {
  const isAnyModalOpen = useIsAnyModalOpen();

  React.useEffect(() => {
    if (isAnyModalOpen) {
      // Prevent body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isAnyModalOpen]);
};

import { create } from 'zustand';
import { PlaylistSummary, PlaylistVideoWithDetails } from '../../shared/types';

interface PlaylistState {
  // Selected playlist
  selectedPlaylistId: number | null;
  setSelectedPlaylistId: (id: number | null) => void;
  
  // Playlist operations UI state
  isCreatingPlaylist: boolean;
  setIsCreatingPlaylist: (isCreating: boolean) => void;
  
  isImportingPlaylist: boolean;
  setIsImportingPlaylist: (isImporting: boolean) => void;
  
  isImportingJson: boolean;
  setIsImportingJson: (isImporting: boolean) => void;
  
  // Video operations UI state
  selectedVideoId: number | null;
  setSelectedVideoId: (id: number | null) => void;
  
  // Dialogs
  isExportDialogOpen: boolean;
  setIsExportDialogOpen: (isOpen: boolean) => void;
  
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (isOpen: boolean) => void;
  
  isRenameDialogOpen: boolean;
  setIsRenameDialogOpen: (isOpen: boolean) => void;
  
  // Playlist for modals
  selectedPlaylistForAction: PlaylistSummary | null;
  setSelectedPlaylistForAction: (playlist: PlaylistSummary | null) => void;
  
  // Drag and drop for reordering
  isDraggingVideo: boolean;
  setIsDraggingVideo: (isDragging: boolean) => void;
  
  draggedVideoId: number | null;
  setDraggedVideoId: (videoId: number | null) => void;
  
  // Temporary form data
  formPlaylistName: string;
  setFormPlaylistName: (name: string) => void;
  
  formPlaylistDescription: string;
  setFormPlaylistDescription: (description: string) => void;
  
  formYouTubeUrl: string;
  setFormYouTubeUrl: (url: string) => void;
  
  // Reset all form data
  resetFormData: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  // Selected playlist
  selectedPlaylistId: null,
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id }),
  
  // Playlist operations UI state
  isCreatingPlaylist: false,
  setIsCreatingPlaylist: (isCreating) => set({ isCreatingPlaylist: isCreating }),
  
  isImportingPlaylist: false,
  setIsImportingPlaylist: (isImporting) => set({ isImportingPlaylist: isImporting }),
  
  isImportingJson: false,
  setIsImportingJson: (isImporting) => set({ isImportingJson: isImporting }),
  
  // Video operations UI state
  selectedVideoId: null,
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  
  // Dialogs
  isExportDialogOpen: false,
  setIsExportDialogOpen: (isOpen) => set({ isExportDialogOpen: isOpen }),
  
  isDeleteConfirmOpen: false,
  setIsDeleteConfirmOpen: (isOpen) => set({ isDeleteConfirmOpen: isOpen }),
  
  isRenameDialogOpen: false,
  setIsRenameDialogOpen: (isOpen) => set({ isRenameDialogOpen: isOpen }),
  
  // Playlist for modals
  selectedPlaylistForAction: null,
  setSelectedPlaylistForAction: (playlist) => set({ selectedPlaylistForAction: playlist }),
  
  // Drag and drop for reordering
  isDraggingVideo: false,
  setIsDraggingVideo: (isDragging) => set({ isDraggingVideo: isDragging }),
  
  draggedVideoId: null,
  setDraggedVideoId: (videoId) => set({ draggedVideoId: videoId }),
  
  // Temporary form data
  formPlaylistName: '',
  setFormPlaylistName: (name) => set({ formPlaylistName: name }),
  
  formPlaylistDescription: '',
  setFormPlaylistDescription: (description) => set({ formPlaylistDescription: description }),
  
  formYouTubeUrl: '',
  setFormYouTubeUrl: (url) => set({ formYouTubeUrl: url }),
  
  // Reset all form data
  resetFormData: () => set({
    formPlaylistName: '',
    formPlaylistDescription: '',
    formYouTubeUrl: '',
  }),
})); 
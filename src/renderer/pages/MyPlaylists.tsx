import React, { useState } from 'react';
import { PlaylistList } from '../components/PlaylistList/PlaylistList';
import { PlaylistView } from '../components/PlaylistView/PlaylistView';
import { usePlaylistStore } from '../store/playlistStore';
import { 
  useDeletePlaylist, 
  useRefreshPlaylist, 
  useExportPlaylist,
  useUpdatePlaylist,
  useCreatePlaylist,
  useImportPlaylist,
  useImportPlaylistFromJson
} from '../hooks/usePlaylistQueries';
import { PlaylistSummary, PlaylistVideoWithDetails, Playlist } from '../../shared/types';
import { CreatePlaylistModal } from '../components/Modals/CreatePlaylistModal';
import { ImportPlaylistModal } from '../components/Modals/ImportPlaylistModal';
import { ImportJsonModal } from '../components/Modals/ImportJsonModal';
import { ConfirmDeleteModal } from '../components/Modals/ConfirmDeleteModal';
import { RenamePlaylistModal } from '../components/Modals/RenamePlaylistModal';

// Extend the PlaylistSummary type to include source
interface ExtendedPlaylistSummary extends PlaylistSummary {
  source?: string;
}

// Extended Playlist type with source property
interface ExtendedPlaylist extends Playlist {
  source?: string;
}

export const MyPlaylists: React.FC = () => {
  const { 
    selectedPlaylistId, 
    setSelectedPlaylistId,
    isCreatingPlaylist,
    setIsCreatingPlaylist,
    isImportingPlaylist,
    setIsImportingPlaylist,
    isImportingJson,
    setIsImportingJson,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    selectedPlaylistForAction,
    setSelectedPlaylistForAction
  } = usePlaylistStore();
  
  // Mutations
  const deletePlaylistMutation = useDeletePlaylist();
  const refreshPlaylistMutation = useRefreshPlaylist();
  const exportPlaylistMutation = useExportPlaylist();
  const updatePlaylistMutation = useUpdatePlaylist();
  const createPlaylistMutation = useCreatePlaylist();
  const importPlaylistMutation = useImportPlaylist();
  const importJsonMutation = useImportPlaylistFromJson();

  // Handle creating a new playlist
  const handleCreatePlaylist = () => {
    setIsCreatingPlaylist(true);
  };

  // Handle importing a playlist
  const handleImportPlaylist = () => {
    setIsImportingPlaylist(true);
  };
  
  // Handle importing a playlist from JSON
  const handleImportJson = () => {
    setIsImportingJson(true);
  };
  
  // Handle creating a custom playlist from modal
  const handleCreatePlaylistSubmit = (name: string, description: string) => {
    createPlaylistMutation.mutate({
      name,
      description: description || undefined
    });
  };
  
  // Handle importing a YouTube playlist from modal
  const handleImportPlaylistSubmit = (url: string) => {
    importPlaylistMutation.mutate({ url });
  };
  
  // Handle importing a playlist from JSON
  const handleImportJsonSubmit = (jsonData: string) => {
    importJsonMutation.mutate({ jsonData });
  };

  // Handle playlist actions
  const handlePlaylistAction = (
    action: 'delete' | 'refresh' | 'export' | 'rename',
    playlist: ExtendedPlaylistSummary
  ) => {
    setSelectedPlaylistForAction(playlist);
    
    switch (action) {
      case 'delete':
        // Show delete confirmation dialog
        setIsDeleteConfirmOpen(true);
        break;
        
      case 'refresh':
        // Only YouTube playlists can be refreshed
        if (playlist.source === 'youtube') {
          refreshPlaylistMutation.mutate({ playlistId: playlist.id });
        }
        break;
        
      case 'export':
        // Handle direct export
        exportPlaylistMutation.mutate(
          { playlistId: playlist.id },
          {
            onSuccess: (jsonData) => {
              if (jsonData) {
                // Create a download link
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${playlist.name.replace(/\s+/g, '_')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }
          }
        );
        break;
        
      case 'rename':
        // Open rename dialog
        setIsRenameDialogOpen(true);
        break;
    }
  };
  
  // Handle playlist rename confirmation
  const handleRenameConfirm = (newName: string) => {
    if (selectedPlaylistForAction) {
      updatePlaylistMutation.mutate({
        playlistId: selectedPlaylistForAction.id,
        updates: {
          name: newName,
          updated_at: Math.floor(Date.now() / 1000)
        }
      }, {
        onSuccess: () => {
          setIsRenameDialogOpen(false);
          setSelectedPlaylistForAction(null);
        }
      });
    }
  };
  
  // Handle playlist deletion confirmation
  const handleDeleteConfirm = () => {
    if (selectedPlaylistForAction) {
      deletePlaylistMutation.mutate(
        { playlistId: selectedPlaylistForAction.id },
        {
          onSuccess: () => {
            setIsDeleteConfirmOpen(false);
            setSelectedPlaylistForAction(null);
            // If the deleted playlist was selected, clear the selection
            if (selectedPlaylistId === selectedPlaylistForAction.id) {
              setSelectedPlaylistId(null);
            }
          }
        }
      );
    }
  };

  // Handle video actions
  const handleVideoAction = (
    action: 'play' | 'download' | 'remove',
    video: PlaylistVideoWithDetails
  ) => {
    // These would be implemented in a real app
    switch (action) {
      case 'play':
        console.log('Play video:', video.title);
        // Would open video player or navigate to player page
        break;
        
      case 'download':
        console.log('Download video:', video.title);
        // Would trigger download process
        break;
        
      case 'remove':
        console.log('Remove video:', video.title);
        // Would remove video from playlist
        break;
    }
  };

  // Function to handle playlist actions for the PlaylistView component
  const handlePlaylistViewAction = (
    action: 'refresh' | 'export' | 'rename' | 'delete',
    playlist: Playlist
  ) => {
    // Cast the Playlist to ExtendedPlaylistSummary for compatibility
    handlePlaylistAction(action, {
      id: playlist.id as number, // Ensure id is not undefined
      name: playlist.name,
      thumbnail: playlist.thumbnail,
      video_count: playlist.video_count || 0,
      duration_seconds: playlist.duration_seconds || 0,
      source: playlist.source,
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel: Playlist list */}
      <div className="w-1/3 border-r h-full overflow-hidden">
        <PlaylistList
          onCreatePlaylist={handleCreatePlaylist}
          onImportPlaylist={handleImportPlaylist}
          onImportJson={handleImportJson}
          onPlaylistAction={handlePlaylistAction}
        />
      </div>
      
      {/* Right panel: Playlist details */}
      <div className="w-2/3 h-full overflow-hidden">
        {selectedPlaylistId ? (
          <PlaylistView
            playlistId={selectedPlaylistId}
            onVideoAction={handleVideoAction}
            onPlaylistAction={handlePlaylistViewAction}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto text-gray-400"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">No Playlist Selected</h2>
              <p className="text-muted-foreground mb-4">
                Select a playlist from the left or create a new one to get started.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {isCreatingPlaylist && (
        <CreatePlaylistModal 
          isOpen={isCreatingPlaylist}
          onClose={() => setIsCreatingPlaylist(false)}
          onCreatePlaylist={handleCreatePlaylistSubmit}
        />
      )}
      
      {isImportingPlaylist && (
        <ImportPlaylistModal 
          isOpen={isImportingPlaylist}
          onClose={() => setIsImportingPlaylist(false)}
          onImportPlaylist={handleImportPlaylistSubmit}
        />
      )}
      
      {isImportingJson && (
        <ImportJsonModal 
          isOpen={isImportingJson}
          onClose={() => setIsImportingJson(false)}
          onImportJson={handleImportJsonSubmit}
        />
      )}
      
      {isDeleteConfirmOpen && selectedPlaylistForAction && (
        <ConfirmDeleteModal 
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setSelectedPlaylistForAction(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Playlist"
          message={`Are you sure you want to delete "${selectedPlaylistForAction.name}"? This action cannot be undone.`}
        />
      )}
      
      {isRenameDialogOpen && selectedPlaylistForAction && (
        <RenamePlaylistModal 
          isOpen={isRenameDialogOpen}
          onClose={() => {
            setIsRenameDialogOpen(false);
            setSelectedPlaylistForAction(null);
          }}
          onRename={handleRenameConfirm}
          currentName={selectedPlaylistForAction.name}
        />
      )}
    </div>
  );
}; 
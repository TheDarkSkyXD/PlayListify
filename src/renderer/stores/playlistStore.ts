import { create } from 'zustand';
import { Playlist, Video } from '../../shared/types/appTypes';

interface PlaylistStore {
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, playlist: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
  // Video operations
  addVideo: (playlistId: string, video: Video) => void;
  updateVideo: (playlistId: string, videoId: string, video: Partial<Video>) => void;
  removeVideo: (playlistId: string, videoId: string) => void;
  // Loading state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const usePlaylistStore = create<PlaylistStore>((set) => ({
  playlists: [],
  isLoading: false,
  error: null,

  // Playlist operations
  setPlaylists: (playlists) => set({ playlists }),
  
  addPlaylist: (playlist) => 
    set((state) => ({ 
      playlists: [...state.playlists, playlist] 
    })),
  
  updatePlaylist: (id, updatedPlaylist) => 
    set((state) => ({ 
      playlists: state.playlists.map((playlist) => 
        playlist.id === id 
          ? { ...playlist, ...updatedPlaylist, updatedAt: new Date() } 
          : playlist
      ) 
    })),
  
  removePlaylist: (id) => 
    set((state) => ({ 
      playlists: state.playlists.filter((playlist) => playlist.id !== id) 
    })),

  // Video operations
  addVideo: (playlistId, video) => 
    set((state) => ({ 
      playlists: state.playlists.map((playlist) => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              videos: [...playlist.videos, video],
              updatedAt: new Date()
            } 
          : playlist
      ) 
    })),
  
  updateVideo: (playlistId, videoId, updatedVideo) => 
    set((state) => ({ 
      playlists: state.playlists.map((playlist) => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              videos: playlist.videos.map((video) => 
                video.id === videoId 
                  ? { ...video, ...updatedVideo } 
                  : video
              ),
              updatedAt: new Date()
            } 
          : playlist
      ) 
    })),
  
  removeVideo: (playlistId, videoId) => 
    set((state) => ({ 
      playlists: state.playlists.map((playlist) => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              videos: playlist.videos.filter((video) => video.id !== videoId),
              updatedAt: new Date()
            } 
          : playlist
      ) 
    })),

  // Loading state
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default usePlaylistStore; 
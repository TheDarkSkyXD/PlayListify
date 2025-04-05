import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Playlist, Video } from '../../shared/types/appTypes';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';

interface PlaylistStore {
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;
  activePlaylistId: string | null;
  
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, playlist: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
  setActivePlaylist: (id: string | null) => void;
  
  // Video operations
  addVideo: (playlistId: string, video: Video) => void;
  updateVideo: (playlistId: string, videoId: string, video: Partial<Video>) => void;
  removeVideo: (playlistId: string, videoId: string) => void;
  updateVideoStatus: (playlistId: string, videoId: string, status: Video['status']) => void;
  updateVideoDownloadStatus: (playlistId: string, videoId: string, downloadStatus: Video['downloadStatus']) => void;
  markVideoDownloaded: (playlistId: string, videoId: string, downloadPath: string, fileSize?: number) => void;
  
  // Batch operations
  updateVideosStatus: (playlistId: string, videoIds: string[], status: Video['status']) => void;
  
  // Filtering & Sorting
  getPlaylistById: (id: string) => Playlist | undefined;
  getVideoById: (playlistId: string, videoId: string) => Video | undefined;
  
  // Loading state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      isLoading: false,
      error: null,
      activePlaylistId: null,

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
              ? { ...playlist, ...updatedPlaylist, updatedAt: new Date().toISOString() } 
              : playlist
          ) 
        })),
      
      removePlaylist: (id) => 
        set((state) => ({ 
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
          activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId
        })),
        
      setActivePlaylist: (id) => set({ activePlaylistId: id }),

      // Video operations
      addVideo: (playlistId, video) => 
        set((state) => ({ 
          playlists: state.playlists.map((playlist) => 
            playlist.id === playlistId 
              ? { 
                  ...playlist, 
                  videos: [...playlist.videos, video],
                  updatedAt: new Date().toISOString()
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
                  updatedAt: new Date().toISOString()
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
                  updatedAt: new Date().toISOString()
                } 
              : playlist
          ) 
        })),
        
      updateVideoStatus: (playlistId, videoId, status) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  videos: playlist.videos.map((video) =>
                    video.id === videoId
                      ? { ...video, status }
                      : video
                  ),
                  updatedAt: new Date().toISOString()
                }
              : playlist
          )
        })),
        
      updateVideoDownloadStatus: (playlistId, videoId, downloadStatus) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  videos: playlist.videos.map((video) =>
                    video.id === videoId
                      ? { ...video, downloadStatus }
                      : video
                  ),
                  updatedAt: new Date().toISOString()
                }
              : playlist
          )
        })),
        
      markVideoDownloaded: (playlistId, videoId, downloadPath, fileSize) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  videos: playlist.videos.map((video) =>
                    video.id === videoId
                      ? { 
                          ...video, 
                          downloaded: true, 
                          downloadPath,
                          fileSize,
                          downloadStatus: 'completed'
                        }
                      : video
                  ),
                  updatedAt: new Date().toISOString()
                }
              : playlist
          )
        })),

      // Batch operations
      updateVideosStatus: (playlistId, videoIds, status) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  videos: playlist.videos.map((video) =>
                    videoIds.includes(video.id)
                      ? { ...video, status }
                      : video
                  ),
                  updatedAt: new Date().toISOString()
                }
              : playlist
          )
        })),
        
      // Filtering & Sorting
      getPlaylistById: (id) => {
        return get().playlists.find(playlist => playlist.id === id);
      },
      
      getVideoById: (playlistId, videoId) => {
        const playlist = get().playlists.find(p => p.id === playlistId);
        return playlist?.videos.find(v => v.id === videoId);
      },

      // Loading state
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: STORAGE_KEYS.PLAYLISTS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        playlists: state.playlists,
        activePlaylistId: state.activePlaylistId
      }),
    }
  )
);

export default usePlaylistStore; 
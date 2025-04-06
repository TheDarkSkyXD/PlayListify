import { create } from 'zustand';
import { Video, Playlist } from '../../../../shared/types/appTypes';

interface PlayerState {
  // Current playback state
  isPlaying: boolean;
  currentVideo: Video | null;
  currentPlaylist: Playlist | null;
  currentVideoIndex: number;
  
  // Player settings
  volume: number;
  muted: boolean;
  
  // UI state
  isPlayerVisible: boolean;
  isFullscreen: boolean;
  
  // Actions
  setPlaying: (isPlaying: boolean) => void;
  playVideo: (video: Video, playlist: Playlist) => void;
  playVideoAtIndex: (playlist: Playlist, index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  toggleFullscreen: () => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  togglePlayer: () => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentVideo: null,
  currentPlaylist: null,
  currentVideoIndex: -1,
  volume: 0.8, // 80% volume by default
  muted: false,
  isPlayerVisible: false,
  isFullscreen: false,
  
  // Actions
  setPlaying: (isPlaying) => set({ isPlaying }),
  
  playVideo: (video, playlist) => {
    // Find the index of the video in the playlist
    const videoIndex = playlist.videos.findIndex(v => v.id === video.id);
    
    if (videoIndex === -1) {
      console.error('Video not found in playlist');
      return;
    }
    
    set({
      currentVideo: video,
      currentPlaylist: playlist,
      currentVideoIndex: videoIndex,
      isPlaying: true,
      isPlayerVisible: true
    });
  },
  
  playVideoAtIndex: (playlist, index) => {
    if (index < 0 || index >= playlist.videos.length) {
      console.error('Invalid video index');
      return;
    }
    
    set({
      currentVideo: playlist.videos[index],
      currentPlaylist: playlist,
      currentVideoIndex: index,
      isPlaying: true,
      isPlayerVisible: true
    });
  },
  
  playNext: () => {
    const { currentPlaylist, currentVideoIndex } = get();
    
    if (!currentPlaylist || currentVideoIndex === -1) {
      return;
    }
    
    const nextIndex = currentVideoIndex + 1;
    
    if (nextIndex < currentPlaylist.videos.length) {
      get().playVideoAtIndex(currentPlaylist, nextIndex);
    }
  },
  
  playPrevious: () => {
    const { currentPlaylist, currentVideoIndex } = get();
    
    if (!currentPlaylist || currentVideoIndex <= 0) {
      return;
    }
    
    const prevIndex = currentVideoIndex - 1;
    get().playVideoAtIndex(currentPlaylist, prevIndex);
  },
  
  setVolume: (volume) => {
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume });
    
    // Save to settings
    window.electron.settings.set('defaultVolume', clampedVolume * 100).catch(err => {
      console.error('Failed to save volume setting:', err);
    });
  },
  
  setMuted: (muted) => set({ muted }),
  
  toggleMuted: () => set(state => ({ muted: !state.muted })),
  
  toggleFullscreen: () => set(state => ({ isFullscreen: !state.isFullscreen })),
  
  showPlayer: () => set({ isPlayerVisible: true }),
  
  hidePlayer: () => set({ isPlayerVisible: false }),
  
  togglePlayer: () => set(state => ({ isPlayerVisible: !state.isPlayerVisible })),
  
  resetPlayer: () => set({
    isPlaying: false,
    currentVideo: null,
    currentPlaylist: null,
    currentVideoIndex: -1,
    isPlayerVisible: false,
    isFullscreen: false
  })
}));

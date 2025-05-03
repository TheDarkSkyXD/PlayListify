import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Video {
  id: string;
  title: string;
  url?: string;
  thumbnail?: string;
  duration?: number;
}

interface PlayerState {
  // Currently playing
  currentVideo: Video | null;
  currentPlaylistId: string | null;
  currentVideoIndex: number;
  playlistVideos: Video[];
  
  // Player state
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  repeat: 'off' | 'one' | 'all';
  shuffle: boolean;
  
  // History
  playbackHistory: {
    videoId: string;
    playlistId?: string;
    timestamp: number;
    progress: number;
  }[];
  
  // Actions
  setCurrentVideo: (video: Video | null, playlistId?: string | null) => void;
  setPlaylistVideos: (videos: Video[], playlistId: string, startIndex?: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setRepeat: (repeat: 'off' | 'one' | 'all') => void;
  setShuffle: (shuffle: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  updatePlaybackProgress: (videoId: string, progress: number) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

/**
 * Store for managing video player state
 */
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentVideo: null,
      currentPlaylistId: null,
      currentVideoIndex: -1,
      playlistVideos: [],
      isPlaying: false,
      volume: 0.7,
      muted: false,
      repeat: 'off',
      shuffle: false,
      playbackHistory: [],
      
      // Actions
      setCurrentVideo: (video, playlistId = null) => set({ 
        currentVideo: video, 
        currentPlaylistId: playlistId,
        isPlaying: !!video, // Start playing when a video is set
      }),
      
      setPlaylistVideos: (videos, playlistId, startIndex = 0) => {
        set({ 
          playlistVideos: videos,
          currentPlaylistId: playlistId,
          currentVideoIndex: Math.min(startIndex, videos.length - 1),
          currentVideo: videos[Math.min(startIndex, videos.length - 1)] || null
        });
      },
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setVolume: (volume) => set({ 
        volume: Math.max(0, Math.min(1, volume)), // Ensure volume is between 0 and 1
        muted: volume === 0 // Auto-mute when volume is 0
      }),
      
      setMuted: (muted) => set({ muted }),
      
      setRepeat: (repeat) => set({ repeat }),
      
      setShuffle: (shuffle) => set({ shuffle }),
      
      playNext: () => {
        const { currentVideoIndex, playlistVideos, shuffle, repeat } = get();
        
        if (playlistVideos.length === 0) return;
        
        // Handle repeat one
        if (repeat === 'one') {
          // Just restart the current video
          return;
        }
        
        let nextIndex = currentVideoIndex;
        
        if (shuffle) {
          // Pick a random video that's not the current one
          const availableIndices = Array.from(
            { length: playlistVideos.length }, 
            (_, i) => i
          ).filter(i => i !== currentVideoIndex);
          
          if (availableIndices.length > 0) {
            nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          }
        } else {
          // Play the next video in sequence
          nextIndex = (currentVideoIndex + 1) % playlistVideos.length;
          
          // If we've reached the end and repeat is off, don't loop
          if (nextIndex === 0 && repeat === 'off') {
            set({ isPlaying: false });
            return;
          }
        }
        
        set({ 
          currentVideoIndex: nextIndex,
          currentVideo: playlistVideos[nextIndex],
          isPlaying: true
        });
      },
      
      playPrevious: () => {
        const { currentVideoIndex, playlistVideos, shuffle } = get();
        
        if (playlistVideos.length === 0) return;
        
        let prevIndex = currentVideoIndex;
        
        if (shuffle) {
          // In shuffle mode, pick a random video
          const availableIndices = Array.from(
            { length: playlistVideos.length }, 
            (_, i) => i
          ).filter(i => i !== currentVideoIndex);
          
          if (availableIndices.length > 0) {
            prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          }
        } else {
          // Go to previous video in sequence, loop to end if at beginning
          prevIndex = currentVideoIndex > 0 
            ? currentVideoIndex - 1 
            : playlistVideos.length - 1;
        }
        
        set({ 
          currentVideoIndex: prevIndex,
          currentVideo: playlistVideos[prevIndex],
          isPlaying: true
        });
      },
      
      updatePlaybackProgress: (videoId, progress) => {
        const { playbackHistory } = get();
        const now = Date.now();
        
        // Update history - add to beginning, remove duplicates, keep max 50 entries
        const updatedHistory = [
          { 
            videoId, 
            playlistId: get().currentPlaylistId || undefined, 
            timestamp: now, 
            progress 
          },
          ...playbackHistory
            .filter(entry => entry.videoId !== videoId)
            .slice(0, 49)
        ];
        
        set({ playbackHistory: updatedHistory });
      },
      
      togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
      
      toggleMute: () => set(state => ({ muted: !state.muted })),
      
      toggleShuffle: () => set(state => ({ shuffle: !state.shuffle })),
      
      cycleRepeat: () => {
        const { repeat } = get();
        const nextRepeat = {
          'off': 'all',
          'all': 'one',
          'one': 'off'
        } as const;
        
        set({ repeat: nextRepeat[repeat] });
      }
    }),
    {
      name: 'player-store',
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        repeat: state.repeat,
        shuffle: state.shuffle,
        playbackHistory: state.playbackHistory
      })
    }
  )
); 
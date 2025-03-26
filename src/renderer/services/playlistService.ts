import { Playlist, Video } from '../../shared/types/appTypes';
import { v4 as uuidv4 } from 'uuid';

// Create a mutable array to store playlists so changes persist during the session
let MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'pl1',
    name: 'Favorite Music',
    description: 'My favorite music collection',
    videos: [
      {
        id: 'vid1',
        title: 'Awesome Song 1',
        url: 'https://youtube.com/watch?v=abcdef1',
        thumbnail: 'https://i.ytimg.com/vi/abcdef1/hqdefault.jpg',
        duration: 245,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-20T00:00:00.000Z'
      },
      {
        id: 'vid2',
        title: 'Awesome Song 2',
        url: 'https://youtube.com/watch?v=abcdef2',
        thumbnail: 'https://i.ytimg.com/vi/abcdef2/hqdefault.jpg',
        duration: 198,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-20T00:00:00.000Z'
      }
    ],
    createdAt: '2025-03-20T00:00:00.000Z',
    updatedAt: '2025-03-22T00:00:00.000Z',
    thumbnail: 'https://i.ytimg.com/vi/abcdef1/hqdefault.jpg',
  },
  {
    id: 'pl2',
    name: 'Programming Tutorials',
    description: 'Helpful programming tutorials',
    videos: [
      {
        id: 'vid3',
        title: 'Learn React in 1 Hour',
        url: 'https://youtube.com/watch?v=abcdef3',
        thumbnail: 'https://i.ytimg.com/vi/abcdef3/hqdefault.jpg',
        duration: 3600,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-15T00:00:00.000Z'
      }
    ],
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2025-03-15T00:00:00.000Z',
    thumbnail: 'https://i.ytimg.com/vi/abcdef3/hqdefault.jpg',
  }
];

// Try to load any previously created playlists from localStorage
try {
  const storedPlaylists = localStorage.getItem('playlistify-playlists');
  if (storedPlaylists) {
    MOCK_PLAYLISTS = JSON.parse(storedPlaylists);
  }
} catch (e) {
  console.error('Failed to load playlists from localStorage:', e);
}

// Function to save playlists to localStorage
const savePlaylists = () => {
  try {
    localStorage.setItem('playlistify-playlists', JSON.stringify(MOCK_PLAYLISTS));
  } catch (e) {
    console.error('Failed to save playlists to localStorage:', e);
  }
};

// Helper function to simulate API request delay (for development)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Service to manage playlists using the electron IPC bridge
 */
export const playlistService = {
  /**
   * Get all playlists
   */
  async getPlaylists(): Promise<Playlist[]> {
    try {
      // Check if the IPC bridge is available
      if (window.api && window.api.playlists) {
        const playlists = await window.api.playlists.getAll();
        return playlists;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        await delay(500); // Simulate API delay
        return MOCK_PLAYLISTS;
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      // Fall back to mock data in case of error
      return MOCK_PLAYLISTS;
    }
  },

  /**
   * Get a playlist by ID
   */
  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      // Check if the IPC bridge is available
      if (window.api && window.api.playlists) {
        const playlist = await window.api.playlists.getById(id);
        return playlist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        await delay(500); // Simulate API delay
        return MOCK_PLAYLISTS.find(p => p.id === id) || null;
      }
    } catch (error) {
      console.error(`Error fetching playlist ${id}:`, error);
      // Fall back to mock data in case of error
      return MOCK_PLAYLISTS.find(p => p.id === id) || null;
    }
  },

  /**
   * Create a new playlist
   */
  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    try {
      // For development simulation
      await delay(500);

      if (window.api && window.api.playlists) {
        const playlist = await window.api.playlists.create(
          playlistData.name, 
          playlistData.description
        );
        
        // If there are videos in the playlist data, we need to add them
        if (playlistData.videos && playlistData.videos.length > 0) {
          // We'll need to do this one by one since the API doesn't support batch adding
          for (const video of playlistData.videos) {
            if (video.url) {
              await window.api.playlists.addVideo(playlist.id, video.url);
            }
          }
          
          // Fetch the updated playlist with videos
          return await window.api.playlists.getById(playlist.id) as Playlist;
        }
        
        return playlist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        const newPlaylist: Playlist = {
          id: `pl${MOCK_PLAYLISTS.length + 1}`,
          name: playlistData.name,
          description: playlistData.description || '',
          videos: playlistData.videos || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnail: playlistData.videos?.[0]?.thumbnail || '',
        };
        
        MOCK_PLAYLISTS.push(newPlaylist);
        savePlaylists();
        
        return newPlaylist;
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      
      // Fall back to mock implementation
      const newPlaylist: Playlist = {
        id: `pl${MOCK_PLAYLISTS.length + 1}`,
        name: playlistData.name,
        description: playlistData.description || '',
        videos: playlistData.videos || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: playlistData.videos?.[0]?.thumbnail || '',
      };
      
      MOCK_PLAYLISTS.push(newPlaylist);
      savePlaylists();
      
      return newPlaylist;
    }
  },

  /**
   * Update an existing playlist
   */
  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    try {
      // For development simulation
      await delay(500);
      
      if (window.api && window.api.playlists) {
        const { id, name, description, thumbnail, source, sourceUrl, tags } = playlist;
        
        const updatedPlaylist = await window.api.playlists.update(id, {
          name,
          description,
          thumbnail,
          source,
          sourceUrl,
          tags,
        });
        
        return updatedPlaylist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlist.id);
        if (index === -1) {
          throw new Error(`Playlist with ID ${playlist.id} not found`);
        }
        
        MOCK_PLAYLISTS[index] = {
          ...MOCK_PLAYLISTS[index],
          ...playlist,
          updatedAt: new Date().toISOString()
        };
        
        savePlaylists();
        return MOCK_PLAYLISTS[index];
      }
    } catch (error) {
      console.error(`Error updating playlist ${playlist.id}:`, error);
      
      // Fall back to mock implementation
      const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlist.id);
      if (index === -1) {
        throw new Error(`Playlist with ID ${playlist.id} not found`);
      }
      
      MOCK_PLAYLISTS[index] = {
        ...MOCK_PLAYLISTS[index],
        ...playlist,
        updatedAt: new Date().toISOString()
      };
      
      savePlaylists();
      return MOCK_PLAYLISTS[index];
    }
  },

  /**
   * Delete a playlist
   */
  async deletePlaylist(id: string): Promise<void> {
    try {
      // For development simulation
      await delay(500);
      
      if (window.api && window.api.playlists) {
        await window.api.playlists.delete(id);
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        const index = MOCK_PLAYLISTS.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error(`Playlist with ID ${id} not found`);
        }
        
        MOCK_PLAYLISTS.splice(index, 1);
        savePlaylists();
      }
    } catch (error) {
      console.error(`Error deleting playlist ${id}:`, error);
      
      // Fall back to mock implementation in case of error
      const index = MOCK_PLAYLISTS.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PLAYLISTS.splice(index, 1);
        savePlaylists();
      }
    }
  },

  /**
   * Import a playlist from YouTube
   */
  async importPlaylist(url: string): Promise<Playlist> {
    try {
      // For development simulation
      await delay(1000);
      
      if (window.api && window.api.youtube) {
        const playlist = await window.api.youtube.importPlaylist(url);
        return playlist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        // Create a mock imported playlist
        const newPlaylist: Playlist = {
          id: `pl${MOCK_PLAYLISTS.length + 1}`,
          name: `Imported Playlist ${Math.floor(Math.random() * 1000)}`,
          description: `Imported from ${url}`,
          videos: [
            {
              id: `vid${Math.floor(Math.random() * 1000)}`,
              title: 'Sample Imported Video',
              url: url,
              thumbnail: 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
              duration: 180,
              status: 'available',
              downloaded: false,
              addedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnail: 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
          source: 'youtube',
          sourceUrl: url
        };
        
        MOCK_PLAYLISTS.push(newPlaylist);
        savePlaylists();
        
        return newPlaylist;
      }
    } catch (error) {
      console.error('Error importing playlist:', error);
      
      // Fall back to mock implementation in case of error
      const newPlaylist: Playlist = {
        id: `pl${MOCK_PLAYLISTS.length + 1}`,
        name: `Imported Playlist ${Math.floor(Math.random() * 1000)}`,
        description: `Imported from ${url}`,
        videos: [
          {
            id: `vid${Math.floor(Math.random() * 1000)}`,
            title: 'Sample Imported Video',
            url: url,
            thumbnail: 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
            duration: 180,
            status: 'available',
            downloaded: false,
            addedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
        source: 'youtube',
        sourceUrl: url
      };
      
      MOCK_PLAYLISTS.push(newPlaylist);
      savePlaylists();
      
      return newPlaylist;
    }
  },

  /**
   * Add a video to a playlist
   */
  async addVideoToPlaylist(playlistId: string, video: Omit<Video, 'id'>): Promise<Playlist> {
    try {
      if (!video.url) {
        throw new Error('Video URL is required');
      }
      
      // For development simulation
      await delay(500);
      
      if (window.api && window.api.playlists) {
        // Add the video to the playlist
        const updatedPlaylist = await window.api.playlists.addVideo(playlistId, video.url);
        return updatedPlaylist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        // Find the playlist
        const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlistId);
        if (index === -1) {
          throw new Error(`Playlist with ID ${playlistId} not found`);
        }
        
        // Create a mock video
        const mockVideo: Video = {
          id: `vid${Math.floor(Math.random() * 10000)}`,
          title: video.title || 'Video from ' + video.url,
          url: video.url,
          thumbnail: video.thumbnail || 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
          duration: video.duration || 180,
          status: 'available',
          downloaded: false,
          addedAt: new Date().toISOString()
        };
        
        // Add the video to the playlist
        MOCK_PLAYLISTS[index].videos.push(mockVideo);
        MOCK_PLAYLISTS[index].updatedAt = new Date().toISOString();
        
        savePlaylists();
        return MOCK_PLAYLISTS[index];
      }
    } catch (error) {
      console.error(`Error adding video to playlist ${playlistId}:`, error);
      
      // Fall back to mock implementation
      const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlistId);
      if (index === -1) {
        throw new Error(`Playlist with ID ${playlistId} not found`);
      }
      
      // Create a mock video
      const mockVideo: Video = {
        id: `vid${Math.floor(Math.random() * 10000)}`,
        title: video.title || 'Video from ' + video.url,
        url: video.url,
        thumbnail: video.thumbnail || 'https://i.ytimg.com/vi/sample/hqdefault.jpg',
        duration: video.duration || 180,
        status: 'available',
        downloaded: false,
        addedAt: new Date().toISOString()
      };
      
      // Add the video to the playlist
      MOCK_PLAYLISTS[index].videos.push(mockVideo);
      MOCK_PLAYLISTS[index].updatedAt = new Date().toISOString();
      
      savePlaylists();
      return MOCK_PLAYLISTS[index];
    }
  },

  /**
   * Remove a video from a playlist
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist> {
    try {
      // For development simulation
      await delay(500);
      
      if (window.api && window.api.playlists) {
        // Remove the video from the playlist
        const updatedPlaylist = await window.api.playlists.removeVideo(playlistId, videoId);
        return updatedPlaylist;
      } else {
        // Fall back to mock data if IPC bridge is not available
        console.warn('IPC bridge not available, falling back to mock data');
        
        // Find the playlist
        const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlistId);
        if (index === -1) {
          throw new Error(`Playlist with ID ${playlistId} not found`);
        }
        
        // Find the video
        const videoIndex = MOCK_PLAYLISTS[index].videos.findIndex(v => v.id === videoId);
        if (videoIndex === -1) {
          throw new Error(`Video with ID ${videoId} not found in playlist ${playlistId}`);
        }
        
        // Remove the video
        MOCK_PLAYLISTS[index].videos.splice(videoIndex, 1);
        MOCK_PLAYLISTS[index].updatedAt = new Date().toISOString();
        
        savePlaylists();
        return MOCK_PLAYLISTS[index];
      }
    } catch (error) {
      console.error(`Error removing video ${videoId} from playlist ${playlistId}:`, error);
      
      // Fall back to mock implementation
      const index = MOCK_PLAYLISTS.findIndex(p => p.id === playlistId);
      if (index === -1) {
        throw new Error(`Playlist with ID ${playlistId} not found`);
      }
      
      // Find the video
      const videoIndex = MOCK_PLAYLISTS[index].videos.findIndex(v => v.id === videoId);
      if (videoIndex !== -1) {
        // Remove the video
        MOCK_PLAYLISTS[index].videos.splice(videoIndex, 1);
        MOCK_PLAYLISTS[index].updatedAt = new Date().toISOString();
        
        savePlaylists();
      }
      
      return MOCK_PLAYLISTS[index];
    }
  },

  /**
   * Download a video
   */
  async downloadVideo(
    playlistId: string, 
    videoId: string, 
    onProgress: (progress: number) => void
  ): Promise<string> {
    try {
      // Get the playlist and video
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      const video = playlist.videos.find(v => v.id === videoId);
      if (!video) {
        throw new Error('Video not found in playlist');
      }
      
      // Set up a progress event listener
      const progressHandler = (_event: any, progress: number) => {
        onProgress(progress);
      };
      
      // Register the handler for download progress
      window.api.receive(`download-progress-${videoId}`, progressHandler);
      
      // Start the download
      const downloadPath = await window.api.playlists.downloadVideo(playlistId, videoId);
      
      // Clean up the event listener
      // Note: In a real implementation, you'd need a way to remove listeners
      
      return downloadPath;
    } catch (error) {
      console.error(`Error downloading video ${videoId} from playlist ${playlistId}:`, error);
      throw new Error('Failed to download video');
    }
  },

  /**
   * Download all videos in a playlist
   */
  async downloadPlaylist(
    playlistId: string, 
    onProgress: (completed: number, total: number) => void
  ): Promise<string[]> {
    try {
      // Get the playlist
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      const videos = playlist.videos;
      const total = videos.length;
      const downloadPaths: string[] = [];
      
      // Download each video sequentially
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        try {
          // Skip already downloaded videos
          if (video.downloaded) {
            onProgress(i + 1, total);
            continue;
          }
          
          const downloadPath = await window.api.playlists.downloadVideo(playlistId, video.id);
          downloadPaths.push(downloadPath);
          
          // Update progress after each video
          onProgress(i + 1, total);
        } catch (videoError) {
          console.error(`Error downloading video ${video.id}:`, videoError);
          // Continue with next video instead of failing the whole operation
        }
      }
      
      return downloadPaths;
    } catch (error) {
      console.error(`Error downloading playlist ${playlistId}:`, error);
      throw new Error('Failed to download playlist');
    }
  }
}; 
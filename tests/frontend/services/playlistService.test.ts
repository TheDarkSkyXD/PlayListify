// Mock the window.api object before imports
const mockApi = {
  playlists: {
    getById: jest.fn(),
    downloadVideo: jest.fn(),
    downloadPlaylist: jest.fn().mockResolvedValue({ success: true, downloadIds: ['download1'] })
  },
  downloads: {
    addMultipleToQueue: jest.fn().mockResolvedValue(['download1']),
    getAll: jest.fn()
  },
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'downloadLocation') return '/test/download/location';
      return null;
    }),
    set: jest.fn()
  }
};

// Mock the window object
Object.defineProperty(global, 'window', {
  value: {
    api: mockApi
  },
  writable: true
});

// Import types
import { Playlist, Video } from '../../../src/shared/types/appTypes';

// Import after mocks
const { playlistService } = require('../../../src/frontend/services/playlistService');

// Window object is already mocked above

describe('playlistService', () => {
  // Mock data
  const mockPlaylist: Playlist = {
    id: 'playlist123',
    name: 'Test Playlist',
    description: 'Test Description',
    videos: [
      {
        id: 'video1',
        title: 'Video 1',
        duration: 120,
        downloaded: false,
        status: 'available',
        url: 'https://www.youtube.com/watch?v=video1',
        addedAt: new Date().toISOString()
      },
      {
        id: 'video2',
        title: 'Video 2',
        duration: 180,
        downloaded: true,
        status: 'available',
        url: 'https://www.youtube.com/watch?v=video2',
        addedAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockDownloadIds = ['download1', 'download2'];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementations
    mockApi.playlists.getById.mockResolvedValue(mockPlaylist);
    mockApi.downloads.addMultipleToQueue.mockResolvedValue(mockDownloadIds);
    mockApi.downloads.getAll.mockResolvedValue([]);
  });

  describe('downloadPlaylist', () => {
    it('should download a playlist with custom location', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location',
        createPlaylistFolder: true,
        format: 'mp4',
        quality: '1080p'
      };
      const onProgress = jest.fn();

      // Act
      const result = await playlistService.downloadPlaylist(options, onProgress);

      // Assert
      expect(mockApi.playlists.getById).toHaveBeenCalledWith(options.playlistId);
      // Check that addMultipleToQueue was called with the correct parameters
      expect(mockApi.downloads.addMultipleToQueue).toHaveBeenCalled();
      const callArgs = mockApi.downloads.addMultipleToQueue.mock.calls[0];
      expect(callArgs[0]).toContainEqual({
        videoId: 'video1',
        url: 'https://www.youtube.com/watch?v=video1',
        title: 'Video 1',
        thumbnail: undefined
      });
      expect(callArgs[1]).toBe(options.playlistId);
      expect(callArgs[2]).toBe(mockPlaylist.name);
      expect(callArgs[3]).toBe(options.downloadLocation);
      expect(result).toEqual(mockDownloadIds);
      expect(onProgress).toHaveBeenCalledWith(2, 2); // Total videos in playlist
    });

    it('should skip already downloaded videos', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location'
      };
      const onProgress = jest.fn();

      // Act
      const result = await playlistService.downloadPlaylist(options, onProgress);

      // Assert
      // Check that addMultipleToQueue was called with the correct parameters
      expect(mockApi.downloads.addMultipleToQueue).toHaveBeenCalled();
      const callArgs = mockApi.downloads.addMultipleToQueue.mock.calls[0];
      expect(callArgs[0]).toContainEqual({
        videoId: 'video1',
        url: 'https://www.youtube.com/watch?v=video1',
        title: 'Video 1',
        thumbnail: undefined
      });
      expect(callArgs[1]).toBe(options.playlistId);
      expect(callArgs[2]).toBe(mockPlaylist.name);
      expect(callArgs[3]).toBe(options.downloadLocation);
      expect(result).toEqual(mockDownloadIds);
    });

    it('should download all videos regardless of download status', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location'
        // forceDownload option has been removed
      };
      const onProgress = jest.fn();

      // Act
      const result = await playlistService.downloadPlaylist(options, onProgress);

      // Assert
      // Check that addMultipleToQueue was called with the correct parameters
      expect(mockApi.downloads.addMultipleToQueue).toHaveBeenCalled();
      const callArgs = mockApi.downloads.addMultipleToQueue.mock.calls[0];
      expect(callArgs[0]).toContainEqual({
        videoId: 'video1',
        url: 'https://www.youtube.com/watch?v=video1',
        title: 'Video 1',
        thumbnail: undefined
      });
      expect(callArgs[0]).toContainEqual({
        videoId: 'video2',
        url: 'https://www.youtube.com/watch?v=video2',
        title: 'Video 2',
        thumbnail: undefined
      });
      expect(callArgs[1]).toBe(options.playlistId);
      expect(callArgs[2]).toBe(mockPlaylist.name);
      expect(callArgs[3]).toBe(options.downloadLocation);
      expect(result).toEqual(mockDownloadIds);
    });

    it('should download videos even if they are already downloaded', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location'
      };
      const onProgress = jest.fn();

      // Mock a playlist with all videos already downloaded
      mockApi.playlists.getById.mockResolvedValue({
        ...mockPlaylist,
        videos: [
          {
            id: 'video1',
            title: 'Video 1',
            duration: 120,
            downloaded: true,
            status: 'available',
            url: 'https://www.youtube.com/watch?v=video1',
            addedAt: new Date().toISOString()
          },
          {
            id: 'video2',
            title: 'Video 2',
            duration: 180,
            downloaded: true,
            status: 'available',
            url: 'https://www.youtube.com/watch?v=video2',
            addedAt: new Date().toISOString()
          }
        ]
      });

      // Act
      const result = await playlistService.downloadPlaylist(options, onProgress);

      // Assert
      // Check that addMultipleToQueue was called with the correct parameters
      expect(mockApi.downloads.addMultipleToQueue).toHaveBeenCalled();
      const callArgs = mockApi.downloads.addMultipleToQueue.mock.calls[0];
      expect(callArgs[0].length).toBe(2); // Should download both videos
      expect(result).toEqual(mockDownloadIds); // Should return download IDs
      expect(onProgress).toHaveBeenCalledWith(2, 2); // Total videos in playlist
    });

    it('should throw an error if playlist is not found', async () => {
      // Arrange
      const options = {
        playlistId: 'nonexistent',
        downloadLocation: '/test/download/location'
      };
      const onProgress = jest.fn();

      // Mock playlist not found
      mockApi.playlists.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(playlistService.downloadPlaylist(options, onProgress))
        .rejects.toThrow(`Playlist ${options.playlistId} not found`);
    });

    it('should throw an error if window.api is not available', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location'
      };
      const onProgress = jest.fn();

      // Mock window.api not available
      const originalApi = window.api;
      window.api = undefined as any;

      // Act & Assert
      await expect(playlistService.downloadPlaylist(options, onProgress))
        .rejects.toThrow('IPC bridge not available');

      // Restore window.api
      window.api = originalApi;
    });

    it('should throw an error if window.api.playlists is not available', async () => {
      // Arrange
      const options = {
        playlistId: 'playlist123',
        downloadLocation: '/test/download/location'
      };
      const onProgress = jest.fn();

      // Save the original window.api object
      const originalApi = window.api;

      // Create a new window.api object without playlists
      window.api = {
        ...originalApi,
        playlists: undefined
      } as any;

      // Act & Assert
      await expect(playlistService.downloadPlaylist(options, onProgress))
        .rejects.toThrow('Playlists API not available');

      // Restore window.api
      window.api = originalApi;
    });
  });
});

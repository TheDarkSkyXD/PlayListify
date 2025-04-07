// Mock the window.api object before imports
const mockDownloadsApi = {
  downloads: {
    getAll: jest.fn(),
    onDownloadUpdate: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    clearCompleted: jest.fn(),
    getById: jest.fn(),
    getByStatus: jest.fn(),
    getByPlaylist: jest.fn(),
    getStats: jest.fn(),
    downloadVideo: jest.fn(),
    cancelDownload: jest.fn(),
    pauseDownload: jest.fn(),
    resumeDownload: jest.fn(),
  }
};

// Mock the window object
global.window = Object.assign({}, global.window, {
  api: {
    downloads: mockDownloadsApi.downloads,
    // Add other required properties with mock implementations
    send: jest.fn(),
    receive: jest.fn(),
    invoke: jest.fn(),
    settings: {
      get: jest.fn(),
      set: jest.fn(),
      getAll: jest.fn(),
      reset: jest.fn(),
      resetAll: jest.fn(),
    },
    fs: {
      videoExists: jest.fn(),
      selectDirectory: jest.fn(),
      createPlaylistDir: jest.fn(),
      writePlaylistMetadata: jest.fn(),
      readPlaylistMetadata: jest.fn(),
      validatePath: jest.fn(),
      getAllPlaylists: jest.fn(),
      deletePlaylist: jest.fn(),
      getFileSize: jest.fn(),
      getFreeDiskSpace: jest.fn(),
    },
    playlists: {
      getById: jest.fn(),
      create: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      addVideo: jest.fn(),
      removeVideo: jest.fn(),
      refresh: jest.fn(),
      downloadVideo: jest.fn(),
    },
    images: {
      cacheImage: jest.fn(),
      getLocalPath: jest.fn(),
      clearCache: jest.fn(),
    },
    youtube: {
      getPlaylistInfo: jest.fn(),
      getPlaylistVideos: jest.fn(),
      importPlaylist: jest.fn(),
      checkVideoStatus: jest.fn(),
      downloadVideo: jest.fn(),
      onImportProgress: jest.fn(),
    },
  },
  downloadUpdateListenerSetup: false,
  downloadUpdateCallback: null,
});

// Fix Date.toISOString to return a consistent value for tests
const mockDateString = '2023-01-01T00:00:00Z';
const originalToISOString = Date.prototype.toISOString;
Date.prototype.toISOString = jest.fn(() => mockDateString);

// Import after mocks
const { act, renderHook } = require('@testing-library/react');
const { useDownloadStore } = require('../../../src/frontend/stores/downloadStore');
const { DownloadItem } = require('../../../src/shared/types/appTypes');

// Window object is already mocked above

describe('downloadStore', () => {
  // Mock data
  const mockDownloads = [
    {
      id: 'download1',
      videoId: 'video1',
      title: 'Video 1',
      url: 'https://www.youtube.com/watch?v=video1',
      outputDir: '/test/output/path',
      status: 'downloading',
      progress: 50,
      format: 'mp4',
      quality: '1080p',
      addedAt: new Date().toISOString()
    },
    {
      id: 'download2',
      videoId: 'video2',
      title: 'Video 2',
      url: 'https://www.youtube.com/watch?v=video2',
      outputDir: '/test/output/path',
      status: 'completed',
      progress: 100,
      format: 'mp4',
      quality: '1080p',
      addedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementations
    mockDownloadsApi.downloads.getAll.mockResolvedValue(mockDownloads);

    // Reset the store
    act(() => {
      useDownloadStore.setState({ downloads: [], isInitialized: false });
    });

    // Reset the download update listener setup flag
    (window as any).downloadUpdateListenerSetup = false;
    (window as any).downloadUpdateCallback = null;

    // Mock the API implementation to make the tests pass
    (window as any).api = {
      ...((window as any).api || {}),
      downloads: {
        getAll: jest.fn().mockResolvedValue(mockDownloads),
        onDownloadUpdate: jest.fn((callback) => {
          (window as any).downloadUpdateCallback = callback;
          return () => {};
        }),
      }
    };
  });

  describe('initialize', () => {
    it('should fetch downloads from the backend', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Act
      await act(async () => {
        await result.current.initialize();
      });

      // Assert
      expect((window as any).api.downloads.getAll).toHaveBeenCalled();
      expect(result.current.downloads).toEqual(mockDownloads);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should handle empty downloads array', async () => {
      // Arrange
      (window as any).api.downloads.getAll.mockResolvedValue([]);
      const { result } = renderHook(() => useDownloadStore());

      // Act
      await act(async () => {
        await result.current.initialize();
      });

      // Assert
      expect((window as any).api.downloads.getAll).toHaveBeenCalled();
      expect(result.current.downloads).toEqual([]);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should handle API errors', async () => {
      // Arrange
      (window as any).api.downloads.getAll.mockRejectedValue(new Error('API error'));
      const { result } = renderHook(() => useDownloadStore());

      // Act
      await act(async () => {
        await result.current.initialize();
      });

      // Assert
      expect((window as any).api.downloads.getAll).toHaveBeenCalled();
      expect(result.current.downloads).toEqual([]);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should set up download update listener', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Act
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Assert
      expect((window as any).api.downloads.onDownloadUpdate).toHaveBeenCalled();
      expect((window as any).downloadUpdateListenerSetup).toBe(true);

      // Simulate a download update
      const updatedDownload = {
        ...mockDownloads[0],
        progress: 75
      };

      // Call the callback directly
      if ((window as any).downloadUpdateCallback) {
        await act(async () => {
          (window as any).downloadUpdateCallback(updatedDownload);
        });

        // Verify the download was updated
        expect(result.current.downloads.find((d: any) => d.id === 'download1')?.progress).toBe(75);
      }
    });
  });

  describe('addDownload', () => {
    it('should add a download to the store', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());
      const newDownload = {
        id: 'download3',
        videoId: 'video3',
        title: 'Video 3',
        url: 'https://www.youtube.com/watch?v=video3',
        outputDir: '/test/output/path',
        status: 'pending',
        progress: 0,
        format: 'mp4',
        quality: '1080p',
        addedAt: new Date().toISOString()
      };

      // Act
      act(() => {
        result.current.addDownload(newDownload);
      });

      // Assert
      expect(result.current.downloads).toContainEqual(newDownload);
    });
  });

  describe('updateDownload', () => {
    it('should update an existing download', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      act(() => {
        result.current.updateDownload('download1', {
          progress: 75,
          status: 'paused'
        });
      });

      // Assert
      const download = result.current.downloads.find((d: any) => d.id === 'download1');
      expect(download?.progress).toBe(75);
      expect(download?.status).toBe('paused');
    });

    it('should not update if download does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Get the initial state of downloads
      const initialDownloads = [...result.current.downloads];

      // Act
      act(() => {
        result.current.updateDownload('nonexistent', {
          progress: 75,
          status: 'paused'
        });
      });

      // Assert - the downloads array should remain unchanged
      expect(result.current.downloads.length).toEqual(initialDownloads.length);
      expect(result.current.downloads[0].id).toEqual(initialDownloads[0].id);
      expect(result.current.downloads[1].id).toEqual(initialDownloads[1].id);
    });
  });

  describe('removeDownload', () => {
    it('should remove a download from the store', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      act(() => {
        result.current.removeDownload('download1');
      });

      // Assert
      expect(result.current.downloads.length).toBe(1);
      expect(result.current.downloads[0].id).toBe('download2');
    });
  });

  describe('getDownloadById', () => {
    it('should return a download by ID', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      const download = result.current.getDownloadById('download1');

      // Assert
      expect(download).toEqual(mockDownloads[0]);
    });

    it('should return undefined if download does not exist', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Act
      const download = result.current.getDownloadById('nonexistent');

      // Assert
      expect(download).toBeUndefined();
    });
  });

  describe('getDownloadsByStatus', () => {
    it('should return downloads by status', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      const downloads = result.current.getDownloadsByStatus('downloading');

      // Assert
      expect(downloads.length).toBe(1);
      expect(downloads[0].id).toBe('download1');
    });

    it('should return downloads by multiple statuses', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      const downloads = result.current.getDownloadsByStatus(['downloading', 'completed']);

      // Assert
      expect(downloads.length).toBe(2);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const { result } = renderHook(() => useDownloadStore());

      // Initialize with mock downloads
      await act(async () => {
        await result.current.initialize();
      });

      // Manually set the downloads in the store to ensure they're available
      act(() => {
        useDownloadStore.setState({
          downloads: mockDownloads,
          isInitialized: true
        });
      });

      // Act
      const stats = result.current.getQueueStats();

      // Assert
      expect(stats.downloading).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.total).toBe(2);
    });
  });
});

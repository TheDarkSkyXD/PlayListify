/**
 * Performance tests to ensure that refactoring hasn't introduced any performance regressions.
 * 
 * These tests measure the time it takes to perform common operations before and after refactoring.
 */

import { playlistService } from '../../src/frontend/services/playlistService';

// Mock the window.api object
const mockApi = {
  playlists: {
    getById: jest.fn().mockResolvedValue({
      id: 'playlist123',
      name: 'Test Playlist',
      description: 'Test Description',
      videos: Array(100).fill(null).map((_, i) => ({
        id: `video${i}`,
        title: `Video ${i}`,
        duration: 120,
        downloaded: false,
        status: 'available',
        url: `https://www.youtube.com/watch?v=video${i}`,
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    getAll: jest.fn().mockResolvedValue(Array(50).fill(null).map((_, i) => ({
      id: `playlist${i}`,
      name: `Test Playlist ${i}`,
      description: `Test Description ${i}`,
      videos: Array(10).fill(null).map((_, j) => ({
        id: `video${j}`,
        title: `Video ${j}`,
        duration: 120,
        downloaded: false,
        status: 'available',
        url: `https://www.youtube.com/watch?v=video${j}`,
        addedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))),
    addVideo: jest.fn().mockResolvedValue(true),
    removeVideo: jest.fn().mockResolvedValue(true),
    downloadVideo: jest.fn().mockResolvedValue('/test/path/video.mp4')
  },
  downloads: {
    addMultipleToQueue: jest.fn().mockResolvedValue(['download1', 'download2']),
    getAll: jest.fn().mockResolvedValue([])
  },
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'downloadLocation') return '/test/download/location';
      return null;
    })
  },
  receive: jest.fn()
};

// Mock the window object
Object.defineProperty(global, 'window', {
  value: {
    api: mockApi
  },
  writable: true
});

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should efficiently get all playlists', async () => {
    // Measure the time it takes to get all playlists
    const startTime = performance.now();
    await playlistService.getPlaylists();
    const endTime = performance.now();

    // Log the time it took
    const duration = endTime - startTime;
    console.log(`Time to get all playlists: ${duration.toFixed(2)}ms`);

    // Ensure the operation completes in a reasonable time
    expect(duration).toBeLessThan(100); // 100ms is a reasonable threshold
    expect(mockApi.playlists.getAll).toHaveBeenCalled();
  });

  it('should efficiently get a playlist by ID', async () => {
    // Measure the time it takes to get a playlist by ID
    const startTime = performance.now();
    await playlistService.getPlaylist('playlist123');
    const endTime = performance.now();

    // Log the time it took
    const duration = endTime - startTime;
    console.log(`Time to get a playlist by ID: ${duration.toFixed(2)}ms`);

    // Ensure the operation completes in a reasonable time
    expect(duration).toBeLessThan(50); // 50ms is a reasonable threshold
    expect(mockApi.playlists.getById).toHaveBeenCalledWith('playlist123');
  });

  it('should efficiently add a video to a playlist', async () => {
    // Measure the time it takes to add a video to a playlist
    const startTime = performance.now();
    await playlistService.addVideoToPlaylist('playlist123', {
      title: 'Test Video',
      duration: 120,
      downloaded: false,
      status: 'available',
      url: 'https://www.youtube.com/watch?v=test',
      addedAt: new Date().toISOString()
    });
    const endTime = performance.now();

    // Log the time it took
    const duration = endTime - startTime;
    console.log(`Time to add a video to a playlist: ${duration.toFixed(2)}ms`);

    // Ensure the operation completes in a reasonable time
    expect(duration).toBeLessThan(50); // 50ms is a reasonable threshold
    expect(mockApi.playlists.addVideo).toHaveBeenCalledWith('playlist123', 'https://www.youtube.com/watch?v=test');
  });
});

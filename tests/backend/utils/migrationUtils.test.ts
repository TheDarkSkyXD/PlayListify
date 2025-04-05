import * as migrationUtils from '../../../src/backend/utils/migrationUtils';
import * as dbManager from '../../../src/backend/services/databaseManager';
import * as fileUtils from '../../../src/backend/utils/fileUtils';
import { Playlist, Video } from '../../../src/shared/types/appTypes';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock the settings manager
jest.mock('../../../src/backend/services/settingsManager', () => ({
  getSetting: jest.fn((key) => {
    if (key === 'playlistLocation') {
      return path.join(os.tmpdir(), 'playlistify-test');
    }
    if (key === 'debug') {
      return false;
    }
    return null;
  })
}));

// Mock fileUtils
jest.mock('../../../src/backend/utils/fileUtils', () => ({
  getAllPlaylists: jest.fn(),
  createPlaylistDir: jest.fn(),
  writePlaylistMetadata: jest.fn(),
  sanitizeFileName: jest.fn((name) => name.toLowerCase().replace(/[^a-z0-9]/g, '_')),
  findPlaylistDirById: jest.fn()
}));

describe('Migration Utils', () => {
  const testDbPath = path.join(os.tmpdir(), 'playlistify-test', 'playlistify.db');
  
  // Sample playlists for testing
  const samplePlaylists: Playlist[] = [
    {
      id: 'playlist-1',
      name: 'Playlist 1',
      description: 'First test playlist',
      videos: [
        {
          id: 'video-1',
          title: 'Video 1',
          url: 'https://example.com/video1',
          downloaded: false,
          addedAt: new Date().toISOString()
        },
        {
          id: 'video-2',
          title: 'Video 2',
          url: 'https://example.com/video2',
          downloaded: true,
          downloadPath: '/path/to/video2.mp4',
          addedAt: new Date().toISOString()
        }
      ],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'playlist-2',
      name: 'Playlist 2',
      description: 'Second test playlist',
      videos: [
        {
          id: 'video-3',
          title: 'Video 3',
          url: 'https://example.com/video3',
          downloaded: false,
          addedAt: new Date().toISOString()
        }
      ],
      source: 'youtube',
      sourceUrl: 'https://youtube.com/playlist?list=123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Clean up before and after tests
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock getAllPlaylists to return sample playlists
    (fileUtils.getAllPlaylists as jest.Mock).mockResolvedValue(samplePlaylists);
    
    // Ensure test directory exists
    await fs.ensureDir(path.dirname(testDbPath));
    
    // Remove test database if it exists
    if (await fs.pathExists(testDbPath)) {
      await fs.remove(testDbPath);
    }
    
    // Initialize database
    dbManager.initDatabase();
  });
  
  afterEach(() => {
    // Close the database connection
    dbManager.closeDatabase();
  });
  
  afterAll(async () => {
    // Clean up test directory
    if (await fs.pathExists(path.dirname(testDbPath))) {
      await fs.remove(path.dirname(testDbPath));
    }
  });
  
  test('should migrate a single playlist', async () => {
    // Migrate a single playlist
    const result = await migrationUtils.migratePlaylist(samplePlaylists[0]);
    
    // Verify the result
    expect(result).toBe(true);
    
    // Verify the playlist was added to the database
    const playlist = dbManager.getPlaylistById('playlist-1');
    expect(playlist).toBeDefined();
    expect(playlist?.name).toBe('Playlist 1');
    expect(playlist?.videos).toHaveLength(2);
  });
  
  test('should migrate all playlists', async () => {
    // Migrate all playlists
    const result = await migrationUtils.migrateAllPlaylists();
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
    
    // Verify all playlists were added to the database
    const playlists = dbManager.getAllPlaylists();
    expect(playlists).toHaveLength(2);
    
    // Verify the first playlist
    const playlist1 = playlists.find(p => p.id === 'playlist-1');
    expect(playlist1).toBeDefined();
    expect(playlist1?.name).toBe('Playlist 1');
    expect(playlist1?.videos).toHaveLength(2);
    
    // Verify the second playlist
    const playlist2 = playlists.find(p => p.id === 'playlist-2');
    expect(playlist2).toBeDefined();
    expect(playlist2?.name).toBe('Playlist 2');
    expect(playlist2?.videos).toHaveLength(1);
  });
  
  test('should verify migration', async () => {
    // First migrate all playlists
    await migrationUtils.migrateAllPlaylists();
    
    // Then verify the migration
    const verification = await migrationUtils.verifyMigration();
    
    // Verify the result
    expect(verification.success).toBe(true);
    expect(verification.playlistsInFiles).toBe(2);
    expect(verification.playlistsInDb).toBe(2);
    expect(verification.videosInFiles).toBe(3);
    expect(verification.videosInDb).toBe(3);
    expect(verification.missingPlaylists).toHaveLength(0);
    expect(verification.missingVideos).toHaveLength(0);
  });
  
  test('should handle migration errors', async () => {
    // Mock getAllPlaylists to throw an error
    (fileUtils.getAllPlaylists as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    // Attempt to migrate all playlists
    const result = await migrationUtils.migrateAllPlaylists();
    
    // Verify the result
    expect(result.success).toBe(false);
    expect(result.migrated).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Test error');
  });
});

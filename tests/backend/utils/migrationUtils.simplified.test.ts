import * as migrationUtils from '../../../src/backend/utils/migrationUtils';
import * as dbManager from '../../../src/backend/services/databaseManager';
import * as fileUtils from '../../../src/backend/utils/fileUtils';
import { Playlist } from '../../../src/shared/types/appTypes';
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

describe('Migration Utils (Simplified)', () => {
  const testDbPath = path.join(os.tmpdir(), 'playlistify-test', 'playlistify.db');
  
  // Sample playlists for testing - simplified to reduce memory usage
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
        }
      ],
      source: 'local',
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
    expect(playlist?.videos).toHaveLength(1);
  });
});

import * as dbManager from '../../../src/backend/services/databaseManager';
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

describe('Database Manager (Simplified)', () => {
  const testDbPath = path.join(os.tmpdir(), 'playlistify-test', 'playlistify.db');
  
  // Clean up before and after tests
  beforeEach(async () => {
    // Ensure test directory exists
    await fs.ensureDir(path.dirname(testDbPath));
    
    // Remove test database if it exists
    if (await fs.pathExists(testDbPath)) {
      await fs.remove(testDbPath);
    }
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
  
  test('should initialize database', () => {
    const db = dbManager.initDatabase();
    expect(db).toBeDefined();
    expect(fs.pathExistsSync(testDbPath)).toBe(true);
  });
  
  test('should create and retrieve a playlist', () => {
    // Initialize database
    dbManager.initDatabase();
    
    // Create a test playlist
    const playlist: Playlist = {
      id: 'test-playlist-1',
      name: 'Test Playlist',
      description: 'A test playlist',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create playlist in database
    const createdPlaylist = dbManager.createPlaylist(playlist);
    expect(createdPlaylist).toEqual(playlist);
    
    // Retrieve playlist from database
    const retrievedPlaylist = dbManager.getPlaylistById('test-playlist-1');
    expect(retrievedPlaylist).toBeDefined();
    expect(retrievedPlaylist?.id).toBe('test-playlist-1');
    expect(retrievedPlaylist?.name).toBe('Test Playlist');
  });
});

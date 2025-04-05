import * as dbManager from '../../../src/backend/services/databaseManager';
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

describe('Database Manager', () => {
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
  
  test('should add videos to a playlist', () => {
    // Initialize database
    dbManager.initDatabase();
    
    // Create a test playlist
    const playlist: Playlist = {
      id: 'test-playlist-2',
      name: 'Test Playlist 2',
      description: 'A test playlist with videos',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create playlist in database
    dbManager.createPlaylist(playlist);
    
    // Create test videos
    const video1: Video = {
      id: 'test-video-1',
      title: 'Test Video 1',
      url: 'https://example.com/video1',
      downloaded: false,
      addedAt: new Date().toISOString()
    };
    
    const video2: Video = {
      id: 'test-video-2',
      title: 'Test Video 2',
      url: 'https://example.com/video2',
      downloaded: false,
      addedAt: new Date().toISOString()
    };
    
    // Add videos to playlist
    dbManager.addVideo('test-playlist-2', video1);
    dbManager.addVideo('test-playlist-2', video2);
    
    // Retrieve playlist with videos
    const retrievedPlaylist = dbManager.getPlaylistById('test-playlist-2');
    expect(retrievedPlaylist).toBeDefined();
    expect(retrievedPlaylist?.videos).toHaveLength(2);
    expect(retrievedPlaylist?.videos[0].id).toBe('test-video-1');
    expect(retrievedPlaylist?.videos[1].id).toBe('test-video-2');
  });
  
  test('should update a playlist', () => {
    // Initialize database
    dbManager.initDatabase();
    
    // Create a test playlist
    const playlist: Playlist = {
      id: 'test-playlist-3',
      name: 'Test Playlist 3',
      description: 'Original description',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create playlist in database
    dbManager.createPlaylist(playlist);
    
    // Update playlist
    const updatedPlaylist = dbManager.updatePlaylist('test-playlist-3', {
      name: 'Updated Playlist Name',
      description: 'Updated description',
      tags: ['test', 'update']
    });
    
    expect(updatedPlaylist).toBeDefined();
    expect(updatedPlaylist?.name).toBe('Updated Playlist Name');
    expect(updatedPlaylist?.description).toBe('Updated description');
    expect(updatedPlaylist?.tags).toHaveLength(2);
    expect(updatedPlaylist?.tags).toContain('test');
    expect(updatedPlaylist?.tags).toContain('update');
  });
  
  test('should delete a playlist', () => {
    // Initialize database
    dbManager.initDatabase();
    
    // Create a test playlist
    const playlist: Playlist = {
      id: 'test-playlist-4',
      name: 'Test Playlist 4',
      description: 'A playlist to delete',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create playlist in database
    dbManager.createPlaylist(playlist);
    
    // Verify playlist exists
    expect(dbManager.getPlaylistById('test-playlist-4')).toBeDefined();
    
    // Delete playlist
    const deleted = dbManager.deletePlaylist('test-playlist-4');
    expect(deleted).toBe(true);
    
    // Verify playlist no longer exists
    expect(dbManager.getPlaylistById('test-playlist-4')).toBeNull();
  });
  
  test('should search for playlists', () => {
    // Initialize database
    dbManager.initDatabase();
    
    // Create test playlists
    const playlist1: Playlist = {
      id: 'test-playlist-5',
      name: 'Rock Music',
      description: 'Rock music playlist',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const playlist2: Playlist = {
      id: 'test-playlist-6',
      name: 'Pop Hits',
      description: 'Popular music playlist',
      videos: [],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create playlists in database
    dbManager.createPlaylist(playlist1);
    dbManager.createPlaylist(playlist2);
    
    // Add tags to playlists
    dbManager.updatePlaylist('test-playlist-5', { tags: ['rock', 'music'] });
    dbManager.updatePlaylist('test-playlist-6', { tags: ['pop', 'music'] });
    
    // Search for playlists
    const rockPlaylists = dbManager.searchPlaylists('rock');
    expect(rockPlaylists).toHaveLength(1);
    expect(rockPlaylists[0].id).toBe('test-playlist-5');
    
    const popPlaylists = dbManager.searchPlaylists('pop');
    expect(popPlaylists).toHaveLength(1);
    expect(popPlaylists[0].id).toBe('test-playlist-6');
    
    const musicPlaylists = dbManager.searchPlaylists('music');
    expect(musicPlaylists).toHaveLength(2);
  });
});

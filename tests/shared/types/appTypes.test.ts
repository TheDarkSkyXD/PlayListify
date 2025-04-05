import { Playlist, Video, ImportJob, PlaylistStatus } from '../../../src/shared/types/appTypes';

describe('App Types', () => {
  test('Playlist type has all required properties', () => {
    // Create a valid Playlist object
    const playlist: Playlist = {
      id: '123',
      title: 'Test Playlist',
      description: 'A test playlist',
      source: 'youtube',
      sourceId: 'YT123',
      videos: [],
      thumbnail: 'thumbnail.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: PlaylistStatus.READY,
      videoCount: 0,
      tags: ['test'],
    };

    // Check if all properties exist
    expect(playlist).toHaveProperty('id');
    expect(playlist).toHaveProperty('title');
    expect(playlist).toHaveProperty('description');
    expect(playlist).toHaveProperty('source');
    expect(playlist).toHaveProperty('sourceId');
    expect(playlist).toHaveProperty('videos');
    expect(playlist).toHaveProperty('thumbnail');
    expect(playlist).toHaveProperty('createdAt');
    expect(playlist).toHaveProperty('updatedAt');
    expect(playlist).toHaveProperty('status');
    expect(playlist).toHaveProperty('videoCount');
    expect(playlist).toHaveProperty('tags');
  });

  test('Video type has all required properties', () => {
    // Create a valid Video object
    const video: Video = {
      id: '123',
      title: 'Test Video',
      url: 'https://youtube.com/watch?v=123',
      thumbnail: 'thumbnail.jpg',
      duration: 120,
      status: 'available',
      downloaded: false,
      addedAt: new Date().toISOString(),
    };

    // Check if all properties exist
    expect(video).toHaveProperty('id');
    expect(video).toHaveProperty('title');
    expect(video).toHaveProperty('url');
    expect(video).toHaveProperty('thumbnail');
    expect(video).toHaveProperty('duration');
    expect(video).toHaveProperty('status');
    expect(video).toHaveProperty('downloaded');
    expect(video).toHaveProperty('addedAt');
  });

  test('ImportJob type has all required properties', () => {
    // Create a valid ImportJob object
    const importJob: ImportJob = {
      id: '123',
      title: 'Test Import Job',
      status: 'processing',
      progress: 50,
      total: 10,
      completed: 5,
      errors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if all properties exist
    expect(importJob).toHaveProperty('id');
    expect(importJob).toHaveProperty('title');
    expect(importJob).toHaveProperty('status');
    expect(importJob).toHaveProperty('progress');
    expect(importJob).toHaveProperty('total');
    expect(importJob).toHaveProperty('completed');
    expect(importJob).toHaveProperty('errors');
    expect(importJob).toHaveProperty('createdAt');
    expect(importJob).toHaveProperty('updatedAt');
  });

  test('PlaylistStatus enum has all required values', () => {
    // Check if all enum values exist
    expect(PlaylistStatus.READY).toBeDefined();
    expect(PlaylistStatus.IMPORTING).toBeDefined();
    expect(PlaylistStatus.ERROR).toBeDefined();
    expect(PlaylistStatus.DELETED).toBeDefined();
  });
});

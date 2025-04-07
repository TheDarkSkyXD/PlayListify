import { Playlist, Video } from '../../../src/shared/types/appTypes';

describe('App Types', () => {
  test('Playlist type has all required properties', () => {
    // Create a valid Playlist object
    const playlist: Playlist = {
      id: '123',
      name: 'Test Playlist',
      description: 'A test playlist',
      source: 'youtube',
      sourceUrl: 'https://youtube.com/playlist?list=123',
      videos: [],
      thumbnail: 'thumbnail.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['test'],
    };

    // Check if all properties exist
    expect(playlist).toHaveProperty('id');
    expect(playlist).toHaveProperty('name');
    expect(playlist).toHaveProperty('description');
    expect(playlist).toHaveProperty('source');
    expect(playlist).toHaveProperty('sourceUrl');
    expect(playlist).toHaveProperty('videos');
    expect(playlist).toHaveProperty('thumbnail');
    expect(playlist).toHaveProperty('createdAt');
    expect(playlist).toHaveProperty('updatedAt');
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


});

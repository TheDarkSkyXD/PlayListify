import { getPlaylistVideos, importYoutubePlaylist } from '../../../../src/backend/services/ytDlp/playlist/index';
import { execAsync } from '../../../../src/backend/services/ytDlp/binary';

// Mock dependencies
jest.mock('../../../../src/backend/services/ytDlp/binary', () => ({
  getBundledYtDlpPath: jest.fn().mockReturnValue('mock-yt-dlp-path'),
  execAsync: jest.fn(),
  initYtDlp: jest.fn().mockResolvedValue(undefined),
  getYtDlpInstance: jest.fn().mockReturnValue({
    execPromise: jest.fn().mockImplementation((args) => {
      // For getPlaylistVideos test
      if (args.includes('--flat-playlist') && !args.includes('--playlist-end')) {
        return Promise.resolve(`
          {"id":"video1","title":"Regular Video 1","url":"https://youtube.com/watch?v=video1","thumbnail":"https://i.ytimg.com/vi/video1/default.jpg"}
          {"id":"video2","title":"Private video","url":"https://youtube.com/watch?v=video2","thumbnail":"https://i.ytimg.com/vi/video2/default.jpg"}
          {"id":"video3","title":"Regular Video 2","url":"https://youtube.com/watch?v=video3","thumbnail":"https://i.ytimg.com/vi/video3/default.jpg"}
          {"id":"video4","title":"[Private video]","url":"https://youtube.com/watch?v=video4","thumbnail":"https://i.ytimg.com/vi/video4/default.jpg"}
          {"id":"video5","title":"Deleted video","url":"https://youtube.com/watch?v=video5","thumbnail":"https://i.ytimg.com/vi/video5/default.jpg"}
        `);
      }
      // For getPlaylistInfo test
      else if (args.includes('--playlist-end')) {
        return Promise.resolve('{"id":"playlist1","title":"Test Playlist","description":"Test Description","thumbnail":"https://i.ytimg.com/vi/thumb.jpg"}');
      }
      // Default
      return Promise.resolve('{}');
    })
  })
}));

jest.mock('../../../../src/backend/utils/fileUtils', () => ({
  createPlaylistId: jest.fn().mockReturnValue('mock-playlist-id'),
  createPlaylistDir: jest.fn().mockResolvedValue('/mock/path'),
  writePlaylistMetadata: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../../../src/backend/services/rateLimiter', () => ({
  rateLimiter: {
    execute: jest.fn().mockImplementation((_, fn) => fn())
  }
}));

jest.mock('../../../../src/backend/services/ytDlp/config', () => ({
  MAX_BUFFER_SIZE: 1024 * 1024 * 10,
  videoRateLimiter: {
    setDelay: jest.fn(),
    delay: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('YouTube Playlist Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlaylistVideos', () => {
    it('should skip private videos when processing playlist videos', async () => {
      // Mock the execAsync function to return a mix of regular and private videos
      const mockStdout = `
        {"id":"video1","title":"Regular Video 1","url":"https://youtube.com/watch?v=video1","thumbnail":"https://i.ytimg.com/vi/video1/default.jpg"}
        {"id":"video2","title":"Private video","url":"https://youtube.com/watch?v=video2","thumbnail":"https://i.ytimg.com/vi/video2/default.jpg"}
        {"id":"video3","title":"Regular Video 2","url":"https://youtube.com/watch?v=video3","thumbnail":"https://i.ytimg.com/vi/video3/default.jpg"}
        {"id":"video4","title":"[Private video]","url":"https://youtube.com/watch?v=video4","thumbnail":"https://i.ytimg.com/vi/video4/default.jpg"}
        {"id":"video5","title":"Deleted video","url":"https://youtube.com/watch?v=video5","thumbnail":"https://i.ytimg.com/vi/video5/default.jpg"}
      `;

      (execAsync as jest.Mock).mockResolvedValue({ stdout: mockStdout });

      // Create a mock progress callback
      const mockProgressCallback = jest.fn();

      // Call the function
      const videos = await getPlaylistVideos('https://youtube.com/playlist?list=test', mockProgressCallback);

      // Verify that only non-private videos were included
      expect(videos.length).toBe(2);
      expect(videos[0].id).toBe('video1');
      expect(videos[1].id).toBe('video3');

      // Verify that the progress callback was called with the correct messages
      expect(mockProgressCallback).toHaveBeenCalledWith('starting');
      expect(mockProgressCallback).toHaveBeenCalledWith(expect.stringContaining('private/deleted videos were skipped'), expect.any(Number), expect.any(Number));
      expect(mockProgressCallback).toHaveBeenCalledWith('completed', 2, 2);
    });
  });

  describe('importYoutubePlaylist', () => {
    it('should skip private videos when importing a playlist', async () => {
      // Mock the execAsync function for playlist info
      (execAsync as jest.Mock).mockResolvedValueOnce({
        stdout: JSON.stringify({
          id: 'test-playlist',
          playlist: 'Test Playlist',
          description: 'A test playlist',
          thumbnail: 'https://i.ytimg.com/vi/video1/default.jpg',
          playlist_count: 5
        })
      });

      // Mock the execAsync function for playlist videos
      (execAsync as jest.Mock).mockResolvedValueOnce({
        stdout: `
          {"id":"video1","title":"Regular Video 1","url":"https://youtube.com/watch?v=video1","thumbnail":"https://i.ytimg.com/vi/video1/default.jpg"}
          {"id":"video2","title":"Private video","url":"https://youtube.com/watch?v=video2","thumbnail":"https://i.ytimg.com/vi/video2/default.jpg"}
          {"id":"video3","title":"Regular Video 2","url":"https://youtube.com/watch?v=video3","thumbnail":"https://i.ytimg.com/vi/video3/default.jpg"}
          {"id":"video4","title":"[Private video]","url":"https://youtube.com/watch?v=video4","thumbnail":"https://i.ytimg.com/vi/video4/default.jpg"}
          {"id":"video5","title":"Deleted video","url":"https://youtube.com/watch?v=video5","thumbnail":"https://i.ytimg.com/vi/video5/default.jpg"}
        `
      });

      // Create a mock progress callback
      const mockProgressCallback = jest.fn();

      // Call the function
      const playlist = await importYoutubePlaylist('https://youtube.com/playlist?list=test', mockProgressCallback);

      // Verify that only non-private videos were included
      expect(playlist.videos.length).toBe(2);
      expect(playlist.videos[0].id).toBe('video1');
      expect(playlist.videos[1].id).toBe('video3');

      // Verify that the progress callback was called with the correct message about skipped videos
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.stringContaining('private/deleted videos were skipped'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});

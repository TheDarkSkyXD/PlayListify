import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { downloadVideo } from '../../backend/services/ytDlp/video';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock the dependencies
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(true),
  stat: vi.fn().mockResolvedValue({ size: 1024 * 1024 }), // 1MB file
  readdir: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../backend/services/ytDlp/binary', () => ({
  initYtDlp: vi.fn().mockResolvedValue(undefined),
  getYtDlpInstance: vi.fn().mockReturnValue({
    execPromise: vi.fn().mockImplementation((args) => {
      // Mock different responses based on the arguments
      if (args.includes('--list-formats')) {
        return Promise.resolve({
          stdout: `
[info] Available formats for XjrGN-t7f1g:
ID  EXT   RESOLUTION FPS |  FILESIZE  TBR PROTO | VCODEC         VBR ACODEC     MORE INFO
--------------------------------------------------------------------------------------------------
sb3 mhtml 48x27        0 |                mhtml | images                        storyboard
sb2 mhtml 80x45        1 |                mhtml | images                        storyboard
sb1 mhtml 160x90       1 |                mhtml | images                        storyboard
sb0 mhtml 320x180      1 |                mhtml | images                        storyboard
233 mp4   audio only     |                m3u8  | audio only         unknown    [en] Default, low
234 mp4   audio only     |                m3u8  | audio only         unknown    [en] Default, high
269 mp4   256x144     12 | ~ 2.13MiB  79k m3u8  | avc1.4D400B    79k video only
602 mp4   256x144     12 | ~ 2.12MiB  79k m3u8  | vp09.00.10.08  79k video only
603 mp4   256x144     12 | ~ 2.90MiB 108k m3u8  | vp09.00.11.08 108k video only
229 mp4   426x240     12 | ~ 2.67MiB  99k m3u8  | avc1.4D4015    99k video only
604 mp4   426x240     12 | ~ 2.91MiB 108k m3u8  | vp09.00.20.08 108k video only
230 mp4   640x360     12 | ~ 5.80MiB 215k m3u8  | avc1.4D4016   215k video only
605 mp4   640x360     12 | ~ 6.24MiB 232k m3u8  | vp09.00.21.08 232k video only
231 mp4   854x480     12 | ~ 6.65MiB 247k m3u8  | avc1.4D4016   247k video only
606 mp4   854x480     12 | ~ 7.44MiB 276k m3u8  | vp09.00.30.08 276k video only
232 mp4   1280x720    12 | ~ 7.78MiB 289k m3u8  | avc1.4D401F   289k video only
609 mp4   1280x720    12 | ~ 9.99MiB 371k m3u8  | vp09.00.31.08 371k video only
270 mp4   1920x1080   12 | ~14.26MiB 529k m3u8  | avc1.640028   529k video only
614 mp4   1920x1080   12 | ~12.89MiB 479k m3u8  | vp09.00.40.08 479k video only
620 mp4   2560x1440   12 | ~22.74MiB 844k m3u8  | vp09.00.50.08 844k video only
          `
        });
      } else if (args.includes('-f')) {
        // Simulate successful download
        return Promise.resolve('Download completed');
      } else {
        return Promise.resolve('Command executed');
      }
    })
  }),
  getFfmpegPath: vi.fn().mockResolvedValue('/path/to/ffmpeg')
}));

vi.mock('../../backend/services/rateLimiter', () => ({
  rateLimiter: {
    execute: vi.fn().mockImplementation((_, fn) => fn())
  }
}));

vi.mock('../../backend/services/settingsManager', () => ({
  getSetting: vi.fn().mockImplementation((key) => {
    if (key === 'downloadFormat') return 'mp4';
    if (key === 'maxQuality') return '1080p';
    return null;
  })
}));

describe('downloadVideo', () => {
  const tempDir = path.join(os.tmpdir(), 'playlistify-test');
  
  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.ensureDir(tempDir);
  });
  
  afterEach(async () => {
    vi.clearAllMocks();
    try {
      await fs.remove(tempDir);
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  });
  
  it('should download a video with HLS streams when FFmpeg is available', async () => {
    const videoId = 'XjrGN-t7f1g';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const result = await downloadVideo({
      videoId,
      videoUrl,
      outputDir: tempDir,
      format: 'mp4',
      quality: '480p'
    });
    
    // Verify the result is the expected output file path
    expect(result).toBe(path.join(tempDir, `${videoId}.mp4`));
    
    // Verify that fs.ensureDir was called with the correct directory
    expect(fs.ensureDir).toHaveBeenCalledWith(tempDir);
    
    // Verify that the yt-dlp command was called with the correct arguments
    const ytDlpInstance = require('../../backend/services/ytDlp/binary').getYtDlpInstance();
    const execPromiseCalls = ytDlpInstance.execPromise.mock.calls;
    
    // Check that we called list-formats
    expect(execPromiseCalls.some(call => 
      call[0].includes('--list-formats')
    )).toBe(true);
    
    // Check that we called the download with the correct format
    expect(execPromiseCalls.some(call => 
      call[0].includes('-f') && 
      call[0].includes('--ffmpeg-location')
    )).toBe(true);
  });
  
  it('should handle missing FFmpeg by using a fallback format', async () => {
    // Mock getFfmpegPath to return null (FFmpeg not found)
    require('../../backend/services/ytDlp/binary').getFfmpegPath.mockRejectedValueOnce(new Error('FFmpeg not found'));
    
    const videoId = 'XjrGN-t7f1g';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const result = await downloadVideo({
      videoId,
      videoUrl,
      outputDir: tempDir,
      format: 'mp4',
      quality: '480p'
    });
    
    // Verify the result is the expected output file path
    expect(result).toBe(path.join(tempDir, `${videoId}.mp4`));
    
    // Verify that the yt-dlp command was called with the correct arguments
    const ytDlpInstance = require('../../backend/services/ytDlp/binary').getYtDlpInstance();
    const execPromiseCalls = ytDlpInstance.execPromise.mock.calls;
    
    // Check that we called the download with a fallback format
    expect(execPromiseCalls.some(call => 
      call[0].includes('-f') && 
      !call[0].includes('--ffmpeg-location')
    )).toBe(true);
  });
});

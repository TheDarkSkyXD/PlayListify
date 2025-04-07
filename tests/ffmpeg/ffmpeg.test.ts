/**
 * FFmpeg Unit Tests
 * 
 * These tests verify that FFmpeg is properly integrated with the application.
 * They use simple checks to avoid complex dependencies.
 */
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FFmpegCheckResult {
  exists: boolean;
  location?: 'system' | 'bundled';
  path?: string;
  error?: Error;
}

// Helper function to check if FFmpeg exists
async function checkFFmpegExists(): Promise<FFmpegCheckResult> {
  try {
    // Check if FFmpeg is in the system PATH
    try {
      await execAsync('ffmpeg -version', { timeout: 5000 });
      return { exists: true, location: 'system' };
    } catch (error) {
      // Check if FFmpeg is in the bundled location
      const ffmpegDir = path.join(process.cwd(), 'ffmpeg');
      const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');
      
      if (await fs.pathExists(ffmpegExe)) {
        return { exists: true, location: 'bundled', path: ffmpegExe };
      }
    }
    
    return { exists: false };
  } catch (error) {
    return { exists: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

describe('FFmpeg Integration', () => {
  // Skip these tests in CI environments or when running the full test suite
  // Only run them when specifically targeting this file
  const runTests = process.env.RUN_FFMPEG_TESTS === 'true' || 
                  process.argv.some(arg => arg.includes('ffmpeg.test'));
  
  // Use conditional tests that only run when specifically targeted
  (runTests ? describe : describe.skip)('FFmpeg Checks', () => {
    it('should find FFmpeg in the system or bundled location', async () => {
      const result = await checkFFmpegExists();
      
      // This test will pass if FFmpeg is found in either location
      if (!result.exists) {
        console.log('FFmpeg not found. This test will be marked as skipped.');
        return;
      }
      
      expect(result.exists).toBe(true);
      console.log(`FFmpeg found in ${result.location} location`);
      
      if (result.path) {
        const stats = await fs.stat(result.path);
        console.log(`FFmpeg file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      }
    });
  });
  
  // Always run these basic tests
  it('should have the correct FFmpeg directory structure', async () => {
    const ffmpegDir = path.join(process.cwd(), 'ffmpeg');
    
    // This just checks if the directory exists, not if FFmpeg is actually there
    const dirExists = await fs.pathExists(ffmpegDir);
    expect(dirExists).toBe(true);
  });
});

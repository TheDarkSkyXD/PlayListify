/**
 * Test Download Script
 * 
 * This script tests downloading a small video using yt-dlp and FFmpeg
 */
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Helper functions for colored console output
const c = {
  success: (text: string) => `${colors.green}${text}${colors.reset}`,
  error: (text: string) => `${colors.red}${text}${colors.reset}`,
  warn: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  header: (text: string) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
};

/**
 * Test downloading a video
 */
async function testDownload(): Promise<boolean> {
  console.log(c.header('\n=== Testing Video Download ==='));
  
  try {
    // Define paths
    const ytdlpPath = path.join(process.cwd(), 'ytdlp', 'yt-dlp.exe');
    const ffmpegPath = path.join(process.cwd(), 'ffmpeg', 'ffmpeg.exe');
    const outputDir = path.join(process.cwd(), 'test-download');
    const outputFile = path.join(outputDir, 'test-video.mp4');
    
    // Create output directory
    await fs.ensureDir(outputDir);
    
    // Remove existing file if it exists
    if (await fs.pathExists(outputFile)) {
      await fs.remove(outputFile);
    }
    
    // Verify tools exist
    if (!await fs.pathExists(ytdlpPath)) {
      console.log(c.error(`yt-dlp not found at: ${ytdlpPath}`));
      return false;
    }
    
    if (!await fs.pathExists(ffmpegPath)) {
      console.log(c.error(`FFmpeg not found at: ${ffmpegPath}`));
      return false;
    }
    
    // Download a small video (first YouTube video ever)
    const videoUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    console.log(c.info(`Downloading video: ${videoUrl}`));
    console.log(c.info(`Output file: ${outputFile}`));
    
    // Construct the command
    const command = `"${ytdlpPath}" -o "${outputFile}" --ffmpeg-location "${ffmpegPath}" -f "best[height<=480]" "${videoUrl}"`;
    console.log(c.info(`Running command: ${command}`));
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    // Check if the file was downloaded
    if (await fs.pathExists(outputFile)) {
      const stats = await fs.stat(outputFile);
      console.log(c.success(`✓ Video downloaded successfully: ${outputFile}`));
      console.log(c.info(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
      
      // Show some of the output
      console.log(c.info('  Command output:'));
      console.log(stdout.split('\n').slice(0, 10).join('\n'));
      
      return true;
    } else {
      console.log(c.error(`✗ Video download failed: ${outputFile} not found`));
      console.log(c.error('  Command output:'));
      console.log(stdout);
      console.log(c.error('  Error output:'));
      console.log(stderr);
      
      return false;
    }
  } catch (error) {
    console.log(c.error(`Error downloading video: ${error instanceof Error ? error.message : String(error)}`));
    if (error instanceof Error) {
      const execError = error as any;
      if (execError.stdout) {
        console.log(c.info('  Command output:'));
        console.log(execError.stdout);
      }
      if (execError.stderr) {
        console.log(c.error('  Error output:'));
        console.log(execError.stderr);
      }
    }
    return false;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log(c.header('\n=== Test Download Script ==='));
  console.log('This script tests downloading a small video using yt-dlp and FFmpeg.\n');
  
  try {
    // Test download
    const downloadSuccess = await testDownload();
    
    // Summary
    console.log(c.header('\n=== Test Summary ==='));
    console.log(`Download: ${downloadSuccess ? c.success('SUCCESS') : c.error('FAILED')}`);
    
    if (downloadSuccess) {
      console.log(c.success('\n✓ FFmpeg and yt-dlp are working correctly!'));
      console.log(c.info('  You should be able to download videos with the correct quality.'));
      
      // Clean up
      console.log(c.info('\nCleaning up test files...'));
      await fs.remove(path.join(process.cwd(), 'test-download'));
    } else {
      console.log(c.error('\n✗ There are issues with the download process.'));
      console.log(c.info('  Please check the logs above for details.'));
    }
    
    process.exit(downloadSuccess ? 0 : 1);
  } catch (error) {
    console.log(c.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

// Run the main function
main();

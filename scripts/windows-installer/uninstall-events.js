/**
 * This script runs during the Windows uninstaller process and cleans up yt-dlp and FFmpeg
 */
const fs = require('fs-extra');
const path = require('path');

// Get the installation context
const installPath = process.argv[2] || process.env.APPDATA;
const appName = 'playlistify';
const appDirectory = path.join(installPath, appName);

// Define paths
const resourcesDir = path.join(appDirectory, 'resources');
const ytdlpDirectory = path.join(resourcesDir, 'ytdlp');
const ytdlpExe = path.join(ytdlpDirectory, 'yt-dlp.exe');
const ffmpegDirectory = path.join(resourcesDir, 'ffmpeg');
const ffmpegExe = path.join(ffmpegDirectory, 'ffmpeg.exe');

/**
 * Clean up yt-dlp resources
 */
async function cleanupYtDlp() {
  console.log('Cleaning up yt-dlp...');

  try {
    // Remove yt-dlp executable if it exists
    if (await fs.pathExists(ytdlpExe)) {
      await fs.remove(ytdlpExe);
      console.log('Removed yt-dlp executable');
    }

    // Remove yt-dlp directory if it exists
    if (await fs.pathExists(ytdlpDirectory)) {
      await fs.remove(ytdlpDirectory);
      console.log('Removed yt-dlp directory');
    }

    return true;
  } catch (error) {
    console.error('Error cleaning up yt-dlp:', error);
    return false;
  }
}

/**
 * Clean up FFmpeg resources
 */
async function cleanupFFmpeg() {
  console.log('Cleaning up FFmpeg...');

  try {
    // Remove FFmpeg executable if it exists
    if (await fs.pathExists(ffmpegExe)) {
      await fs.remove(ffmpegExe);
      console.log('Removed FFmpeg executable');
    }

    // Remove FFmpeg directory if it exists
    if (await fs.pathExists(ffmpegDirectory)) {
      await fs.remove(ffmpegDirectory);
      console.log('Removed FFmpeg directory');
    }

    return true;
  } catch (error) {
    console.error('Error cleaning up FFmpeg:', error);
    return false;
  }
}

/**
 * Main uninstaller function
 */
async function main() {
  try {
    console.log('Running uninstall script for dependencies...');
    console.log(`App directory: ${appDirectory}`);

    // Clean up yt-dlp
    const ytdlpSuccess = await cleanupYtDlp();

    if (ytdlpSuccess) {
      console.log('yt-dlp cleanup completed successfully');
    } else {
      console.error('yt-dlp cleanup failed');
    }

    // Clean up FFmpeg
    const ffmpegSuccess = await cleanupFFmpeg();

    if (ffmpegSuccess) {
      console.log('FFmpeg cleanup completed successfully');
    } else {
      console.error('FFmpeg cleanup failed');
    }

    console.log('\n=== Uninstallation Summary ===');
    console.log(`yt-dlp: ${ytdlpSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`FFmpeg: ${ffmpegSuccess ? 'SUCCESS' : 'FAILED'}`);

    // Always return success to not block the uninstallation
    process.exit(0);
  } catch (error) {
    console.error('Unhandled error in uninstall script:', error);
    // Don't block uninstallation on error
    process.exit(0);
  }
}

// Run the main function
main();
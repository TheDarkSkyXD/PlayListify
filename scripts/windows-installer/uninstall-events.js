/**
 * This script runs during the Windows uninstaller process and cleans up yt-dlp
 */
const fs = require('fs-extra');
const path = require('path');

// Get the installation context
const installPath = process.argv[2] || process.env.APPDATA;
const appName = 'playlistify';
const appDirectory = path.join(installPath, appName);

// Define paths
const ytdlpDirectory = path.join(appDirectory, 'resources', 'ytdlp');
const ytdlpExe = path.join(ytdlpDirectory, 'yt-dlp.exe');

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
 * Main uninstaller function
 */
async function main() {
  try {
    console.log('Running uninstall script for yt-dlp...');
    console.log(`App directory: ${appDirectory}`);
    
    // Clean up yt-dlp
    const success = await cleanupYtDlp();
    
    if (success) {
      console.log('yt-dlp cleanup completed successfully');
    } else {
      console.error('yt-dlp cleanup failed');
    }
    
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
/**
 * This script runs during the Windows installer process and sets up yt-dlp
 */
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

// Get the installer context
const installPath = process.argv[2] || process.env.APPDATA;
const appName = 'playlistify';
const appDirectory = path.join(installPath, appName);

// Define paths
const ytdlpDirectory = path.join(appDirectory, 'resources', 'ytdlp');
const ytdlpExe = path.join(ytdlpDirectory, 'yt-dlp.exe');

/**
 * Download yt-dlp binary
 */
async function downloadYtDlp() {
  console.log('Downloading yt-dlp...');
  
  try {
    // Create the directory if it doesn't exist
    await fs.ensureDir(ytdlpDirectory);
    
    // Define download URL
    const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    
    // Create a write stream to save the file
    const fileStream = fs.createWriteStream(ytdlpExe);
    
    // Download the file
    await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('yt-dlp downloaded successfully');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(ytdlpExe);
        console.error('Error downloading yt-dlp:', err.message);
        reject(err);
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error installing yt-dlp:', error);
    return false;
  }
}

/**
 * Main installer function
 */
async function main() {
  try {
    console.log('Running post-install script for yt-dlp...');
    console.log(`App directory: ${appDirectory}`);
    
    // Download yt-dlp
    const success = await downloadYtDlp();
    
    if (success) {
      console.log('yt-dlp installation completed successfully');
    } else {
      console.error('yt-dlp installation failed');
    }
    
    // Always return success to not block the installation
    process.exit(0);
  } catch (error) {
    console.error('Unhandled error in install script:', error);
    // Don't block installation on error
    process.exit(0);
  }
}

// Run the main function
main(); 
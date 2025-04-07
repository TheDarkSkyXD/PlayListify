/**
 * This script runs during the Windows installer process and sets up FFmpeg
 */
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const { Extract } = require('unzipper');

// Get the installer context
const installPath = process.argv[2] || process.env.APPDATA;
const appName = 'playlistify';
const appDirectory = path.join(installPath, appName);

// Define paths
const ffmpegDirectory = path.join(appDirectory, 'resources', 'ffmpeg');
const ffmpegExe = path.join(ffmpegDirectory, 'ffmpeg.exe');
const tempZipFile = path.join(ffmpegDirectory, 'ffmpeg-temp.zip');

/**
 * Download and extract FFmpeg binary
 */
async function downloadFFmpeg() {
  console.log('Downloading FFmpeg...');
  
  try {
    // Create the directory if it doesn't exist
    await fs.ensureDir(ffmpegDirectory);
    
    // Define download URL - using a reliable direct link
    const url = 'https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip';
    
    // Create a write stream to save the file
    const fileStream = fs.createWriteStream(tempZipFile);
    
    // Download the file
    await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Following redirect to ${response.headers.location}`);
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              console.log('FFmpeg download completed');
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(tempZipFile, () => {});
            console.error('Error downloading FFmpeg (redirect):', err.message);
            reject(err);
          });
          return;
        }
        
        // Handle normal response
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('FFmpeg download completed');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(tempZipFile, () => {});
        console.error('Error downloading FFmpeg:', err.message);
        reject(err);
      });
    });
    
    console.log('Extracting FFmpeg...');
    
    // Create a temporary extraction directory
    const extractDir = path.join(ffmpegDirectory, 'temp-extract');
    await fs.ensureDir(extractDir);
    
    // Extract the zip file
    await new Promise((resolve, reject) => {
      fs.createReadStream(tempZipFile)
        .pipe(Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', (err) => {
          console.error('Error extracting FFmpeg:', err);
          reject(err);
        });
    });
    
    console.log('Finding FFmpeg executable...');
    
    // Find the ffmpeg.exe file in the extracted directory
    const findFfmpeg = async (dir) => {
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          const found = await findFfmpeg(fullPath);
          if (found) return found;
        } else if (file.name.toLowerCase() === 'ffmpeg.exe') {
          console.log(`Found ffmpeg.exe at ${fullPath}`);
          return fullPath;
        }
      }
      
      return null;
    };
    
    // Find ffmpeg.exe in the extracted directory
    const extractedFfmpeg = await findFfmpeg(extractDir);
    
    if (extractedFfmpeg) {
      // Copy the ffmpeg.exe file to the final location
      await fs.copy(extractedFfmpeg, ffmpegExe);
      console.log(`Copied ${extractedFfmpeg} to ${ffmpegExe}`);
    } else {
      console.error('Could not find ffmpeg.exe in the extracted files');
      throw new Error('FFmpeg executable not found in the extracted files');
    }
    
    // Clean up
    await fs.remove(extractDir);
    await fs.remove(tempZipFile);
    
    console.log('FFmpeg installation completed successfully');
    return true;
  } catch (error) {
    console.error('Error installing FFmpeg:', error);
    
    // Clean up any temporary files
    try {
      if (await fs.pathExists(tempZipFile)) {
        await fs.remove(tempZipFile);
      }
      
      const extractDir = path.join(ffmpegDirectory, 'temp-extract');
      if (await fs.pathExists(extractDir)) {
        await fs.remove(extractDir);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
    
    return false;
  }
}

/**
 * Main installer function
 */
async function main() {
  try {
    console.log('Running post-install script for FFmpeg...');
    console.log(`App directory: ${appDirectory}`);
    
    // Download and extract FFmpeg
    const success = await downloadFFmpeg();
    
    if (success) {
      console.log('FFmpeg installation completed successfully');
    } else {
      console.error('FFmpeg installation failed');
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

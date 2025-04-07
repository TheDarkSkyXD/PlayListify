/**
 * This script runs during the Windows installer process and sets up yt-dlp and FFmpeg
 */
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const { Extract } = require('unzipper');

// Get the installer context
const installPath = process.argv[2] || process.env.APPDATA;
const appName = 'playlistify';
const appDirectory = path.join(installPath, appName);

// Define paths
const resourcesDir = path.join(appDirectory, 'resources');
const ytdlpDirectory = path.join(resourcesDir, 'ytdlp');
const ytdlpExe = path.join(ytdlpDirectory, 'yt-dlp.exe');
const ffmpegDirectory = path.join(resourcesDir, 'ffmpeg');
const ffmpegExe = path.join(ffmpegDirectory, 'ffmpeg.exe');
const tempZipFile = path.join(ffmpegDirectory, 'ffmpeg-temp.zip');

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
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Following redirect to ${response.headers.location}`);
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              console.log('yt-dlp downloaded successfully');
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(ytdlpExe, () => {});
            console.error('Error downloading yt-dlp (redirect):', err.message);
            reject(err);
          });
          return;
        }

        // Handle normal response
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('yt-dlp downloaded successfully');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(ytdlpExe, () => {});
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
 * Download and extract FFmpeg binary
 * This is the primary method that extracts from the zip file
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

    // Try to find ffmpeg.exe in the extracted directory
    let extractedFfmpeg = await findFfmpeg(extractDir);

    // If not found, try to find bin/ffmpeg.exe which is common in FFmpeg distributions
    if (!extractedFfmpeg) {
      const binDir = path.join(extractDir, 'bin');
      if (await fs.pathExists(binDir)) {
        console.log('Checking bin directory for ffmpeg.exe...');
        extractedFfmpeg = await findFfmpeg(binDir);
      }
    }

    // If still not found, search for any ffmpeg executable
    if (!extractedFfmpeg) {
      console.log('Could not find ffmpeg.exe, searching for any ffmpeg executable...');

      const findAnyFfmpeg = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {
          const fullPath = path.join(dir, file.name);

          if (file.isDirectory()) {
            const found = await findAnyFfmpeg(fullPath);
            if (found) return found;
          } else if (file.name.toLowerCase().includes('ffmpeg') && file.name.endsWith('.exe')) {
            console.log(`Found ffmpeg executable at ${fullPath}`);
            return fullPath;
          }
        }

        return null;
      };

      extractedFfmpeg = await findAnyFfmpeg(extractDir);
    }

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
 * Alternative method to download FFmpeg
 * This is a simpler approach that downloads a pre-extracted binary
 */
async function downloadFFmpegAlternative() {
  console.log('Using alternative FFmpeg download method...');

  try {
    // Create the directory if it doesn't exist
    await fs.ensureDir(ffmpegDirectory);

    // Define download URL - using a direct link to a pre-extracted binary
    // This is a fallback URL that should be more reliable
    const url = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

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
              console.log('Alternative FFmpeg download completed');
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(tempZipFile, () => {});
            console.error('Error downloading alternative FFmpeg (redirect):', err.message);
            reject(err);
          });
          return;
        }

        // Handle normal response
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('Alternative FFmpeg download completed');
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(tempZipFile, () => {});
        console.error('Error downloading alternative FFmpeg:', err.message);
        reject(err);
      });
    });

    console.log('Extracting alternative FFmpeg...');

    // Create a temporary extraction directory
    const extractDir = path.join(ffmpegDirectory, 'alt-extract');
    await fs.ensureDir(extractDir);

    // Extract the zip file
    await new Promise((resolve, reject) => {
      fs.createReadStream(tempZipFile)
        .pipe(Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', (err) => {
          console.error('Error extracting alternative FFmpeg:', err);
          reject(err);
        });
    });

    console.log('Finding FFmpeg executable in alternative download...');

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

    // Try to find ffmpeg.exe in the extracted directory
    let extractedFfmpeg = await findFfmpeg(extractDir);

    if (extractedFfmpeg) {
      // Copy the ffmpeg.exe file to the final location
      await fs.copy(extractedFfmpeg, ffmpegExe);
      console.log(`Copied ${extractedFfmpeg} to ${ffmpegExe}`);
    } else {
      console.error('Could not find ffmpeg.exe in the alternative extracted files');
      throw new Error('FFmpeg executable not found in the alternative extracted files');
    }

    // Clean up
    await fs.remove(extractDir);
    await fs.remove(tempZipFile);

    console.log('Alternative FFmpeg installation completed successfully');
    return true;
  } catch (error) {
    console.error('Error installing alternative FFmpeg:', error);

    // Clean up any temporary files
    try {
      if (await fs.pathExists(tempZipFile)) {
        await fs.remove(tempZipFile);
      }

      const extractDir = path.join(ffmpegDirectory, 'alt-extract');
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
    console.log('Running post-install script for dependencies...');
    console.log(`App directory: ${appDirectory}`);

    // Download yt-dlp
    console.log('\n=== Installing yt-dlp ===');
    const ytdlpSuccess = await downloadYtDlp();

    if (ytdlpSuccess) {
      console.log('yt-dlp installation completed successfully');
    } else {
      console.error('yt-dlp installation failed');
    }

    // Download FFmpeg
    console.log('\n=== Installing FFmpeg ===');
    let ffmpegSuccess = await downloadFFmpeg();

    // If first attempt fails, try again with a different approach
    if (!ffmpegSuccess) {
      console.log('First FFmpeg installation attempt failed, trying alternative approach...');
      ffmpegSuccess = await downloadFFmpegAlternative();
    }

    if (ffmpegSuccess) {
      console.log('FFmpeg installation completed successfully');
    } else {
      console.error('FFmpeg installation failed after multiple attempts');
    }

    console.log('\n=== Installation Summary ===');
    console.log(`yt-dlp: ${ytdlpSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`FFmpeg: ${ffmpegSuccess ? 'SUCCESS' : 'FAILED'}`);

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
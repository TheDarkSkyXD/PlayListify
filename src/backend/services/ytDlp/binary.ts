import YtDlpWrap from 'yt-dlp-wrap';
import { exec } from 'child_process';
// import { promisify } from 'util'; // Not needed as we have custom execAsync
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getSetting } from '../settingsManager';
import { MAX_BUFFER_SIZE } from './config';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';
import { Extract } from 'unzipper';
import { IncomingMessage } from 'http';

// Custom execAsync with timeout
export const execAsync = (command: string, options: any = {}, timeout: number = 60000, suppressErrors: boolean = false) => {
  return new Promise((resolve, reject) => {
    // Only log if not suppressing errors
    if (!suppressErrors) {
      console.log(`Executing command with ${timeout}ms timeout: ${command}`);
    }

    const childProcess = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        // Only log error if not suppressing errors
        if (!suppressErrors) {
          console.error(`Command execution error: ${error.message}`);
        }
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Set timeout to kill the process if it takes too long
    const timeoutId = setTimeout(() => {
      childProcess.kill();

      // Only log error if not suppressing errors
      if (!suppressErrors) {
        console.error(`Command timed out after ${timeout}ms: ${command}`);
      }

      reject(new Error(`Command timed out after ${timeout / 1000} seconds`));
    }, timeout);

    // Clear timeout if process completes before timeout
    childProcess.on('exit', () => {
      clearTimeout(timeoutId);
    });
  });
};

// Initialize YtDlpWrap
let ytDlp: YtDlpWrap;

// Flag to track if FFmpeg download is in progress
let ffmpegDownloadPromise: Promise<string> | null = null;

// Flag to track if FFmpeg has been initialized
let ffmpegInitialized = false;

/**
 * Get the path to the FFmpeg binary
 * This function checks multiple locations for FFmpeg and returns the path if found
 * If FFmpeg is not found, it will attempt to download it
 *
 * @param nonBlocking If true, will return null instead of waiting for download to complete
 * @param timeoutMs Optional timeout in milliseconds for waiting for FFmpeg download
 */
export async function getFfmpegPath(nonBlocking: boolean = false, timeoutMs: number = 60000): Promise<string | null> {
  // First, check if FFmpeg is in the PATH
  try {
    // Try to execute FFmpeg to see if it's in the PATH - suppress errors since this is expected to fail if FFmpeg is not in PATH
    const result = await execAsync('ffmpeg -version', {}, 5000, true);
    if (result && typeof result === 'object' && 'stdout' in result) {
      console.log('✅ FFmpeg found in system PATH');
      return 'ffmpeg'; // Return just the command name if it's in the PATH
    }
  } catch (error) {
    // This is expected if FFmpeg is not in PATH, so we'll use a more informative message
    console.log('ℹ️ FFmpeg not found in system PATH (this is normal), checking bundled location...');
  }

  // Check for bundled FFmpeg
  let ffmpegPath: string;
  if (process.platform === 'win32') {
    ffmpegPath = path.join(getBundledFfmpegDir(), 'ffmpeg.exe');
  } else {
    ffmpegPath = path.join(getBundledFfmpegDir(), 'ffmpeg');
  }

  if (await fs.pathExists(ffmpegPath)) {
    console.log(`✅ FFmpeg found in bundled location: ${ffmpegPath}`);
    return ffmpegPath;
  }

  // If FFmpeg is not found, try to download it
  if (!ffmpegDownloadPromise) {
    // Start the download in the background
    ffmpegDownloadPromise = (async (): Promise<string> => {
      try {
        console.log('📥 FFmpeg not found, downloading automatically...');
        await downloadFfmpeg();

        // Check if the download was successful
        if (await fs.pathExists(ffmpegPath)) {
          console.log(`✅ FFmpeg successfully downloaded to: ${ffmpegPath}`);
          return ffmpegPath;
        }
      } catch (downloadError) {
        console.error('❌ Error downloading FFmpeg:', downloadError);
        ffmpegDownloadPromise = null; // Reset so we can try again later
      }

      // If we get here, FFmpeg was not found and could not be downloaded
      throw new Error('FFmpeg not found and could not be downloaded');
    })();
  } else {
    console.log('⏳ FFmpeg download already in progress, please wait...');
  }

  // If nonBlocking is true, return null instead of waiting for download to complete
  if (nonBlocking) {
    console.log('ℹ️ Continuing application startup while FFmpeg downloads in background...');
    return null;
  }

  // Wait for the download to complete with timeout
  try {
    // Create a promise that resolves after the timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`FFmpeg download timed out after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);
    });

    // Race the download promise against the timeout
    return await Promise.race([ffmpegDownloadPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ FFmpeg download timed out or failed:', error);
    ffmpegDownloadPromise = null; // Reset so we can try again later
    throw error;
  }
}

/**
 * Get the directory where FFmpeg should be bundled
 */
export function getBundledFfmpegDir(): string {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'ffmpeg');
  }

  // In production
  let resourcesPath: string;
  if (process.env.NODE_ENV === 'production') {
    resourcesPath = process.resourcesPath;
  } else {
    // Fallback for testing or other environments
    resourcesPath = path.join(app.getAppPath(), '..', 'resources');
  }

  return path.join(resourcesPath, 'ffmpeg');
}

/**
 * Download FFmpeg binary for the current platform
 */
async function downloadFfmpeg(): Promise<void> {
  const ffmpegDir = getBundledFfmpegDir();
  await fs.ensureDir(ffmpegDir);

  // Determine the download URL based on the platform
  let downloadUrl: string;
  let fallbackUrl: string; // Smaller/alternative download if primary fails
  let ffmpegPath: string;

  if (process.platform === 'win32') {
    // Windows - use a direct download link that doesn't redirect
    // Primary URL - essentials build (smaller, faster to download)
    downloadUrl = 'https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip';
    // Fallback URL - older version as fallback
    fallbackUrl = 'https://github.com/GyanD/codexffmpeg/releases/download/5.1.2/ffmpeg-5.1.2-essentials_build.zip';
    ffmpegPath = path.join(ffmpegDir, 'ffmpeg.exe');
  } else if (process.platform === 'darwin') {
    // macOS
    downloadUrl = 'https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip';
    fallbackUrl = 'https://evermeet.cx/ffmpeg/ffmpeg-5.1.2.zip'; // Older version as fallback
    ffmpegPath = path.join(ffmpegDir, 'ffmpeg');
  } else {
    // Linux
    downloadUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
    fallbackUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz'; // 32-bit version (smaller)
    ffmpegPath = path.join(ffmpegDir, 'ffmpeg');
  }

  console.log(`Downloading FFmpeg from ${downloadUrl}`);

  // Create a temporary file to download to
  const tempFile = path.join(ffmpegDir, 'ffmpeg-temp.zip');

  // Function to download FFmpeg from a URL with progress reporting
  const downloadWithProgress = async (url: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const file = createWriteStream(tempFile);

      // Set a timeout for the entire download process (5 minutes)
      const downloadTimeout = setTimeout(() => {
        reject(new Error('FFmpeg download timed out after 5 minutes'));
      }, 5 * 60 * 1000);

      const handleResponse = (response: IncomingMessage, url: string) => {
        // Handle redirects (status codes 301, 302, 303, 307, 308)
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Following redirect from ${url} to ${response.headers.location}`);

          // Close the current file stream
          file.close();

          // Determine if we need to use http or https for the redirect
          const redirectUrl = new URL(response.headers.location, url);
          const protocol = redirectUrl.protocol === 'https:' ? https : http;

          // Follow the redirect
          protocol.get(redirectUrl.toString(), (redirectResponse: IncomingMessage) => {
            handleResponse(redirectResponse, redirectUrl.toString());
          }).on('error', (err: Error) => {
            clearTimeout(downloadTimeout);
            fs.unlink(tempFile, () => {});
            reject(new Error(`Error following redirect: ${err.message}`));
          });

          return;
        }

        // Handle successful response
        if (response.statusCode === 200) {
          const totalSize = parseInt(response.headers['content-length'] || '0', 10);
          console.log(`Downloading FFmpeg from ${url} (${response.headers['content-type']}, ${totalSize ? (totalSize / 1024 / 1024).toFixed(2) + ' MB' : 'unknown size'})`);

          let downloadedBytes = 0;
          let lastProgressUpdate = Date.now();
          let lastProgressPercent = 0;

          // Report progress every 2 seconds
          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;

            // Update progress every 2 seconds or every 10% progress
            const now = Date.now();
            const currentProgress = totalSize ? Math.round((downloadedBytes / totalSize) * 100) : -1;

            if (now - lastProgressUpdate > 2000 || (currentProgress - lastProgressPercent >= 10)) {
              const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
              console.log(`FFmpeg download progress: ${downloadedMB} MB${totalSize ? ` (${currentProgress}%)` : ''}`);
              lastProgressUpdate = now;
              lastProgressPercent = currentProgress;
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            clearTimeout(downloadTimeout);
            file.close();
            console.log(`FFmpeg download completed: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
            resolve();
          });

          return;
        }

        // Handle error response
        clearTimeout(downloadTimeout);
        reject(new Error(`Failed to download FFmpeg: ${response.statusCode} ${response.statusMessage} from ${url}`));
      };

      // Start the download
      console.log(`Starting FFmpeg download from ${url}`);
      https.get(url, (response: IncomingMessage) => {
        handleResponse(response, url);
      }).on('error', (err: Error) => {
        clearTimeout(downloadTimeout);
        fs.unlink(tempFile, () => {});
        reject(new Error(`Error initiating download: ${err.message}`));
      });
    });
  };

  try {
    // Try primary download first
    try {
      console.log('Attempting to download FFmpeg from primary URL...');
      await downloadWithProgress(downloadUrl);
    } catch (primaryError) {
      // If primary download fails, try fallback URL
      console.error('Primary FFmpeg download failed:', primaryError.message);
      console.log('Attempting to download FFmpeg from fallback URL...');

      // Clean up any partial downloads
      if (await fs.pathExists(tempFile)) {
        await fs.unlink(tempFile);
      }

      await downloadWithProgress(fallbackUrl);
    }

    console.log('FFmpeg download complete, extracting...');

    // Extract the file based on platform
    if (process.platform === 'win32') {
      // For Windows, extract the zip file
      const extractDir = path.join(ffmpegDir, 'temp-extract');
      await fs.ensureDir(extractDir);

      // Extract the zip file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(tempFile)
          .pipe(Extract({ path: extractDir }))
          .on('close', resolve)
          .on('error', reject);
      });

      // Find the ffmpeg.exe file in the extracted directory
      const findFfmpeg = async (dir: string): Promise<string | null> => {
        console.log(`Searching for ffmpeg.exe in ${dir}`);
        const files = await fs.readdir(dir, { withFileTypes: true });

        // Log the files found for debugging
        console.log(`Found ${files.length} files/directories in ${dir}:`);
        files.forEach(file => {
          console.log(`- ${file.name} ${file.isDirectory() ? '(directory)' : '(file)'}`);
        });

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

        const findAnyFfmpeg = async (dir: string): Promise<string | null> => {
          const files = await fs.readdir(dir, { withFileTypes: true });

          for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
              const found = await findAnyFfmpeg(fullPath);
              if (found) return found;
            } else if (file.name.toLowerCase().includes('ffmpeg') &&
                      (file.name.endsWith('.exe') ||
                       await fs.stat(fullPath).then(stats => stats.mode & 0o111))) {
              console.log(`Found ffmpeg executable at ${fullPath}`);
              return fullPath;
            }
          }

          return null;
        };

        extractedFfmpeg = await findAnyFfmpeg(extractDir);
      }

      // If we still can't find ffmpeg, throw an error
      if (!extractedFfmpeg) {
        throw new Error('Could not find any ffmpeg executable in the extracted files');
      }

      // Copy the ffmpeg executable to the final location
      await fs.copy(extractedFfmpeg, ffmpegPath);
      console.log(`Copied ${extractedFfmpeg} to ${ffmpegPath}`);

      // Verify the file exists and has a reasonable size
      const stats = await fs.stat(ffmpegPath);
      if (stats.size < 1000) { // Less than 1KB is probably not a valid executable
        throw new Error(`FFmpeg executable is too small (${stats.size} bytes), likely corrupted`);
      }

      console.log(`FFmpeg executable size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Clean up
      await fs.remove(extractDir);
    } else {
      // For macOS and Linux, we need a different extraction approach
      // This is a simplified version - in a real app, you'd need to handle
      // tar.xz files for Linux and zip files for macOS differently
      console.log('Extraction for non-Windows platforms not implemented yet');
      // For now, we'll just copy the downloaded file as is
      await fs.copy(tempFile, ffmpegPath);
      await fs.chmod(ffmpegPath, 0o755); // Make it executable
    }

    // Clean up the temporary file
    await fs.remove(tempFile);

    console.log(`FFmpeg extracted to ${ffmpegPath}`);
  } catch (error) {
    console.error('Error downloading or extracting FFmpeg:', error);
    // Clean up any temporary files
    try {
      if (await fs.pathExists(tempFile)) {
        await fs.remove(tempFile);
      }

      const extractDir = path.join(ffmpegDir, 'temp-extract');
      if (await fs.pathExists(extractDir)) {
        await fs.remove(extractDir);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
    throw error;
  }
}

/**
 * Get the path to the bundled yt-dlp binary in production mode
 */
export function getBundledYtDlpPath(): string {
  // Determine the expected path based on the platform
  let binaryName: string;
  if (process.platform === 'win32') {
    binaryName = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    binaryName = 'yt-dlp';
  } else {
    // Linux
    binaryName = 'yt-dlp';
  }

  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'ytdlp', binaryName);
  }

  // In production
  let resourcesPath: string;
  if (process.env.NODE_ENV === 'production') {
    resourcesPath = process.resourcesPath;
  } else {
    // Fallback for testing or other environments
    resourcesPath = path.join(app.getAppPath(), '..', 'resources');
  }

  return path.join(resourcesPath, 'ytdlp', binaryName);
}

/**
 * Get the current ytDlp instance or initialize a new one
 */
export function getYtDlpInstance(): YtDlpWrap {
  // For now, we'll use the regular yt-dlp binary
  // We'll implement the PO Token provider in the future when we can properly install the Python modules

  // If we get here, use the regular yt-dlp binary
  if (!ytDlp) {
    // Initialize with the bundled binary path
    const binaryPath = getBundledYtDlpPath();
    if (fs.existsSync(binaryPath)) {
      ytDlp = new YtDlpWrap(binaryPath);
    } else {
      // Fallback to default path
      ytDlp = new YtDlpWrap();
    }
  }
  return ytDlp;
}

/**
 * Initialize the YtDlpWrap instance
 */
/**
 * Update yt-dlp to the latest version
 * This function updates yt-dlp to the latest version
 */
export async function updateYtDlp(): Promise<boolean> {
  try {
    console.log('Updating yt-dlp to the latest version...');

    // Get the current yt-dlp path
    const ytDlpPath = getBundledYtDlpPath();

    // Run the update command
    const updateResult = await execAsync(`"${ytDlpPath}" -U`, {
      maxBuffer: MAX_BUFFER_SIZE
    }, 60000);

    if (updateResult && typeof updateResult === 'object' && 'stdout' in updateResult) {
      const stdout = updateResult.stdout as string;
      console.log('yt-dlp update result:', stdout);

      // Check if the update was successful
      if (stdout.includes('Updated to version')) {
        console.log('yt-dlp updated successfully');

        // Re-initialize yt-dlp with the new version
        if (ytDlp) {
          ytDlp = new YtDlpWrap(ytDlpPath);
          const newVersion = await ytDlp.getVersion();
          console.log(`yt-dlp re-initialized, new version: ${newVersion}`);
        }

        return true;
      }
    }

    console.log('yt-dlp is already up to date or update failed');
    return false;
  } catch (error) {
    console.error('Error updating yt-dlp:', error);
    return false;
  }
}

export async function initYtDlp(customBinaryPath?: string, silent: boolean = false, forceUpdate: boolean = false): Promise<void> {
  try {
    // If already initialized, skip reinitialization
    if (ytDlp) {
      return;
    }

    // If a custom binary path is directly provided, use it
    if (customBinaryPath && await fs.pathExists(customBinaryPath)) {
      ytDlp = new YtDlpWrap(customBinaryPath);
      if (!silent) console.log(`Using custom yt-dlp binary at: ${customBinaryPath}`);
    }
    // Check if the setting for ytDlpPath exists
    else if (getSetting('ytDlpPath')) {
      const settingsPath = getSetting('ytDlpPath') as string;
      if (await fs.pathExists(settingsPath)) {
        ytDlp = new YtDlpWrap(settingsPath);
        if (!silent) console.log(`Using yt-dlp from settings at: ${settingsPath}`);
      }
    }
    // Check for bundled binary in production mode
    else if (await fs.pathExists(getBundledYtDlpPath())) {
      const bundledPath = getBundledYtDlpPath();
      ytDlp = new YtDlpWrap(bundledPath);
      if (!silent) console.log(`Using bundled yt-dlp binary at: ${bundledPath}`);
    }
    // If all else fails, let yt-dlp-wrap try to find or download it
    else {
      if (!silent) console.log('No existing yt-dlp binary found, letting yt-dlp-wrap handle it...');
      ytDlp = new YtDlpWrap();
    }

    // Test that yt-dlp is working and log version info
    const version = await ytDlp.getVersion();
    if (!silent) console.log(`yt-dlp initialized, version: ${version}`);

    // Log available commands only if not silent
    if (!silent) {
      try {
        const result = await execAsync(`"${getBundledYtDlpPath()}" --help`, {
          maxBuffer: MAX_BUFFER_SIZE
        });
        const stdout = typeof result === 'object' && result !== null && 'stdout' in result ? (result.stdout as string) : '';
        console.log('Available yt-dlp commands:',
          stdout.split('\n')
               .filter((line: string) => line.includes('--'))
               .slice(0, 5)
               .join('\n  ') +
          '\n  ... (truncated)'
        );
      } catch (e) {
        console.log('Could not retrieve yt-dlp help information');
      }
    }

    // Update yt-dlp if requested
    if (forceUpdate) {
      try {
        if (!silent) console.log('Force update requested, updating yt-dlp...');
        const updated = await updateYtDlp();
        if (!silent) console.log(`yt-dlp update ${updated ? 'successful' : 'not needed or failed'}`);
      } catch (updateError) {
        console.error('Error updating yt-dlp:', updateError);
        // Continue with the current version
      }
    }

    return;
  } catch (error: any) {
    console.error('Failed to initialize yt-dlp:', error);
    throw new Error('Failed to initialize yt-dlp. Please check if it is installed correctly.');
  }
}

/**
 * Initialize FFmpeg
 * This function checks if FFmpeg is available and downloads it if needed
 *
 * @param silent If true, suppresses console output
 * @returns The path to the FFmpeg binary
 */
export async function initFFmpeg(silent: boolean = false): Promise<string | null> {
  // If already initialized, return the cached path
  if (ffmpegInitialized) {
    return await getFfmpegPath(false);
  }

  try {
    // Check if FFmpeg is available
    const ffmpegPath = await getFfmpegPath(false);

    if (!silent) {
      if (ffmpegPath === 'ffmpeg') {
        console.log('💾 Using FFmpeg from system PATH');
      } else {
        console.log(`💾 Using FFmpeg from: ${ffmpegPath}`);
      }
    }

    ffmpegInitialized = true;
    return ffmpegPath;
  } catch (error: any) {
    console.error('⚠️ FFmpeg initialization issue:', error);

    // Don't throw an error, just return null
    // The application can still function without FFmpeg, just with limited functionality
    console.log('ℹ️ Application will continue with limited video download functionality');
    console.log('ℹ️ FFmpeg will be downloaded automatically when needed');
    return null;
  }
}

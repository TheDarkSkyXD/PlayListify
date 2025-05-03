import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { spawn } from 'child_process';
import https from 'https';
import settingsService from './settingsService';
import logger from './logService';
import { exec } from 'child_process';
import { promisify } from 'util';

// Platform-specific executable extensions
const getExecutableExtension = (): string => {
  return process.platform === 'win32' ? '.exe' : '';
};

// Get appropriate download URL based on platform
const getYtdlpDownloadUrl = (): string => {
  const platform = process.platform;
  const arch = process.arch;
  
  // Default to the latest release
  let fileName = 'yt-dlp';
  
  if (platform === 'win32') {
    fileName = 'yt-dlp.exe';
  } else if (platform === 'darwin') {
    fileName = arch === 'arm64' ? 'yt-dlp_macos_arm64' : 'yt-dlp_macos';
  } else {
    // Linux
    fileName = arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
  }
  
  // GitHub release URL for the latest stable version
  return `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;
};

// Get stored path for yt-dlp
export const getYtdlpPath = (): string => {
  // First check user settings for a custom path
  const customPath = settingsService.getSetting('ytdlpPath');
  
  if (customPath && fs.existsSync(customPath)) {
    logger.debug(`Using custom yt-dlp path: ${customPath}`);
    return customPath;
  }
  
  // Default paths (bundled with app in production)
  const userDataPath = app.getPath('userData');
  const extPath = getExecutableExtension();
  return path.join(userDataPath, 'bin', `yt-dlp${extPath}`);
};

// Download yt-dlp from GitHub
export const downloadYtdlp = async (): Promise<string> => {
  const ytdlpPath = getYtdlpPath();
  const downloadUrl = getYtdlpDownloadUrl();
  const binDir = path.dirname(ytdlpPath);
  
  logger.info(`Downloading yt-dlp from ${downloadUrl}`);
  
  try {
    // Ensure bin directory exists
    await fs.ensureDir(binDir);
    
    // Use curl to download with automatic redirect following
    // This is more reliable than Node.js https module for complex redirects
    return new Promise<string>((resolve, reject) => {
      const { exec } = require('child_process');
      
      // Use curl with --location to follow redirects
      const curlCommand = `curl --location --fail --silent --show-error --output "${ytdlpPath}" "${downloadUrl}"`;
      
      logger.info(`Executing: ${curlCommand}`);
      
      exec(curlCommand, (error: any, stdout: string, stderr: string) => {
        if (error) {
          logger.error(`Curl error: ${error.message}`);
          logger.error(`Stderr: ${stderr}`);
          reject(new Error(`Failed to download yt-dlp: ${error.message}`));
          return;
        }
        
        // Make executable on Unix platforms
        if (process.platform !== 'win32') {
          fs.chmodSync(ytdlpPath, 0o755);
        }
        
        logger.info(`Downloaded yt-dlp to ${ytdlpPath}`);
        resolve(ytdlpPath);
      });
    });
  } catch (error) {
    logger.error('Error downloading yt-dlp:', error);
    throw error;
  }
};

// Verify yt-dlp exists and is executable
export const verifyYtdlp = async (): Promise<boolean> => {
  try {
    const ytdlpPath = getYtdlpPath();
    
    // Check if file exists
    if (!fs.existsSync(ytdlpPath)) {
      logger.warn(`yt-dlp not found at ${ytdlpPath}`);
      return false;
    }
    
    // Try to get version
    const version = await getYtdlpVersion(ytdlpPath);
    logger.info(`Found yt-dlp version: ${version}`);
    return true;
  } catch (error) {
    logger.error('Error verifying yt-dlp dependency:', error);
    return false;
  }
};

// Get yt-dlp version
export const getYtdlpVersion = async (ytdlpPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, ['--version']);
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

// Ensure yt-dlp is available - download if needed
export const ensureYtdlp = async (): Promise<void> => {
  const ytdlpExists = await verifyYtdlp();
  
  if (!ytdlpExists) {
    logger.info('yt-dlp not found. Downloading...');
    try {
      await downloadYtdlp();
      logger.info('yt-dlp downloaded successfully');
    } catch (error) {
      logger.error('Failed to download yt-dlp automatically:', error);
      logger.warn('User will need to set custom path or try again');
    }
  }
};

// Promisify exec to use async/await
const execAsync = promisify(exec);

/**
 * Checks if a YouTube video is private, deleted, or otherwise unavailable
 * @param videoId YouTube video ID to check
 * @returns Object with status information: { isAvailable, isPrivate, isDeleted, error }
 */
export async function checkVideoStatus(videoId: string): Promise<{
  isAvailable: boolean;
  isPrivate: boolean;
  isDeleted: boolean;
  error?: string;
}> {
  try {
    // Default response object
    const result: {
      isAvailable: boolean;
      isPrivate: boolean;
      isDeleted: boolean;
      error?: string;
    } = {
      isAvailable: false,
      isPrivate: false,
      isDeleted: false
    };
    
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Use yt-dlp to check video info, but only request title to minimize data
    const { stdout, stderr } = await execAsync(`yt-dlp --get-title "${url}"`, {
      timeout: 10000 // 10-second timeout
    });
    
    // If we get a title, the video is available
    if (stdout.trim()) {
      result.isAvailable = true;
      return result;
    }
    
    // Process error messages to determine status
    if (stderr) {
      const errorLower = stderr.toLowerCase();
      
      // Check for private videos
      if (errorLower.includes('private video') || errorLower.includes('sign in to view')) {
        result.isPrivate = true;
        result.error = 'This video is private';
        return result;
      }
      
      // Check for deleted/unavailable videos
      if (errorLower.includes('video unavailable') || errorLower.includes('has been removed') || 
          errorLower.includes('does not exist') || errorLower.includes('no longer available')) {
        result.isDeleted = true;
        result.error = 'This video has been deleted or is unavailable';
        return result;
      }
      
      // Generic error
      result.error = 'Video status could not be determined';
      return result;
    }
    
    // If we get here without a clear status, assume the video is deleted
    result.isDeleted = true;
    result.error = 'Video not found';
    return result;
    
  } catch (error) {
    // Handle execution errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Try to extract useful information from the error
    const isPrivate = errorMessage.toLowerCase().includes('private video');
    const isDeleted = errorMessage.toLowerCase().includes('deleted') || 
                      errorMessage.toLowerCase().includes('unavailable') ||
                      errorMessage.toLowerCase().includes('does not exist');
    
    return {
      isAvailable: false,
      isPrivate,
      isDeleted: !isPrivate && isDeleted,
      error: errorMessage
    };
  }
}

export default {
  getYtdlpPath,
  verifyYtdlp,
  getYtdlpVersion,
  downloadYtdlp,
  ensureYtdlp
}; 
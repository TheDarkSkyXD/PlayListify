import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { spawn } from 'child_process';
import https from 'https';
import settingsService from './settingsService';
import logger from './logService';

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

export default {
  getYtdlpPath,
  verifyYtdlp,
  getYtdlpVersion,
  downloadYtdlp,
  ensureYtdlp
}; 
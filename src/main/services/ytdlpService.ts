import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { spawn } from 'child_process';
import settingsService from './settingsService';
import logger from './logService';

// Platform-specific executable extensions
const getExecutableExtension = (): string => {
  return process.platform === 'win32' ? '.exe' : '';
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

// Ensure yt-dlp is available
export const ensureYtdlp = async (): Promise<void> => {
  const ytdlpExists = await verifyYtdlp();
  
  if (!ytdlpExists) {
    logger.warn('yt-dlp not found. User will need to set custom path.');
    // In the future, we could implement auto-download functionality here
  }
};

export default {
  getYtdlpPath,
  verifyYtdlp,
  getYtdlpVersion,
  ensureYtdlp
}; 
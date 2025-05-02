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

// Get stored path for ffmpeg
export const getFfmpegPath = (): string => {
  // First check user settings for a custom path
  const customPath = settingsService.getSetting('ffmpegPath');
  
  if (customPath && fs.existsSync(customPath)) {
    logger.debug(`Using custom ffmpeg path: ${customPath}`);
    return customPath;
  }
  
  // Default paths (bundled with app in production)
  const userDataPath = app.getPath('userData');
  const extPath = getExecutableExtension();
  return path.join(userDataPath, 'bin', `ffmpeg${extPath}`);
};

// Verify ffmpeg exists and is executable
export const verifyFfmpeg = async (): Promise<boolean> => {
  try {
    const ffmpegPath = getFfmpegPath();
    
    // Check if file exists
    if (!fs.existsSync(ffmpegPath)) {
      logger.warn(`ffmpeg not found at ${ffmpegPath}`);
      return false;
    }
    
    // Try to get version
    const version = await getFfmpegVersion(ffmpegPath);
    logger.info(`Found ffmpeg version: ${version}`);
    return true;
  } catch (error) {
    logger.error('Error verifying ffmpeg dependency:', error);
    return false;
  }
};

// Get ffmpeg version
export const getFfmpegVersion = async (ffmpegPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, ['-version']);
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        // Extract version from complex output
        const versionMatch = output.match(/version\s+(\S+)/);
        if (versionMatch && versionMatch[1]) {
          resolve(versionMatch[1]);
        } else {
          resolve('Unknown');
        }
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

// Ensure ffmpeg is available
export const ensureFfmpeg = async (): Promise<void> => {
  const ffmpegExists = await verifyFfmpeg();
  
  if (!ffmpegExists) {
    logger.warn('ffmpeg not found. User will need to set custom path.');
    // In the future, we could implement auto-download functionality here
  }
};

export default {
  getFfmpegPath,
  verifyFfmpeg,
  getFfmpegVersion,
  ensureFfmpeg
}; 
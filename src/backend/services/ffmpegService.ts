import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { spawn } from 'child_process';
import https from 'https';
import settingsService from './settingsService';
import logger from './logService';
import extract from 'extract-zip';

// Platform-specific executable extensions
const getExecutableExtension = (): string => {
  return process.platform === 'win32' ? '.exe' : '';
};

// Get appropriate download URL based on platform
const getFfmpegDownloadUrl = (): string => {
  const platform = process.platform;
  const arch = process.arch;
  let version = '4.4.1'; // Stable version
  
  // FFmpeg builds from gyan.dev (Windows), evermeet.cx (macOS), or johnvansickle.com (Linux)
  if (platform === 'win32') {
    return `https://github.com/GyanD/codexffmpeg/releases/download/${version}/ffmpeg-${version}-essentials_build.zip`;
  } else if (platform === 'darwin') {
    // macOS builds from evermeet.cx
    return arch === 'arm64' 
      ? `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/arm64/zip`  // ARM builds
      : `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip`;        // Intel builds
  } else {
    // Linux builds from johnvansickle.com
    const linuxArch = arch === 'arm64' ? 'arm64' : (arch === 'arm' ? 'armhf' : 'amd64');
    return `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${linuxArch}-static.tar.xz`;
  }
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

// Download and extract ffmpeg
export const downloadFfmpeg = async (): Promise<string> => {
  const ffmpegPath = getFfmpegPath();
  const downloadUrl = getFfmpegDownloadUrl();
  const binDir = path.dirname(ffmpegPath);
  const tempDir = path.join(app.getPath('temp'), 'ffmpeg-download');
  const tempFile = path.join(tempDir, 'ffmpeg-download.zip');
  
  logger.info(`Downloading ffmpeg from ${downloadUrl}`);
  
  try {
    // Ensure directories exist
    await fs.ensureDir(binDir);
    await fs.ensureDir(tempDir);
    
    // Download file with redirect support
    await new Promise<void>((resolve, reject) => {
      const request = https.get(downloadUrl, (response) => {
        // Handle redirects (status codes 301, 302, 303, 307, 308)
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          logger.info(`Following redirect to ${response.headers.location}`);
          
          // Create a new request to the redirected URL
          const redirectReq = https.get(response.headers.location, (redirectRes) => {
            if (redirectRes.statusCode !== 200) {
              reject(new Error(`Failed to download ffmpeg from redirect: ${redirectRes.statusCode}`));
              return;
            }
            
            const file = fs.createWriteStream(tempFile);
            redirectRes.pipe(file);
            
            file.on('finish', () => {
              file.close();
              logger.info(`Downloaded ffmpeg archive to ${tempFile}`);
              resolve();
            });
            
            file.on('error', (err) => {
              fs.unlink(tempFile, () => {}); // Delete the file async, ignore callback
              reject(err);
            });
          });
          
          redirectReq.on('error', (err) => {
            reject(err);
          });
        }
        else if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ffmpeg: ${response.statusCode}`));
          return;
        }
        else {
          // No redirect, process the response directly
          const file = fs.createWriteStream(tempFile);
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            logger.info(`Downloaded ffmpeg archive to ${tempFile}`);
            resolve();
          });
          
          file.on('error', (err) => {
            fs.unlink(tempFile, () => {}); // Delete the file async, ignore callback
            reject(err);
          });
        }
      });
      
      request.on('error', (err) => {
        fs.unlink(tempFile, () => {}); // Delete the file async, ignore callback
        reject(err);
      });
    });
    
    // Extract the archive
    logger.info(`Extracting ffmpeg archive to ${tempDir}`);
    
    if (process.platform === 'win32') {
      // For Windows (zip file)
      await extract(tempFile, { dir: tempDir });
      
      // Find ffmpeg.exe in extracted files
      const ffmpegExe = await findExecutableInExtracted(tempDir, 'ffmpeg.exe');
      if (!ffmpegExe) {
        throw new Error('Could not find ffmpeg.exe in extracted files');
      }
      
      // Copy to destination
      await fs.copyFile(ffmpegExe, ffmpegPath);
      
    } else if (process.platform === 'darwin') {
      // For macOS (zip file from evermeet.cx)
      await extract(tempFile, { dir: tempDir });
      
      // macOS build is just the binary
      const extractedPath = path.join(tempDir, 'ffmpeg');
      if (!fs.existsSync(extractedPath)) {
        throw new Error('Could not find ffmpeg executable in extracted files');
      }
      
      // Copy to destination
      await fs.copyFile(extractedPath, ffmpegPath);
      
    } else {
      // For Linux (tar.xz from johnvansickle)
      // This would require additional handling with tar command or a library
      // For simplicity, we'll skip this in this example
      throw new Error('Linux automatic installation not yet implemented - user must install ffmpeg manually');
    }
    
    // Make executable on Unix platforms
    if (process.platform !== 'win32') {
      fs.chmodSync(ffmpegPath, 0o755);
    }
    
    // Clean up temp files
    await fs.remove(tempDir);
    
    logger.info(`ffmpeg installed successfully to ${ffmpegPath}`);
    return ffmpegPath;
    
  } catch (error) {
    logger.error('Error downloading/extracting ffmpeg:', error);
    throw error;
  }
};

// Helper to find executable in extracted directory (recursive)
async function findExecutableInExtracted(dir: string, fileName: string): Promise<string | null> {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      const found = await findExecutableInExtracted(fullPath, fileName);
      if (found) return found;
    } else if (file.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }
  }
  
  return null;
}

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

// Ensure ffmpeg is available - download if needed
export const ensureFfmpeg = async (): Promise<void> => {
  const ffmpegExists = await verifyFfmpeg();
  
  if (!ffmpegExists) {
    logger.info('ffmpeg not found. Downloading...');
    try {
      await downloadFfmpeg();
      logger.info('ffmpeg downloaded and installed successfully');
    } catch (error) {
      logger.error('Failed to download ffmpeg automatically:', error);
      logger.warn('User will need to set custom path or try again');
    }
  }
};

export default {
  getFfmpegPath,
  verifyFfmpeg,
  getFfmpegVersion,
  downloadFfmpeg,
  ensureFfmpeg
}; 
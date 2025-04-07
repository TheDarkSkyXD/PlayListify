/**
 * Direct FFmpeg download utility
 * This provides a simpler, more direct way to download FFmpeg
 */
import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import { Extract } from 'unzipper';
import { getBundledFfmpegDir } from './binary';

/**
 * Download FFmpeg directly without complex extraction logic
 * This is a simpler approach that can be used as a fallback
 */
export async function downloadFFmpegDirect(): Promise<string | null> {
  try {
    console.log('Starting direct FFmpeg download...');
    
    // Get the FFmpeg directory
    const ffmpegDir = getBundledFfmpegDir();
    await fs.ensureDir(ffmpegDir);
    
    // Define paths
    const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');
    const tempZipFile = path.join(ffmpegDir, 'ffmpeg-direct-temp.zip');
    
    // Define download URL - using a reliable direct link
    const url = 'https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip';
    
    console.log(`Downloading FFmpeg from ${url}...`);
    
    // Download the file
    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(tempZipFile);
      
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
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
    const extractDir = path.join(ffmpegDir, 'direct-extract');
    await fs.ensureDir(extractDir);
    
    // Extract the zip file
    await new Promise<void>((resolve, reject) => {
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
    const findFfmpeg = async (dir: string): Promise<string | null> => {
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
    
    if (extractedFfmpeg) {
      // Copy the ffmpeg.exe file to the final location
      await fs.copy(extractedFfmpeg, ffmpegExe);
      console.log(`Copied ${extractedFfmpeg} to ${ffmpegExe}`);
      
      // Verify the file exists and has a reasonable size
      const stats = await fs.stat(ffmpegExe);
      console.log(`FFmpeg executable size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (stats.size < 1000) { // Less than 1KB is probably not a valid executable
        throw new Error(`FFmpeg executable is too small (${stats.size} bytes), likely corrupted`);
      }
    } else {
      console.error('Could not find ffmpeg.exe in the extracted files');
      throw new Error('FFmpeg executable not found in the extracted files');
    }
    
    // Clean up
    await fs.remove(extractDir);
    await fs.remove(tempZipFile);
    
    console.log('Direct FFmpeg download completed successfully');
    return ffmpegExe;
  } catch (error) {
    console.error('Error in direct FFmpeg download:', error);
    
    // Clean up any temporary files
    try {
      const ffmpegDir = getBundledFfmpegDir();
      const tempZipFile = path.join(ffmpegDir, 'ffmpeg-direct-temp.zip');
      const extractDir = path.join(ffmpegDir, 'direct-extract');
      
      if (await fs.pathExists(tempZipFile)) {
        await fs.remove(tempZipFile);
      }
      
      if (await fs.pathExists(extractDir)) {
        await fs.remove(extractDir);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
    
    return null;
  }
}

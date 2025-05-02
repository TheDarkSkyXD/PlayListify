#!/usr/bin/env node

/**
 * Development setup script for PlayListify
 * 
 * This script ensures that the required external dependencies (yt-dlp and ffmpeg)
 * are downloaded and available for development.
 */

const path = require('path');
const fs = require('fs-extra');
const { spawn, execSync } = require('child_process');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const extract = require('extract-zip');

// Print with color
const print = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
};

// Platform-specific executable extensions
const getExecutableExtension = () => {
  return process.platform === 'win32' ? '.exe' : '';
};

// Helper to download a file with curl
const downloadWithCurl = (url, destination) => {
  return new Promise((resolve, reject) => {
    try {
      print.info(`Downloading with curl: ${url}`);
      // Use curl with redirects and create parent dirs
      fs.ensureDirSync(path.dirname(destination));
      
      // Use --location to follow redirects
      execSync(`curl --location --fail --silent --show-error --output "${destination}" "${url}"`, {
        stdio: 'inherit'
      });
      
      print.success(`Downloaded to ${destination}`);
      resolve();
    } catch (err) {
      print.error(`Failed to download using curl: ${err.message}`);
      reject(err);
    }
  });
};

// Helper to find executable in extracted directory (recursive)
const findExecutableInExtracted = async (dir, fileName) => {
  try {
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
  } catch (err) {
    print.error(`Error searching for ${fileName}: ${err.message}`);
  }
  
  return null;
};

// Download and set up yt-dlp
const setupYtdlp = async (binDir) => {
  const extPath = getExecutableExtension();
  const ytdlpPath = path.join(binDir, `yt-dlp${extPath}`);
  
  if (fs.existsSync(ytdlpPath)) {
    print.success('yt-dlp already exists, skipping download');
    return;
  }
  
  try {
    // Direct download URL for yt-dlp
    const downloadUrl = process.platform === 'win32'
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
      
    await downloadWithCurl(downloadUrl, ytdlpPath);
    
    // Make executable on Unix platforms
    if (process.platform !== 'win32') {
      fs.chmodSync(ytdlpPath, 0o755);
    }
    
    print.success(`yt-dlp is now available at: ${ytdlpPath}`);
  } catch (error) {
    print.error(`Failed to download yt-dlp: ${error.message}`);
    throw error;
  }
};

// Download and set up ffmpeg
const setupFfmpeg = async (binDir) => {
  const extPath = getExecutableExtension();
  const ffmpegPath = path.join(binDir, `ffmpeg${extPath}`);
  
  if (fs.existsSync(ffmpegPath)) {
    print.success('ffmpeg already exists, skipping download');
    return;
  }
  
  try {
    if (process.platform === 'win32') {
      // For Windows, download a standalone ffmpeg.exe
      const ffmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
      const zipPath = path.join(binDir, 'ffmpeg.zip');
      const extractDir = path.join(binDir, 'ffmpeg-temp');
      
      print.info('Downloading ffmpeg.exe for Windows...');
      await downloadWithCurl(ffmpegUrl, zipPath);
      
      print.info('Extracting ffmpeg.zip...');
      await fs.ensureDir(extractDir);
      
      try {
        await extract(zipPath, { dir: extractDir });
        print.success('Successfully extracted ffmpeg.zip');
        
        // Find ffmpeg.exe in the extracted files
        print.info('Locating ffmpeg.exe in extracted files...');
        const ffmpegExe = await findExecutableInExtracted(extractDir, 'ffmpeg.exe');
        
        if (ffmpegExe) {
          // Copy to destination
          print.info(`Found ffmpeg.exe at ${ffmpegExe}`);
          await fs.copyFile(ffmpegExe, ffmpegPath);
          print.success(`Copied ffmpeg.exe to ${ffmpegPath}`);
        } else {
          print.error('Could not find ffmpeg.exe in extracted files');
          throw new Error('ffmpeg.exe not found in archive');
        }
        
        // Clean up
        print.info('Cleaning up temporary files...');
        await fs.remove(extractDir);
        await fs.remove(zipPath);
        print.success('Cleanup complete');
      } catch (err) {
        print.error(`Error extracting ffmpeg: ${err.message}`);
        print.info('Please extract it manually and place ffmpeg.exe in the bin directory:');
        print.info(`Bin directory: ${binDir}`);
      }
    } else {
      print.warning('Automatic ffmpeg download for non-Windows platforms not implemented.');
      print.info('Please download ffmpeg manually and place it in the bin directory:');
      print.info(`Bin directory: ${binDir}`);
    }
  } catch (error) {
    print.error(`Failed to set up ffmpeg: ${error.message}`);
    throw error;
  }
};

// Main function
async function main() {
  print.info('Setting up PlayListify development environment...');
  
  try {
    // Set up app userData directory for development
    const userDataDir = path.join(process.cwd(), 'dev-app-data');
    process.env.PLAYLISTIFY_DEV_APP_DATA = userDataDir;
    await fs.ensureDir(userDataDir);
    
    print.info(`Using development app data directory: ${userDataDir}`);
    
    // Ensure bin directory exists
    const binDir = path.join(userDataDir, 'bin');
    await fs.ensureDir(binDir);
    
    // Set up yt-dlp
    print.info('Setting up yt-dlp...');
    await setupYtdlp(binDir);
    
    // Set up ffmpeg
    print.info('Setting up ffmpeg...');
    await setupFfmpeg(binDir);
    
    print.success('Development environment setup complete');
  } catch (error) {
    print.error(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main(); 
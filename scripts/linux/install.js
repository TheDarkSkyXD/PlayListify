// PlayListify - Linux Dependency Installer
// Installs yt-dlp and FFmpeg for Linux platforms

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const { createWriteStream, existsSync, mkdirSync, chmodSync } = require('fs');

// Terminal color codes for colorful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper functions for colorful console output
const c = {
  success: text => console.log(`${colors.bright}${colors.green}✓ ${text}${colors.reset}`),
  error: text => console.log(`${colors.bright}${colors.red}✗ ${text}${colors.reset}`),
  info: text => console.log(`${colors.bright}${colors.cyan}ℹ ${text}${colors.reset}`),
  warning: text => console.log(`${colors.bright}${colors.yellow}⚠ ${text}${colors.reset}`),
  highlight: text => console.log(`${colors.bright}${colors.magenta}→ ${text}${colors.reset}`),
  step: text => console.log(`${colors.bright}${colors.blue}• ${text}${colors.reset}`),
  ask: text => console.log(`${colors.bright}${colors.yellow}? ${text}${colors.reset}`)
};

// Check if we're running on Linux
if (process.platform !== 'linux') {
  c.error('This script is for Linux only. Please use the appropriate script for your platform.');
  process.exit(1);
}

// Create directories for dependencies
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const YTDLP_BIN_DIR = path.join(YTDLP_DIR, 'bin');
const FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');
const FFMPEG_BIN_DIR = path.join(FFMPEG_DIR, 'bin');
const FFMPEG_TEMP_DIR = path.join(FFMPEG_DIR, 'temp');

// Get the correct binary URL based on architecture
function getFFmpegUrl() {
  const arch = process.arch;
  
  if (arch === 'x64') {
    return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
  } else if (arch === 'arm64') {
    return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz';
  } else if (arch === 'arm') {
    return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-armhf-static.tar.xz';
  } else {
    return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz';
  }
}

// Download a file from a URL to a destination path
function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destinationPath);
    
    c.info(`Downloading from: ${url}`);
    c.info(`Saving to: ${destinationPath}`);
    
    https.get(url, response => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        c.info(`Following redirect to: ${response.headers.location}`);
        downloadFile(response.headers.location, destinationPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      const contentLength = response.headers['content-length'];
      let downloadedBytes = 0;
      let lastLoggedPercent = -1;
      
      response.on('data', chunk => {
        downloadedBytes += chunk.length;
        
        if (contentLength) {
          const percent = Math.floor((downloadedBytes / contentLength) * 100);
          
          // Only log on percent change to reduce console spam
          if (percent % 10 === 0 && percent !== lastLoggedPercent) {
            process.stdout.write(`${colors.bright}${colors.cyan}   ↳ Download progress: ${percent}%${colors.reset}\r`);
            lastLoggedPercent = percent;
          }
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`${colors.bright}${colors.green}   ↳ Download completed: 100%${colors.reset}       `);
        resolve();
      });
      
      file.on('error', err => {
        fs.unlink(destinationPath, () => {}); // Delete the file on error
        reject(err);
      });
      
    }).on('error', err => {
      fs.unlink(destinationPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Install yt-dlp
async function installYtDlp() {
  try {
    // Create directories if they don't exist
    if (!existsSync(YTDLP_DIR)) {
      c.step('Creating yt-dlp directory...');
      mkdirSync(YTDLP_DIR, { recursive: true });
    }
    
    if (!existsSync(YTDLP_BIN_DIR)) {
      c.step('Creating yt-dlp bin directory...');
      mkdirSync(YTDLP_BIN_DIR, { recursive: true });
    }
    
    // Download yt-dlp
    const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    const ytdlpPath = path.join(YTDLP_BIN_DIR, 'yt-dlp');
    
    c.step('Downloading yt-dlp...');
    await downloadFile(ytdlpUrl, ytdlpPath);
    
    // Set executable permissions
    c.step('Setting executable permissions...');
    chmodSync(ytdlpPath, '755');
    
    // Verify the yt-dlp binary works correctly
    c.step('Verifying yt-dlp installation...');
    const ytdlpResult = spawnSync(ytdlpPath, ['--version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ytdlpResult.status === 0) {
      c.success(`yt-dlp installation verified (version: ${ytdlpResult.stdout.trim()})`);
      return true;
    } else {
      c.error('yt-dlp verification failed');
      c.error(`Error: ${ytdlpResult.stderr}`);
      return false;
    }
  } catch (error) {
    c.error(`Failed to install yt-dlp: ${error.message}`);
    return false;
  }
}

// Extract FFmpeg tar.xz archive
function extractFFmpeg(archivePath, extractDir) {
  c.step(`Extracting FFmpeg archive: ${archivePath}`);
  
  try {
    // Create extraction directory if it doesn't exist
    if (!existsSync(extractDir)) {
      mkdirSync(extractDir, { recursive: true });
    }
    
    // Use tar command to extract tar.xz file
    execSync(`tar -xf "${archivePath}" -C "${extractDir}"`, { stdio: 'inherit' });
    c.success('FFmpeg archive extracted successfully');
    return true;
  } catch (error) {
    c.error(`Failed to extract FFmpeg archive: ${error.message}`);
    return false;
  }
}

// Copy FFmpeg binaries to the bin directory
function copyFFmpegBinaries(extractDir) {
  c.step('Copying FFmpeg binaries to bin directory...');
  
  try {
    // Find the extracted FFmpeg directory
    const items = fs.readdirSync(extractDir);
    const ffmpegDir = items.find(item => item.startsWith('ffmpeg-') && fs.statSync(path.join(extractDir, item)).isDirectory());
    
    if (!ffmpegDir) {
      throw new Error('Could not find FFmpeg directory in the extracted files');
    }
    
    const ffmpegExtractDir = path.join(extractDir, ffmpegDir);
    
    // Create the bin directory if it doesn't exist
    if (!existsSync(FFMPEG_BIN_DIR)) {
      mkdirSync(FFMPEG_BIN_DIR, { recursive: true });
    }
    
    // Copy FFmpeg binary
    const ffmpegPath = path.join(ffmpegExtractDir, 'ffmpeg');
    if (existsSync(ffmpegPath)) {
      fs.copyFileSync(ffmpegPath, path.join(FFMPEG_BIN_DIR, 'ffmpeg'));
      chmodSync(path.join(FFMPEG_BIN_DIR, 'ffmpeg'), '755');
      c.success('Copied ffmpeg to bin directory');
    } else {
      c.warning('Could not find ffmpeg in the extracted files');
      return false;
    }
    
    // Copy FFprobe binary
    const ffprobePath = path.join(ffmpegExtractDir, 'ffprobe');
    if (existsSync(ffprobePath)) {
      fs.copyFileSync(ffprobePath, path.join(FFMPEG_BIN_DIR, 'ffprobe'));
      chmodSync(path.join(FFMPEG_BIN_DIR, 'ffprobe'), '755');
      c.success('Copied ffprobe to bin directory');
    } else {
      c.warning('Could not find ffprobe in the extracted files');
    }
    
    return true;
  } catch (error) {
    c.error(`Failed to copy FFmpeg binaries: ${error.message}`);
    return false;
  }
}

// Clean up temporary files
function cleanupTempFiles() {
  c.step('Cleaning up temporary files...');
  
  try {
    if (existsSync(FFMPEG_TEMP_DIR)) {
      fs.rmSync(FFMPEG_TEMP_DIR, { recursive: true, force: true });
      c.success(`Removed temporary directory: ${FFMPEG_TEMP_DIR}`);
    }
    
    return true;
  } catch (error) {
    c.warning(`Failed to clean up temporary files: ${error.message}`);
    return false;
  }
}

// Install FFmpeg
async function installFFmpeg() {
  try {
    // Create directories if they don't exist
    if (!existsSync(FFMPEG_DIR)) {
      c.step('Creating FFmpeg directory...');
      mkdirSync(FFMPEG_DIR, { recursive: true });
    }
    
    if (!existsSync(FFMPEG_BIN_DIR)) {
      c.step('Creating FFmpeg bin directory...');
      mkdirSync(FFMPEG_BIN_DIR, { recursive: true });
    }
    
    if (!existsSync(FFMPEG_TEMP_DIR)) {
      c.step('Creating FFmpeg temp directory...');
      mkdirSync(FFMPEG_TEMP_DIR, { recursive: true });
    }
    
    // Download FFmpeg
    const ffmpegUrl = getFFmpegUrl();
    const archivePath = path.join(FFMPEG_TEMP_DIR, 'ffmpeg.tar.xz');
    
    c.step('Downloading FFmpeg...');
    await downloadFile(ffmpegUrl, archivePath);
    
    // Extract the archive
    const extractSuccess = extractFFmpeg(archivePath, FFMPEG_TEMP_DIR);
    if (!extractSuccess) {
      throw new Error('Failed to extract FFmpeg archive');
    }
    
    // Copy the binaries to our bin directory
    const copySuccess = copyFFmpegBinaries(FFMPEG_TEMP_DIR);
    if (!copySuccess) {
      throw new Error('Failed to copy FFmpeg binaries');
    }
    
    // Clean up temporary files
    cleanupTempFiles();
    
    // Verify FFmpeg installation
    c.step('Verifying FFmpeg installation...');
    const ffmpegResult = spawnSync(path.join(FFMPEG_BIN_DIR, 'ffmpeg'), ['-version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ffmpegResult.status === 0) {
      const versionLine = ffmpegResult.stdout.split('\n')[0];
      c.success(`FFmpeg installation verified: ${versionLine}`);
      return true;
    } else {
      c.error('FFmpeg verification failed');
      c.error(`Error: ${ffmpegResult.stderr}`);
      return false;
    }
  } catch (error) {
    c.error(`Failed to install FFmpeg: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.blue}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║           LINUX DEPENDENCY INSTALLER            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  // Install yt-dlp
  c.highlight('Step 1: Installing yt-dlp...');
  const ytdlpSuccess = await installYtDlp();
  
  if (!ytdlpSuccess) {
    c.error('Failed to install yt-dlp. Aborting installation.');
    process.exit(1);
  }
  
  // Install FFmpeg
  c.highlight('Step 2: Installing FFmpeg...');
  const ffmpegSuccess = await installFFmpeg();
  
  if (!ffmpegSuccess) {
    c.error('Failed to install FFmpeg. Some features may not work properly.');
  }
  
  console.log('\n');
  c.success('Linux dependency installation completed successfully!');
  console.log('\n');
  
  // Instructions for running PlayListify
  c.info('You can now run PlayListify with:');
  c.info('  npm start');
  console.log('\n');
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    c.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { installYtDlp, installFFmpeg }; 
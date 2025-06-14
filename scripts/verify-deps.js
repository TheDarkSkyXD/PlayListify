// PlayListify - Dependency Verification Script
// Checks if yt-dlp and FFmpeg are correctly installed

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
  step: text => console.log(`${colors.bright}${colors.blue}• ${text}${colors.reset}`)
};

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');

// Function to check if dependencies are installed
function checkDependencies() {
  // Check if ytdlp directory exists
  if (!fs.existsSync(YTDLP_DIR)) {
    c.warning('yt-dlp directory not found');
    return false;
  }
  
  // Check if ffmpeg directory exists
  if (!fs.existsSync(FFMPEG_DIR)) {
    c.warning('FFmpeg directory not found');
    return false;
  }
  
  // Verify binary existence based on platform
  const isWindows = process.platform === 'win32';
  const ytdlpBin = path.join(YTDLP_DIR, 'bin');
  const ffmpegBin = path.join(FFMPEG_DIR, 'bin');
  
  // Check for bin directories
  if (!fs.existsSync(ytdlpBin)) {
    c.warning(`yt-dlp bin directory not found at ${ytdlpBin}`);
    return false;
  }
  
  if (!fs.existsSync(ffmpegBin)) {
    c.warning(`FFmpeg bin directory not found at ${ffmpegBin}`);
    return false;
  }
  
  // Check binaries
  const ytdlpBinary = path.join(ytdlpBin, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const ffmpegBinary = path.join(ffmpegBin, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  
  if (!fs.existsSync(ytdlpBinary)) {
    c.warning(`yt-dlp binary not found at ${ytdlpBinary}`);
    return false;
  }
  
  if (!fs.existsSync(ffmpegBinary)) {
    c.warning(`FFmpeg binary not found at ${ffmpegBinary}`);
    return false;
  }
  
  // Test yt-dlp functionality
  try {
    c.step('Testing yt-dlp...');
    const ytdlpResult = spawnSync(ytdlpBinary, ['--version'], { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ytdlpResult.status !== 0) {
      c.warning(`yt-dlp exists but not working correctly: ${ytdlpResult.stderr}`);
      return false;
    }
    
    c.success(`yt-dlp is working (version: ${ytdlpResult.stdout.trim()})`);
  } catch (error) {
    c.warning(`Error testing yt-dlp: ${error.message}`);
    return false;
  }
  
  // Test FFmpeg functionality
  try {
    c.step('Testing FFmpeg...');
    const ffmpegResult = spawnSync(ffmpegBinary, ['-version'], { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ffmpegResult.status !== 0) {
      c.warning(`FFmpeg exists but not working correctly: ${ffmpegResult.stderr}`);
      return false;
    }
    
    c.success(`FFmpeg is working (${ffmpegResult.stdout.split('\n')[0].trim()})`);
  } catch (error) {
    c.warning(`Error testing FFmpeg: ${error.message}`);
    return false;
  }
  
  return true;
}

// Main function
function main() {
  c.info('Verifying PlayListify dependencies...');
  
  // Check if dependencies are correctly installed
  const depsInstalled = checkDependencies();
  
  // Return result
  if (depsInstalled) {
    c.success('All dependencies are correctly installed');
    process.exit(0); // Success
  } else {
    c.error('Some dependencies are missing or not working correctly');
    c.info('Please run: npm run setup:deps');
    process.exit(1); // Error
  }
}

// Run the main function
main(); 
// PlayListify - Development Startup Helper
// Checks dependencies and launches the app in development mode

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { existsSync } = require('fs');

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
  section: (emoji, text) => console.log(`${colors.bright}${colors.blue}${emoji} ${text}${colors.reset}\n${colors.dim}-----------------------------------------------${colors.reset}`)
};

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEP_INSTALL_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'install-dependencies.js');
const YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');

// Function to check if dependencies are installed
function checkDependencies() {
  c.section('🔍', 'CHECKING DEPENDENCIES');
  
  // Check if ytdlp directory exists
  if (!existsSync(YTDLP_DIR)) {
    c.warning('yt-dlp not found. Installing dependencies...');
    return false;
  }
  
  // Check if ffmpeg directory exists
  if (!existsSync(FFMPEG_DIR)) {
    c.warning('FFmpeg not found. Installing dependencies...');
    return false;
  }
  
  // Verify binary existence based on platform
  const isWindows = process.platform === 'win32';
  const ytdlpBinary = path.join(YTDLP_DIR, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const ffmpegBinary = path.join(FFMPEG_DIR, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  
  if (!existsSync(ytdlpBinary)) {
    c.warning(`yt-dlp binary not found at ${ytdlpBinary}`);
    return false;
  }
  
  if (!existsSync(ffmpegBinary)) {
    c.warning(`FFmpeg binary not found at ${ffmpegBinary}`);
    return false;
  }
  
  // If we get here, dependencies are installed
  c.success('All dependencies are installed');
  return true;
}

// Function to install dependencies
function installDependencies() {
  c.section('📦', 'INSTALLING DEPENDENCIES');
  
  try {
    // Run the dependency installation script
    const result = spawnSync('node', [DEP_INSTALL_SCRIPT], {
      stdio: 'inherit',
      shell: true
    });
    
    if (result.status !== 0) {
      c.error('Failed to install dependencies');
      process.exit(1);
    }
    
    c.success('Dependencies installed successfully');
  } catch (error) {
    c.error(`Error installing dependencies: ${error.message}`);
    process.exit(1);
  }
}

// Function to test dependencies
function testDependencies() {
  c.section('🧪', 'TESTING DEPENDENCIES');
  
  try {
    const isWindows = process.platform === 'win32';
    const ytdlpBinary = path.join(YTDLP_DIR, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    const ffmpegBinary = path.join(FFMPEG_DIR, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg');
    
    // Test yt-dlp
    c.step('Testing yt-dlp...');
    const ytdlpOutput = spawnSync(ytdlpBinary, ['--version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ytdlpOutput.status === 0) {
      c.success(`yt-dlp version: ${ytdlpOutput.stdout.trim()}`);
    } else {
      c.error('Failed to run yt-dlp');
      return false;
    }
    
    // Test FFmpeg
    c.step('Testing FFmpeg...');
    const ffmpegOutput = spawnSync(ffmpegBinary, ['-version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (ffmpegOutput.status === 0) {
      const version = ffmpegOutput.stdout.split('\n')[0];
      c.success(`FFmpeg version: ${version.trim()}`);
    } else {
      c.error('Failed to run FFmpeg');
      return false;
    }
    
    return true;
  } catch (error) {
    c.error(`Error testing dependencies: ${error.message}`);
    return false;
  }
}

// Function to start the app in development mode
function startDevApp() {
  c.section('🚀', 'STARTING DEVELOPMENT MODE');
  c.info('Starting electron-forge with development flags...');
  
  try {
    // Run electron-forge with NODE_ENV=development
    const result = spawnSync('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        ELECTRON_DEV: 'true',
        ELECTRON_DEBUG: 'true'
      }
    });
    
    if (result.status !== 0) {
      c.error(`Development app exited with code ${result.status}`);
    }
  } catch (error) {
    c.error(`Error starting development app: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.green}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.green}║         PLAYLISTIFY DEV MODE LAUNCHER           ║${colors.reset}`);
  console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  // Check dependencies
  const depsInstalled = checkDependencies();
  
  // If dependencies aren't installed, install them
  if (!depsInstalled) {
    installDependencies();
  }
  
  // Test dependencies
  if (testDependencies()) {
    // Start the app in development mode
    startDevApp();
  } else {
    c.error('Dependency tests failed. Please check your installation.');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 
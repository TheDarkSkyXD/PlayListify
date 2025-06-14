// PlayListify - Dependency Installer (Cross-Platform)
// Detects platform and calls the appropriate OS-specific installation script

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
  highlight: text => console.log(`${colors.bright}${colors.magenta}→ ${text}${colors.reset}`),
  step: text => console.log(`${colors.bright}${colors.blue}• ${text}${colors.reset}`)
};

// Get current platform
const platform = process.platform;

// Main function
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║            DEPENDENCY INSTALLER                  ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  c.info(`Detected platform: ${platform}`);
  
  // Installation directories
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  
  // Check if environment variables were set for the installation directories
  const YTDLP_DIR = process.env.YTDLP_DIR || path.join(PROJECT_ROOT, 'dev-app-data', 'ytdlp');
  const FFMPEG_DIR = process.env.FFMPEG_DIR || path.join(PROJECT_ROOT, 'dev-app-data', 'ffmpeg');
  
  c.info(`yt-dlp will be installed to: ${YTDLP_DIR}`);
  c.info(`FFmpeg will be installed to: ${FFMPEG_DIR}`);
  
  // Path to platform-specific install script
  let scriptPath;
  
  switch (platform) {
    case 'win32':
      scriptPath = path.join(__dirname, 'windows', 'install.js');
      c.info('Using Windows installation script');
      break;
    case 'darwin':
      scriptPath = path.join(__dirname, 'macos', 'install.js');
      c.info('Using macOS installation script');
      break;
    case 'linux':
      scriptPath = path.join(__dirname, 'linux', 'install.js');
      c.info('Using Linux installation script');
      break;
    default:
      c.error(`Unsupported platform: ${platform}`);
      c.error('Cannot install dependencies automatically.');
      c.info('Please install yt-dlp and FFmpeg manually for your platform.');
      process.exit(1);
  }
  
  // Check if the script exists
  if (!fs.existsSync(scriptPath)) {
    c.error(`Installation script not found: ${scriptPath}`);
    process.exit(1);
  }
  
  // Run the platform-specific install script
  c.step('Running platform-specific installation script...');
  
  // Ensure installation environment variables are passed to the script
  const env = { ...process.env };
  env.YTDLP_DIR = YTDLP_DIR;
  env.FFMPEG_DIR = FFMPEG_DIR;
  
  const result = spawnSync('node', [scriptPath], {
    stdio: 'inherit',
    shell: true,
    env: env
  });
  
  if (result.status === 0) {
    console.log('\n');
    c.success('Dependency installation completed successfully!');
  } else {
    console.log('\n');
    c.error('Dependency installation failed!');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 
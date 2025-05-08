// PlayListify - Windows Uninstaller
// Removes yt-dlp, FFmpeg, and application data on Windows

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
  step: text => console.log(`${colors.bright}${colors.blue}• ${text}${colors.reset}`),
  ask: text => console.log(`${colors.bright}${colors.yellow}? ${text}${colors.reset}`)
};

// Check if we're running on Windows
if (process.platform !== 'win32') {
  c.error('This script is for Windows only. Please use the appropriate script for your platform.');
  process.exit(1);
}

// Define paths to dependency directories
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');

// Function to remove a directory recursively
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    c.step(`Removing directory: ${dirPath}`);
    
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      c.success(`Successfully removed: ${dirPath}`);
      return true;
    } catch (error) {
      c.error(`Failed to remove directory: ${error.message}`);
      return false;
    }
  } else {
    c.info(`Directory does not exist: ${dirPath}`);
    return true; // Return true since there's nothing to do
  }
}

// Function to cleanup application data - Windows specific
function cleanupAppData() {
  try {
    const appName = 'PlayListify';
    const appDataPath = path.join(process.env.APPDATA, appName);
    
    if (fs.existsSync(appDataPath)) {
      c.step(`Removing application data: ${appDataPath}`);
      fs.rmSync(appDataPath, { recursive: true, force: true });
      c.success(`Successfully removed application data`);
    } else {
      c.info(`No application data found at: ${appDataPath}`);
    }

    // Also check LocalAppData location
    const localAppDataPath = path.join(process.env.LOCALAPPDATA, appName);
    
    if (fs.existsSync(localAppDataPath)) {
      c.step(`Removing local application data: ${localAppDataPath}`);
      fs.rmSync(localAppDataPath, { recursive: true, force: true });
      c.success(`Successfully removed local application data`);
    }
    
    return true;
  } catch (error) {
    c.error(`Failed to clean up application data: ${error.message}`);
    return false;
  }
}

// Ask user for confirmation before deleting data
function promptForConfirmation(message) {
  return new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    c.warning(message);
    process.stdout.write(`${colors.bright}${colors.yellow}? Confirm (y/n): ${colors.reset}`);
    
    readline.question('', answer => {
      readline.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Main uninstall function
async function uninstall() {
  console.log('\n');
  console.log(`${colors.bright}${colors.red}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.red}║            WINDOWS UNINSTALLER                   ║${colors.reset}`);
  console.log(`${colors.bright}${colors.red}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  c.info('Starting Windows uninstall process...');
  
  // Ask for confirmation before removing dependencies
  const confirmDeps = await promptForConfirmation('This will remove yt-dlp and FFmpeg from your project directory.');
  
  if (confirmDeps) {
    // Remove yt-dlp directory
    removeDirectory(YTDLP_DIR);
    
    // Remove FFmpeg directory
    removeDirectory(FFMPEG_DIR);
    
    c.success('Dependencies have been removed.');
  } else {
    c.info('Dependencies will not be removed.');
  }
  
  // Ask for confirmation before removing app data
  const confirmData = await promptForConfirmation('Do you want to remove all application data? This includes your settings and downloaded content.');
  
  if (confirmData) {
    cleanupAppData();
    
    // Also try to clean registry entries
    c.step('Attempting to clean registry entries...');
    
    try {
      // Try to remove registry entries using reg command
      const regResult = spawnSync('reg', ['delete', 'HKCU\\Software\\PlayListify', '/f'], {
        encoding: 'utf8',
        stdio: 'pipe',
        shell: true
      });
      
      if (regResult.status === 0) {
        c.success('Registry entries removed successfully.');
      } else {
        c.info('No registry entries found or unable to remove them.');
      }
    } catch (error) {
      c.warning(`Failed to remove registry entries: ${error.message}`);
    }
  } else {
    c.info('Application data will be preserved.');
  }
  
  console.log('\n');
  c.success('Windows uninstall process completed.');
  c.info('Thank you for using PlayListify!');
  console.log('\n');
}

// Run the uninstall function
if (require.main === module) {
  uninstall().catch(error => {
    c.error(`Unhandled error during uninstall: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { removeDirectory, cleanupAppData }; 
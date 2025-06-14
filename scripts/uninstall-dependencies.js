// PlayListify - Dependency Uninstaller (Cross-Platform)
// Detects platform and calls the appropriate OS-specific uninstallation script

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

// Ask user for confirmation before proceeding
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

// Main function
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.red}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.red}║            DEPENDENCY UNINSTALLER                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.red}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  c.info(`Detected platform: ${platform}`);
  
  // Confirm uninstallation
  const confirmed = await promptForConfirmation('This will uninstall all PlayListify dependencies and may remove application data. Proceed?');
  
  if (!confirmed) {
    c.info('Uninstallation cancelled.');
    process.exit(0);
  }
  
  // Path to platform-specific uninstall script
  let scriptPath;
  
  switch (platform) {
    case 'win32':
      scriptPath = path.join(__dirname, 'windows', 'uninstall.js');
      c.info('Using Windows uninstallation script');
      break;
    case 'darwin':
      scriptPath = path.join(__dirname, 'macos', 'uninstall.js');
      c.info('Using macOS uninstallation script');
      break;
    case 'linux':
      scriptPath = path.join(__dirname, 'linux', 'uninstall.js');
      c.info('Using Linux uninstallation script');
      break;
    default:
      c.error(`Unsupported platform: ${platform}`);
      c.error('Cannot uninstall dependencies automatically.');
      c.info('Please uninstall yt-dlp and FFmpeg manually for your platform.');
      process.exit(1);
  }
  
  // Check if the script exists
  if (!fs.existsSync(scriptPath)) {
    c.error(`Uninstallation script not found: ${scriptPath}`);
    process.exit(1);
  }
  
  // Run the platform-specific uninstall script
  c.step('Running platform-specific uninstallation script...');
  
  const result = spawnSync('node', [scriptPath], {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status === 0) {
    console.log('\n');
    c.success('Dependency uninstallation completed successfully!');
  } else {
    console.log('\n');
    c.error('Dependency uninstallation failed!');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 
// Custom start script that checks for yt-dlp before starting the app
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the absolute path to the ytdlp-setup.js script
const setupScriptPath = path.resolve(__dirname, 'ytdlp-setup.js');

// First run our yt-dlp setup script
try {
  // Check if the setup script exists
  if (!fs.existsSync(setupScriptPath)) {
    console.error(`Setup script not found at: ${setupScriptPath}`);
    throw new Error('Setup script not found');
  }
  
  // Run the setup script
  console.log(`Running setup script: ${setupScriptPath}`);
  execSync(`node "${setupScriptPath}"`, { stdio: 'inherit' });
  
  // Then start the Electron app normally
  console.log('\n📱 Starting Electron app...\n');
  execSync('electron-forge start', { stdio: 'inherit' });
} catch (error) {
  // If there's an error with the setup script, still try to start the app
  console.error('Error during setup:', error.message);
  console.log('\n🚨 There was an issue with setup, but we will try to start the app anyway\n');
  
  try {
    execSync('electron-forge start', { stdio: 'inherit' });
  } catch (appError) {
    console.error('Failed to start the app:', appError.message);
    process.exit(1);
  }
} 
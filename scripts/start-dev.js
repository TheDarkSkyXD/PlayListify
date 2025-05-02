#!/usr/bin/env node

/**
 * Development start script for PlayListify
 * 
 * This script ensures dependencies are installed and then starts the app.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Print with color
const print = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warning: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
};

// Run a command and wait for completion
function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    print.info(`Running: ${cmd} ${args.join(' ')}`);
    
    const childProcess = spawn(cmd, args, { 
      stdio: 'inherit', 
      shell: process.platform === 'win32',
      ...options 
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
    
    childProcess.on('error', reject);
  });
}

// Main function
async function main() {
  try {
    // Set up app userData directory for development
    const userDataDir = path.join(process.cwd(), 'dev-app-data');
    process.env.PLAYLISTIFY_DEV_APP_DATA = userDataDir;
    
    // Run the dependency setup script first
    await runCommand('node', ['scripts/setup-dev.js']);
    
    // Start the app with cross-env for NODE_ENV
    print.info('Starting PlayListify in development mode...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    // Set environment variables
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      PLAYLISTIFY_DEV_APP_DATA: userDataDir
    };
    
    // Run electron-forge directly to avoid npm script issues
    const electronForgeCmd = process.platform === 'win32' ? '.\\node_modules\\.bin\\electron-forge.cmd' : './node_modules/.bin/electron-forge';
    await runCommand(electronForgeCmd, ['start'], { env });
    
  } catch (error) {
    print.error(`Failed to start: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main(); 
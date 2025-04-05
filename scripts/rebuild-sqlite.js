#!/usr/bin/env node

/**
 * This script rebuilds the better-sqlite3 native module for Electron
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// Get the electron version from package.json
const packageJson = require('../package.json');
const electronVersion = packageJson.devDependencies.electron.replace('^', '');

console.log(`Rebuilding better-sqlite3 for Electron v${electronVersion}...`);

try {
  // Create a temporary directory for the rebuild
  const tempDir = path.join(os.tmpdir(), 'playlistify-rebuild');
  fs.ensureDirSync(tempDir);
  
  // Copy package.json to the temp directory
  fs.copyFileSync(
    path.join(__dirname, '../package.json'),
    path.join(tempDir, 'package.json')
  );
  
  // Change to the temp directory
  process.chdir(tempDir);
  
  // Install better-sqlite3
  console.log('Installing better-sqlite3...');
  execSync('npm install better-sqlite3 --no-save', { stdio: 'inherit' });
  
  // Rebuild better-sqlite3 for the current Electron version
  console.log(`Rebuilding for Electron v${electronVersion}...`);
  execSync(`npx electron-rebuild -f -w better-sqlite3 -v ${electronVersion}`, { stdio: 'inherit' });
  
  // Copy the rebuilt module back to the project
  const modulePath = path.join(tempDir, 'node_modules/better-sqlite3/build/Release');
  const targetPath = path.join(__dirname, '../node_modules/better-sqlite3/build/Release');
  
  console.log(`Copying rebuilt module from ${modulePath} to ${targetPath}...`);
  fs.ensureDirSync(targetPath);
  fs.copySync(modulePath, targetPath);
  
  console.log('Rebuild completed successfully!');
  
  // Clean up
  fs.removeSync(tempDir);
} catch (error) {
  console.error('Error rebuilding better-sqlite3:', error);
  process.exit(1);
}

#!/usr/bin/env node

/**
 * This script resets the database and rebuilds the application
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for confirmation
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  try {
    console.log('=== Rebuilding Application ===');
    
    // Step 1: Reset the database
    console.log('\n1. Resetting database...');
    
    // Get database path
    const dbDir = path.join(process.cwd(), 'database');
    const dbPath = path.join(dbDir, 'playlistify.db');
    
    if (fs.existsSync(dbPath)) {
      // Create a backup before deleting
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(dbDir, 'backups');
      fs.ensureDirSync(backupDir);
      const backupPath = path.join(backupDir, `playlistify_backup_${timestamp}.db`);
      
      console.log(`Creating backup at ${backupPath}...`);
      fs.copyFileSync(dbPath, backupPath);
      
      // Delete the database file
      console.log(`Deleting database file at ${dbPath}...`);
      fs.unlinkSync(dbPath);
      
      // Also remove the WAL and SHM files if they exist
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
      
      console.log('Database reset complete.');
    } else {
      console.log('No database file found. Skipping reset.');
    }
    
    // Step 2: Clean the webpack directory
    console.log('\n2. Cleaning webpack directory...');
    
    const webpackDir = path.join(process.cwd(), '.webpack');
    if (fs.existsSync(webpackDir)) {
      console.log(`Deleting webpack directory at ${webpackDir}...`);
      fs.removeSync(webpackDir);
      console.log('Webpack directory deleted.');
    } else {
      console.log('No webpack directory found. Skipping cleanup.');
    }
    
    // Step 3: Start the application
    console.log('\n3. Starting the application...');
    console.log('The application will now start with the new database schema.');
    console.log('Please test adding videos to custom playlists to ensure it works correctly.');
    
    // Close the readline interface
    rl.close();
    
    // Start the application
    console.log('\nStarting application...');
    execSync('npm start', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the main function
main();

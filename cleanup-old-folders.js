/**
 * This script removes the old main and renderer folders after the migration to backend and frontend.
 * Only run this script after verifying that the application works correctly with the new folder structure.
 */

const fs = require('fs-extra');
const path = require('path');

async function cleanup() {
  console.log('Starting cleanup of old folders...');
  
  try {
    // Check if the new folders exist
    const backendExists = await fs.pathExists(path.join(__dirname, 'src', 'backend'));
    const frontendExists = await fs.pathExists(path.join(__dirname, 'src', 'frontend'));
    
    if (!backendExists || !frontendExists) {
      console.error('Error: New folders (backend and/or frontend) do not exist. Aborting cleanup.');
      process.exit(1);
    }
    
    // Remove the old folders
    console.log('Removing src/main folder...');
    await fs.remove(path.join(__dirname, 'src', 'main'));
    console.log('Successfully removed src/main folder.');
    
    console.log('Removing src/renderer folder...');
    await fs.remove(path.join(__dirname, 'src', 'renderer'));
    console.log('Successfully removed src/renderer folder.');
    
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Ask for confirmation before proceeding
console.log('\x1b[33m%s\x1b[0m', 'WARNING: This script will permanently delete the src/main and src/renderer folders.');
console.log('\x1b[33m%s\x1b[0m', 'Make sure you have verified that the application works correctly with the new folder structure.');
console.log('\x1b[33m%s\x1b[0m', 'Only proceed if you are sure you want to delete these folders.');
console.log('');
console.log('To proceed, type "yes" and press Enter:');

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const input = data.toString().trim().toLowerCase();
  
  if (input === 'yes') {
    cleanup().then(() => {
      process.exit(0);
    });
  } else {
    console.log('Cleanup aborted.');
    process.exit(0);
  }
});

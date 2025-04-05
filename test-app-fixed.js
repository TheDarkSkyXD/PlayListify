/**
 * This script tests the application with the fixed configuration.
 * It runs the application in development mode and logs any errors.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Check if the required files exist
const requiredFiles = [
  'src/frontend/index.html',
  'src/frontend/renderer.tsx',
  'src/backend/preload.ts',
  'src/backend/preload-commonjs.js',
  'src/backend/main.ts'
];

console.log('Checking if required files exist...');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`Error: ${file} does not exist.`);
    process.exit(1);
  }
}
console.log('All required files exist.');

// Run the application
console.log('Starting the application...');
const child = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Application exited with code ${code}`);
    process.exit(code);
  }
});

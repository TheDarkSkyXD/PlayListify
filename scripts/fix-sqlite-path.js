#!/usr/bin/env node

/**
 * This script fixes the SQLite module path issue by creating a symbolic link
 * to the correct location of the better-sqlite3 native module.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Get the path to the better-sqlite3 module
const modulePath = path.join(__dirname, '../node_modules/better-sqlite3');
const buildPath = path.join(modulePath, 'build');
const releasePath = path.join(buildPath, 'Release');

console.log('Fixing SQLite module path...');

try {
  // Check if the module exists
  if (!fs.existsSync(modulePath)) {
    console.error('better-sqlite3 module not found. Please run "npm install" first.');
    process.exit(1);
  }

  // Check if the build directory exists
  if (!fs.existsSync(buildPath)) {
    console.log('Creating build directory...');
    fs.mkdirSync(buildPath);
  }

  // Check if the Release directory exists
  if (!fs.existsSync(releasePath)) {
    console.log('Creating Release directory...');
    fs.mkdirSync(releasePath);
  }

  // Find the .node file
  const nodeFiles = fs.readdirSync(modulePath, { recursive: true })
    .filter(file => file.endsWith('.node') && file.includes('better_sqlite3'));

  if (nodeFiles.length === 0) {
    console.error('No .node file found. Please run "npm run rebuild:sqlite" first.');
    process.exit(1);
  }

  // Get the first .node file
  const nodeFile = nodeFiles[0];
  const nodeFilePath = path.join(modulePath, nodeFile);
  const targetPath = path.join(releasePath, 'better_sqlite3.node');

  console.log(`Found .node file: ${nodeFilePath}`);
  console.log(`Creating copy at: ${targetPath}`);

  // Copy the .node file to the Release directory
  fs.copyFileSync(nodeFilePath, targetPath);

  console.log('SQLite module path fixed successfully!');
} catch (error) {
  console.error('Error fixing SQLite module path:', error);
  process.exit(1);
}

// PlayListify - SQLite Fix Script
// Fixes SQLite path issues on Windows platform

const fs = require('fs');
const path = require('path');
const { platform } = process;

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

// This script will only run on Windows
if (platform !== 'win32') {
  c.info('This script is only needed on Windows platforms.');
  c.success('No action needed on this platform.');
  process.exit(0);
}

c.step('Checking for SQLite module in node_modules...');

// Find node_modules directory
const findNodeModules = (startDir) => {
  let currentDir = startDir;
  
  while (currentDir !== path.parse(currentDir).root) {
    const nodeModulesPath = path.join(currentDir, 'node_modules');
    
    if (fs.existsSync(nodeModulesPath)) {
      return nodeModulesPath;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
};

// Find SQLite3 binary files
const findSqliteBinaries = (nodeModulesPath) => {
  const sqlitePath = path.join(nodeModulesPath, 'sqlite3');
  
  if (!fs.existsSync(sqlitePath)) {
    c.warning('SQLite3 module not found in node_modules!');
    return null;
  }
  
  c.info(`Found SQLite3 module at: ${sqlitePath}`);
  
  // Find the build/Release directory which contains the binaries
  const releasePath = path.join(sqlitePath, 'lib', 'binding', 'napi-v6-win32-x64', 'node_sqlite3.node');
  
  if (fs.existsSync(releasePath)) {
    c.success('Found SQLite3 binary file.');
    return releasePath;
  }
  
  // If not found in the default location, try to search for it
  c.warning('SQLite3 binary not found in the expected location.');
  c.step('Searching for SQLite3 binary in the module directory...');
  
  const results = [];
  
  // Recursive search function
  const findBinary = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findBinary(filePath);
        } else if (file === 'node_sqlite3.node') {
          results.push(filePath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  };
  
  findBinary(sqlitePath);
  
  if (results.length > 0) {
    c.success(`Found ${results.length} SQLite3 binary file(s).`);
    return results[0]; // Return the first found binary
  }
  
  c.error('Could not find SQLite3 binary file!');
  return null;
};

// Check if the binary exists and is accessible
const checkAndFixBinary = (binaryPath) => {
  if (!binaryPath) {
    return false;
  }
  
  try {
    // Check if the file exists and can be accessed
    fs.accessSync(binaryPath, fs.constants.R_OK);
    c.success('SQLite3 binary is accessible.');
    
    // Check file size to ensure it's not corrupted
    const stats = fs.statSync(binaryPath);
    
    if (stats.size === 0) {
      c.error('SQLite3 binary file exists but has zero size!');
      return false;
    }
    
    c.success(`SQLite3 binary file size: ${(stats.size / 1024).toFixed(2)} KB`);
    return true;
  } catch (error) {
    c.error(`Error accessing SQLite3 binary: ${error.message}`);
    return false;
  }
};

// Create a package.json fix if needed
const createSqliteConfigFix = (nodeModulesPath) => {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      c.warning('No package.json found in the current directory.');
      return false;
    }
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if we already have a configuration
    if (packageJson.overrides && packageJson.overrides.sqlite3) {
      c.info('SQLite3 override configuration already exists in package.json.');
      return true;
    }
    
    // Add the overrides section if it doesn't exist
    if (!packageJson.overrides) {
      packageJson.overrides = {};
    }
    
    // Add SQLite3 override configuration
    packageJson.overrides.sqlite3 = {
      'node-gyp': '8.4.1'
    };
    
    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    c.success('Added SQLite3 override configuration to package.json.');
    c.highlight('You may need to run "npm install" to apply the changes.');
    
    return true;
  } catch (error) {
    c.error(`Error creating SQLite3 configuration fix: ${error.message}`);
    return false;
  }
};

// Main function
async function main() {
  console.log('\n');
  c.info('Starting SQLite path fix for Windows...');
  
  // Find node_modules directory
  const nodeModulesPath = findNodeModules(process.cwd());
  
  if (!nodeModulesPath) {
    c.error('Could not find node_modules directory!');
    process.exit(1);
  }
  
  c.success(`Found node_modules at: ${nodeModulesPath}`);
  
  // Find SQLite3 binary
  const binaryPath = findSqliteBinaries(nodeModulesPath);
  
  if (binaryPath) {
    // Check and fix binary
    const binaryOk = checkAndFixBinary(binaryPath);
    
    if (binaryOk) {
      c.success('SQLite3 binary is accessible and appears valid.');
    } else {
      c.warning('SQLite3 binary may be corrupted or inaccessible.');
      c.step('Creating package.json configuration fix...');
      
      const fixCreated = createSqliteConfigFix(nodeModulesPath);
      
      if (fixCreated) {
        c.success('SQLite fix applied successfully.');
      } else {
        c.error('Failed to apply SQLite fix.');
        process.exit(1);
      }
    }
  } else {
    c.warning('SQLite3 binary not found, but this might be okay if you are not using SQLite.');
  }
  
  console.log('\n');
  c.success('SQLite path check completed.');
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 
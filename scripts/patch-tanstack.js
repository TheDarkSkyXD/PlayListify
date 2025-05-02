/**
 * This script directly patches TanStack Router files to fix the "warning is not a function" error
 * It should be run before webpack builds the application
 */

const fs = require('fs');
const path = require('path');

console.log('Patching TanStack Router files...');

// Define our warning function - as a proper module.exports
const warningFunction = `
// Simple warning function implementation
function warning(condition, message) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
  return undefined;
}
`;

// Path to node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// Create a tiny-warning module replacement
const tinyWarningPath = path.join(nodeModulesPath, 'tiny-warning');
if (!fs.existsSync(tinyWarningPath)) {
  fs.mkdirSync(tinyWarningPath, { recursive: true });
}

const tinyWarningContent = `${warningFunction}

module.exports = warning;
`;

fs.writeFileSync(path.join(tinyWarningPath, 'index.js'), tinyWarningContent);
console.log('Created tiny-warning/index.js replacement');

// Create a warning module replacement
const warningPath = path.join(nodeModulesPath, 'warning');
if (!fs.existsSync(warningPath)) {
  fs.mkdirSync(warningPath, { recursive: true });
}

fs.writeFileSync(path.join(warningPath, 'index.js'), tinyWarningContent);
console.log('Created warning/index.js replacement');

// We'll avoid directly patching router files since it breaks webpack
// Instead, we'll focus on providing compatible tiny-warning/warning modules
console.log('Patch complete!'); 
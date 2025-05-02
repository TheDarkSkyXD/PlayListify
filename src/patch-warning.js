const fs = require('fs');
const path = require('path');

console.log('Applying TanStack Router warning patch...');

// Function to create a warning function with both ESM and CommonJS exports
const createWarningFunction = `
/**
 * Simple warning function
 */
function warning(condition, message) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
  return undefined;
}

// Export for CommonJS
if (typeof module !== 'undefined') {
  module.exports = warning;
  module.exports.default = warning;
}

// Export for ESM
export default warning;
`;

// Path to the node_modules directory
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// Create a tiny-warning directory if it doesn't exist
const tinyWarningPath = path.join(nodeModulesPath, 'tiny-warning');
if (!fs.existsSync(tinyWarningPath)) {
  fs.mkdirSync(tinyWarningPath, { recursive: true });
}

// Create both CommonJS and ESM files
fs.writeFileSync(path.join(tinyWarningPath, 'index.js'), createWarningFunction);

// Create an index.mjs file for ESM imports
fs.writeFileSync(path.join(tinyWarningPath, 'index.mjs'), createWarningFunction);

// Create a package.json to specify module type
const packageJson = {
  "name": "tiny-warning",
  "version": "1.0.0",
  "description": "A tiny warning function",
  "main": "index.js",
  "module": "index.mjs",
  "exports": {
    ".": {
      "import": "./index.mjs",
      "require": "./index.js"
    }
  }
};

fs.writeFileSync(
  path.join(tinyWarningPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Warning patch applied successfully!'); 
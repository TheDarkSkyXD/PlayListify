const fs = require('fs');
const path = require('path');

// Function to create a warning function
const createWarningFunction = `
// Simple warning function
function warning(condition, message) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
}

module.exports = warning;
`;

// Path to the node_modules directory
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// Create a modified tiny-warning/index.js file
const tinyWarningPath = path.join(nodeModulesPath, 'tiny-warning');
if (!fs.existsSync(tinyWarningPath)) {
  fs.mkdirSync(tinyWarningPath, { recursive: true });
}
fs.writeFileSync(path.join(tinyWarningPath, 'index.js'), createWarningFunction);

// Function to search for files containing "warning is not a function" error
function findAndPatchFiles(directoryPath, pattern) {
  if (!fs.existsSync(directoryPath)) return;
  
  const files = fs.readdirSync(directoryPath);
  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      findAndPatchFiles(filePath, pattern);
    } else if (stats.isFile() && file.endsWith('.js') || file.endsWith('.cjs')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Look for warning usage in the file
        if (content.includes('require("tiny-warning")') || content.includes("require('tiny-warning')")) {
          console.log(`Patching file: ${filePath}`);
          
          // Fix the warning import
          content = content.replace(/var warning\s*=\s*require\(['"]tiny-warning['"]\);?/g, 
            'var warning = function(condition, message) { if (!condition && process.env.NODE_ENV !== "production") { console.warn("Warning:", message); } };');
          
          // Write the patched file
          fs.writeFileSync(filePath, content);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
      }
    }
  }
}

// Look for TanStack router files to patch
const routerPath = path.join(nodeModulesPath, '@tanstack', 'react-router');
if (fs.existsSync(routerPath)) {
  console.log('Searching for @tanstack/react-router files to patch...');
  findAndPatchFiles(routerPath, 'tiny-warning');
}

console.log('Warning patch applied successfully!'); 
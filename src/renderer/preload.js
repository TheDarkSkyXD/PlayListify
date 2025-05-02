// This script is loaded before anything else
import './utils/monkeyPatch';

// Now export the warning function so it's available for other modules
export { default as warning } from './utils/monkeyPatch';

// This script runs before the renderer process
// It ensures the warning function is available globally

// Define a warning function that can be used by TanStack Router
window.warning = function(condition, message) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
  return undefined;
};

// Also add it as a property TanStack Router specifically looks for
window.__TanStackRouterWarning = window.warning;

// Also patch the global require function if it exists
const originalRequire = window.require;
if (originalRequire) {
  window.require = function(path) {
    if (path === 'tiny-warning' || path === 'warning') {
      return window.warning;
    }
    return originalRequire(path);
  };
} 
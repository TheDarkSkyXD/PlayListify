/**
 * This module provides a runtime fix for the "warning is not a function" error in TanStack Router.
 * It must be imported as early as possible in the application's entry point.
 */

// Define our own warning implementation
const warningFn = (condition, message) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn('Warning:', message);
    }
  }
  return undefined;
};

// Patch the global scope
if (typeof window !== 'undefined') {
  // Make the warning function available globally
  window.warning = warningFn;
  window.__TanStackRouterWarning = warningFn;
  
  // Patch require function if it exists
  if (window.require) {
    const originalRequire = window.require;
    window.require = function(name) {
      if (name === 'tiny-warning' || name === 'warning') {
        return warningFn;
      }
      return originalRequire.apply(this, arguments);
    };
  }
}

// Export warning function for other modules
export { warningFn as warning };
export default warningFn; 
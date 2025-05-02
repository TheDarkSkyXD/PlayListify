// This file needs to be imported as early as possible
// It monkey patches the module system to handle the warning function issue

// Simple warning function
function warningFn(condition, message) {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      try {
        console.warn('Warning:', message);
      } catch (e) {
        // In case console.warn throws
      }
    }
  }
  return undefined;
}

// Make warning available globally
if (typeof window !== 'undefined') {
  window.warning = warningFn;
  window.__TanStackRouterWarning = warningFn;

  // Intercept require calls for router packages
  const originalRequire = window.require;
  if (originalRequire) {
    window.require = function(path) {
      // Handle both tiny-warning and any TanStack router warnings
      if (path === 'tiny-warning' || path === 'warning' || path.includes('@tanstack/react-router')) {
        return warningFn;
      }
      return originalRequire.apply(this, arguments);
    };
  }
}

// Export the warning function
export default warningFn; 
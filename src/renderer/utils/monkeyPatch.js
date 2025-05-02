// This file needs to be imported as early as possible
// It monkey patches the module system to handle the warning function issue

// Simple warning function that behaves like tiny-warning
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
}

// Make warning available globally
if (typeof window !== 'undefined') {
  window.warning = warningFn;

  // Intercept require calls for tiny-warning
  const originalRequire = window.require;
  if (originalRequire) {
    window.require = function(path) {
      if (path === 'tiny-warning') {
        return warningFn;
      }
      return originalRequire.apply(this, arguments);
    };
  }
}

// Export the warning function
export default warningFn; 
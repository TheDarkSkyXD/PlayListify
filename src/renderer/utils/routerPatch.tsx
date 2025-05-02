import { useRouter as tanstackUseRouter } from '@tanstack/react-router';
import warning from 'tiny-warning';

// This is a wrapper around the useRouter hook that handles the warning issue
export const useRouter = () => {
  try {
    return tanstackUseRouter();
  } catch (error) {
    // If warning is not a function error occurs, return a null result
    // This will be safely handled by consumer components through null checks
    console.error('Router context error:', error);
    return null;
  }
};

// Apply patch for warning function globally
// This ensures that the warning function is available when needed
if (typeof window !== 'undefined') {
  // @ts-ignore - Add warning to the global scope for modules that try to use it
  window.warning = warning;
} 
import React, { useEffect } from 'react';
import { RouterProvider, Router } from '@tanstack/react-router';
import warning from 'tiny-warning';

interface CustomRouterProviderProps {
  router: Router<any>;
}

// Extend Window interface to include the warning property
declare global {
  interface Window {
    warning?: typeof warning;
  }
}

// This component wraps the TanStack Router's RouterProvider and handles warning issues
export const CustomRouterProvider: React.FC<CustomRouterProviderProps> = ({ router }) => {
  // Apply the warning patch on component mount
  useEffect(() => {
    // Make sure warning function is globally available 
    if (typeof window !== 'undefined' && !window.warning) {
      window.warning = warning;
    }
  }, []);

  return (
    <RouterProvider router={router} />
  );
}; 
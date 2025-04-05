import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/routes';
import { Toaster } from './components/ui/use-toast';
import { ImportProgressBar } from './components/ImportProgress/ImportProgressBar';
import { STORAGE_KEYS } from '../shared/constants/appConstants';
import { queryClient } from './services/queryClientProvider';

import { initConsoleCapture } from './utils/consoleCapture';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme as 'light' | 'dark';
    }
    // Default to dark if not set, based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to apply dark/light mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for settings changes from other parts of the app
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.THEME && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue as 'light' | 'dark');
        }
      }
    };

    // Listen for custom theme change event (for same-tab updates)
    const handleThemeChange = (e: CustomEvent) => {
      if (e.detail === 'light' || e.detail === 'dark') {
        setTheme(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  // Fix for dragEvent not defined error
  useEffect(() => {
    // Define dragEvent globally to prevent the error
    if (typeof window !== 'undefined') {
      // Create a global dragEvent variable if it doesn't exist
      if (!(window as any).dragEvent) {
        (window as any).dragEvent = null;
      }

      // Define a global function to access dragEvent
      // This helps prevent "dragEvent is not defined" errors
      if (!(window as any).getDragEvent) {
        (window as any).getDragEvent = () => (window as any).dragEvent;
      }
    }

    // Add global drag event handlers
    const handleDragStart = (e: DragEvent) => {
      (window as any).dragEvent = e;
    };

    const handleDragEnd = () => {
      (window as any).dragEvent = null;
    };

    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drag', (e) => {
      (window as any).dragEvent = e;
    });

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drag', (e) => {
        (window as any).dragEvent = e;
      });
    };
  }, []);

  // Initialize console capture
  useEffect(() => {
    initConsoleCapture();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Router for main app routes */}
      <RouterProvider router={router} />

      {/* Background import progress indicator */}
      <ImportProgressBar />

      {/* Toast notifications */}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
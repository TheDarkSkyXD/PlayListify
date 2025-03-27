import React, { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/routes';
import { Toaster } from './components/ui/use-toast';
import { ImportProgress } from './components/ImportProgress';
import { STORAGE_KEYS } from '../shared/constants/appConstants';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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

  return (
    <QueryClientProvider client={queryClient}>
      {/* Router for main app routes */}
      <RouterProvider router={router} />
      
      {/* Background import progress indicator */}
      <ImportProgress />
      
      {/* Toast notifications */}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App; 
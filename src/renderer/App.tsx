import React, { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/routes';
import { Toaster } from './components/ui/use-toast';
import { ImportProgress } from './components/ImportProgress';

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
  const [isDarkMode, setIsDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Add or remove dark mode class from document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Using direct property assignment with destructuring to avoid parameter typing issues
    const originalOnChange = mediaQuery.onchange;
    mediaQuery.onchange = function handleThemeChange({ matches }) {
      setIsDarkMode(matches);
    };
    
    // Cleanup function to restore original handler
    return () => {
      mediaQuery.onchange = originalOnChange;
    };
  }, [isDarkMode]);

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
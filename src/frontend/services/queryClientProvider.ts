import { QueryClient } from '@tanstack/react-query';

// Create a singleton QueryClient instance to be used throughout the application
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

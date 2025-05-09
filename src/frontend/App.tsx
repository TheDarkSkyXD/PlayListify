import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router'; // Import the router instance

// Placeholder styles
const appStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  fontFamily: 'sans-serif',
  textAlign: 'center'
};

const headingStyle: React.CSSProperties = {
  fontSize: '2rem',
  color: '#333'
};

function App() {
  // Check localStorage for theme, default to system preference, then light
  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <RouterProvider router={router} />
  );
}

export default App; 
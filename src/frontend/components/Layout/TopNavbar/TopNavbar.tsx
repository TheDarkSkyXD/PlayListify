import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { UserCircle2, Moon, Sun } from 'lucide-react'; // Import Moon and Sun icons

export function TopNavbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Effect to initialize theme based on localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    setIsDarkMode(initialDarkMode);
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 bg-surface dark:bg-yt-almost-black text-onSurface dark:text-yt-text-primary-dark p-4 flex items-center justify-between border-b border-borderCustom dark:border-yt-dark-gray">
      <div>
        <Link to="/" className="text-2xl font-bold text-primary dark:text-yt-red">
          Playlistify
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-secondary dark:hover:bg-yt-dark-gray focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-yt-red"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-onSurface dark:text-yt-text-secondary-dark" />
          )}
        </button>

        {/* User Avatar/Profile Link */}
        <button 
          className="p-2 rounded-full hover:bg-secondary dark:hover:bg-yt-dark-gray focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-yt-red"
          aria-label="User Profile"
        >
          <UserCircle2 className="w-7 h-7 text-onSurface dark:text-yt-text-secondary-dark" />
        </button>
      </div>
    </header>
  );
} 
import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { Home, Settings, Library, Sun, Moon, Download, History } from 'lucide-react';
import { SidebarNav } from '../common/SidebarNav';
import { cn } from '../../utils/classNames';
import { STORAGE_KEYS } from '../../../shared/constants/appConstants';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme as 'light' | 'dark';
    }
    // Default to dark if not set, based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Update theme when it changes
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove the old theme class and add the new one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Save the theme to localStorage
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    {
      title: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: 'Playlists',
      href: '/playlists',
      icon: <Library className="h-5 w-5" />,
    },
    {
      title: 'Downloads',
      href: '/downloads',
      icon: <Download className="h-5 w-5" />,
    },
    {
      title: 'History',
      href: '/history',
      icon: <History className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex h-screen w-[240px] flex-col border-r bg-card dark:bg-[#0F0F0F]">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold text-foreground dark:text-white">PlayListify</span>
          </Link>
        </div>
        <SidebarNav items={navItems} />
        <div className="mt-auto p-4">
          <Button
            variant="outline"
            size="icon"
            className="ml-auto h-8 w-8 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex flex-col flex-1 overflow-hidden bg-background dark:bg-[#0F0F0F]")}>
        {children}
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Home, Settings, Youtube, Library, Sun, Moon, Download, History, Clock } from 'lucide-react';
import SidebarNav from './SidebarNav';
import { cn } from '../lib/utils';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // If system preference or not set, determine based on user preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    // Dispatch a custom event to notify App.tsx
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  // Apply theme when component mounts or theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="mr-2 h-5 w-5 text-[#0F0F0F] dark:text-white" />
    },
    {
      title: "My Playlists",
      href: "/playlists",
      icon: <Library className="mr-2 h-5 w-5 text-[#0F0F0F] dark:text-white" />
    },
    {
      title: "Downloads",
      href: "/downloads",
      icon: <Download className="mr-2 h-5 w-5 text-[#0F0F0F] dark:text-white" />
    },
    {
      title: "History",
      href: "/history",
      icon: <History className="mr-2 h-5 w-5 text-[#0F0F0F] dark:text-white" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 h-5 w-5 text-[#0F0F0F] dark:text-white" />
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col w-64 border-r px-4 py-8",
        "bg-card dark:bg-[#0F0F0F]"
      )}>
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center">
            <Youtube className="h-8 w-8 text-[#FF0000] mr-2" />
            <h1 className="text-xl font-bold">PlayListify</h1>
          </div>
          
          {/* Theme toggle icon button */}
          <Button 
            onClick={toggleTheme}
            variant="ghost" 
            size="icon"
            className="h-9 w-9 rounded-full"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-[#FF0000] !important" />
            ) : (
              <Sun className="h-5 w-5 text-[#FF0000] !important" />
            )}
          </Button>
        </div>
        
        <SidebarNav items={navItems} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 
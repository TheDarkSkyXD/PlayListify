import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Search, Settings, Home, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navigation: React.FC = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navigationItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: Home,
      exact: true,
    },
    {
      to: '/playlists',
      label: 'Playlists',
      icon: List,
      exact: false,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      exact: true,
    },
  ];

  const isActiveRoute = (to: string, exact: boolean) => {
    if (exact) {
      return currentPath === to;
    }
    return currentPath.startsWith(to);
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PlayListify</h1>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.to, item.exact);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search playlists..." 
                className="pl-10 w-64"
              />
            </div>
            
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center space-x-1 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.to, item.exact);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
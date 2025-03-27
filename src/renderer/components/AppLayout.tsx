import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Home, Settings, Youtube, Library, PlusCircle } from 'lucide-react';
import SidebarNav from './SidebarNav';
import { cn } from '../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="mr-2 h-5 w-5 text-[#FF0000]" />
    },
    {
      title: "Playlists",
      href: "/playlists",
      icon: <Library className="mr-2 h-5 w-5 text-[#FF0000]" />
    },
    {
      title: "Import",
      href: "/import",
      icon: <Youtube className="mr-2 h-5 w-5 text-[#FF0000]" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 h-5 w-5 text-[#FF0000]" />
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col w-64 border-r px-4 py-8",
        "bg-card dark:bg-[#0F0F0F]"
      )}>
        <div className="flex items-center px-2 mb-8">
          <Youtube className="h-8 w-8 text-[#FF0000] mr-2" />
          <h1 className="text-xl font-bold">PlayListify</h1>
        </div>
        
        <SidebarNav items={navItems} />
        
        <div className="mt-auto pt-4 border-t">
          <Button 
            asChild 
            className="w-full justify-start" 
            variant="outline"
          >
            <Link to="/">
              <PlusCircle className="mr-2 h-5 w-5 text-[#FF0000]" />
              New Playlist
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 
import React from 'react';
import { Link, useMatchRoute, useRouterState } from '@tanstack/react-router';
import { Home, ListVideo, Download, History, Settings } from 'lucide-react'; // Using lucide-react for icons

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/playlists', label: 'My Playlists', icon: ListVideo },
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidenavbar() {

  return (
    <nav className="w-64 h-screen bg-surface dark:bg-yt-almost-black text-onSurface dark:text-yt-text-primary-dark p-4 flex flex-col border-r border-borderCustom dark:border-yt-dark-gray">
      {/* Logo/App Name - Can be moved to TopNavbar if preferred */}
      {/* <div className="mb-10">
        <Link to="/" className="text-2xl font-bold text-primary dark:text-yt-red">
          Playlistify
        </Link>
      </div> */}
      
      <ul className="space-y-2 flex-grow">
        {navItems.map((item) => {
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className="flex items-center p-2 rounded-md hover:bg-secondary dark:hover:bg-yt-dark-gray transition-colors"
                activeProps={{
                  className: 'bg-primary text-primary-foreground dark:bg-yt-red dark:text-yt-text-primary-dark font-semibold',
                }}
                inactiveProps={{
                  className: 'text-onSurface dark:text-yt-text-secondary-dark hover:text-primary dark:hover:text-yt-red',
                }}
                {...(item.to === '/' && { activeOptions: { exact: true } })}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* User Profile / Settings Link can also go here at the bottom */}
    </nav>
  );
} 
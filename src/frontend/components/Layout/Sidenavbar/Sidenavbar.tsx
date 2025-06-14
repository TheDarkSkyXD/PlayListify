import React from 'react';
import { Link } from '@tanstack/react-router';
// import { Home, ListMusic, Download, History, Settings } from 'lucide-react'; // Example icons

const Sidenavbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard' /*, icon: Home*/ },
    { to: '/my-playlists', label: 'My Playlists' /*, icon: ListMusic*/ }, // Updated path
    { to: '/downloads', label: 'Downloads' /*, icon: Download*/ }, // Added Downloads
    { to: '/history', label: 'History' /*, icon: History*/ }, // Added History
    { to: '/settings', label: 'Settings' /*, icon: Settings*/ },
  ];

  return (
    <div className="w-64 bg-secondary p-4 border-r border-border flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary">PlayListify</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center space-x-2 p-2 rounded-md text-foreground hover:bg-light-background-tertiary dark:hover:bg-dark-background-tertiary active:bg-neutral-300 dark:active:bg-neutral-800"
            activeProps={{ className: 'bg-primary text-primary-foreground font-semibold' }}
          >
            {/* <item.icon className="h-5 w-5" /> */}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidenavbar;
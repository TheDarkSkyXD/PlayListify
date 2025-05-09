import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidenavbar } from './Sidenavbar/Sidenavbar';
import { TopNavbar } from './TopNavbar/TopNavbar';

export function AppLayout() {
  // Theme handling useEffect is removed from here, handled in TopNavbar now.

  return (
    <div className="flex h-screen bg-background text-foreground border-4 border-test">
      <Sidenavbar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 bg-secondary dark:bg-secondary-dark">
          {/* Content from child routes will render here */}
          <Outlet />
        </main>
        {/* Removed the placeholder theme toggle button from here */}
      </div>
    </div>
  );
} 
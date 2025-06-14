// src/frontend/components/layout/MainLayout.tsx
import React from 'react';
import TopNavbar from './TopNavbar/TopNavbar';
import Sidenavbar from './Sidenavbar/Sidenavbar';
import ActivityCenter from '../tasks/ActivityCenter'; // Added import
import { Outlet } from '@tanstack/react-router';

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidenavbar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ActivityCenter /> {/* Added ActivityCenter component */}
    </div>
  );
};

export default MainLayout;
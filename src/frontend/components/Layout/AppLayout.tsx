import React from 'react';
import { Outlet } from '@tanstack/react-router';
import Sidenavbar from './Sidenavbar/Sidenavbar';
import TopNavbar from './TopNavbar/TopNavbar';
import { Card, CardContent } from '@/frontend/components/ui/card';

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidenavbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <Outlet />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
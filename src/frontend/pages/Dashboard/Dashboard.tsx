// src/frontend/pages/Dashboard/Dashboard.tsx
import React from 'react';
import RecentPlaylistsWidget from '@/frontend/components/dashboard/RecentPlaylistsWidget';
import ContinueWatchingWidget from '@/frontend/components/dashboard/ContinueWatchingWidget';

const DashboardPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4"> {/* Or adjust col-span as needed */}
          <RecentPlaylistsWidget />
        </div>
        <div className="col-span-3"> {/* Or adjust col-span as needed */}
          <ContinueWatchingWidget />
        </div>
      </div>
      {/* Future sections/widgets can be added here */}
    </div>
  );
};

export default DashboardPage;
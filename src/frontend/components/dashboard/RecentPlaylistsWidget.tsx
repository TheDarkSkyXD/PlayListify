// src/frontend/components/dashboard/RecentPlaylistsWidget.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button'; // Assuming Button can be styled as a link or use an actual link component

const RecentPlaylistsWidget = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Playlists</CardTitle>
        <Button variant="link" size="sm" asChild>
          <a href="#">View all</a>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your recent playlists will appear here.
        </p>
        {/* Placeholder for actual playlist items later */}
      </CardContent>
    </Card>
  );
};

export default RecentPlaylistsWidget;
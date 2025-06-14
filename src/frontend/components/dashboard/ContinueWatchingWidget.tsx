// src/frontend/components/dashboard/ContinueWatchingWidget.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';

const ContinueWatchingWidget = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Continue Watching</CardTitle>
        <Button variant="link" size="sm" asChild>
          <a href="#">View history</a>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your viewing history will appear here.
        </p>
        {/* Placeholder for actual history items later */}
      </CardContent>
    </Card>
  );
};

export default ContinueWatchingWidget;
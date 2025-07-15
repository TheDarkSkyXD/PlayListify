import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">404</span>
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Looking for something specific?
            </p>
            <div className="space-y-2">
              <Link to="/playlists">
                <Button variant="ghost" size="sm" className="w-full">
                  View Playlists
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="w-full">
                  Open Settings
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
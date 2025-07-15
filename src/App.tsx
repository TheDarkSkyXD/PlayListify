import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music, Search, Settings, Plus } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PlayListify</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search playlists..." 
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Your Playlists</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {/* Playlist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Sample Playlist Cards */}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-full h-32 bg-muted rounded-md mb-4 flex items-center justify-center">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Playlist {i}</CardTitle>
                  <CardDescription>
                    Sample playlist description with some details about the content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>12 videos</span>
                    <span>2 hours</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Welcome Message for Empty State */}
        <div className="text-center py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to PlayListify!</CardTitle>
              <CardDescription>
                Start by creating your first playlist or importing videos from YouTube.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
              <Button variant="outline" className="w-full">
                Import from YouTube
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
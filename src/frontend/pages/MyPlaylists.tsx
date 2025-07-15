import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music, Plus, Search, Filter, Grid, List as ListIcon } from 'lucide-react';

export const Playlists: React.FC = () => {
  // Mock data for demonstration
  const playlists = [
    {
      id: 1,
      name: 'Coding Music',
      description: 'Focus music for programming sessions',
      videos: 25,
      duration: '2h 15m',
      thumbnail: null,
      lastUpdated: '2 hours ago',
      isDownloaded: true,
    },
    {
      id: 2,
      name: 'Workout Hits',
      description: 'High-energy music for workouts',
      videos: 18,
      duration: '1h 32m',
      thumbnail: null,
      lastUpdated: '1 day ago',
      isDownloaded: false,
    },
    {
      id: 3,
      name: 'Study Focus',
      description: 'Ambient and instrumental music for studying',
      videos: 12,
      duration: '45m',
      thumbnail: null,
      lastUpdated: '3 days ago',
      isDownloaded: true,
    },
    {
      id: 4,
      name: 'Chill Vibes',
      description: 'Relaxing music for downtime',
      videos: 30,
      duration: '3h 20m',
      thumbnail: null,
      lastUpdated: '1 week ago',
      isDownloaded: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlists</h1>
          <p className="text-muted-foreground mt-2">
            Manage your YouTube playlists and downloads
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search playlists..." 
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-full h-32 bg-muted rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
                <Music className="h-8 w-8 text-muted-foreground" />
                {playlist.isDownloaded && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {playlist.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {playlist.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{playlist.videos} videos</span>
                  <span>{playlist.duration}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Updated {playlist.lastUpdated}</span>
                  {playlist.isDownloaded ? (
                    <span className="text-green-600 font-medium">Downloaded</span>
                  ) : (
                    <span className="text-orange-600 font-medium">Online</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (when no playlists) */}
      {playlists.length === 0 && (
        <div className="text-center py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Music className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No playlists yet</CardTitle>
              <CardDescription>
                Start by creating your first playlist or importing from YouTube.
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
      )}

      {/* Pagination (for future implementation) */}
      {playlists.length > 0 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
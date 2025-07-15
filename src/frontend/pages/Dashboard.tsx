import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Plus, TrendingUp, Clock, Download } from 'lucide-react';
import { SimpleDataFetchingTest } from '../components/examples/SimpleDataFetchingTest';

export const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Playlists',
      value: '12',
      description: 'Active playlists',
      icon: Music,
      trend: '+2 this week',
    },
    {
      title: 'Total Videos',
      value: '248',
      description: 'Videos managed',
      icon: TrendingUp,
      trend: '+15 this week',
    },
    {
      title: 'Watch Time',
      value: '42h',
      description: 'Total duration',
      icon: Clock,
      trend: '+3h this week',
    },
    {
      title: 'Downloads',
      value: '156',
      description: 'Videos downloaded',
      icon: Download,
      trend: '+8 this week',
    },
  ];

  const recentPlaylists = [
    { id: 1, name: 'Coding Music', videos: 25, duration: '2h 15m', lastUpdated: '2 hours ago' },
    { id: 2, name: 'Workout Hits', videos: 18, duration: '1h 32m', lastUpdated: '1 day ago' },
    { id: 3, name: 'Study Focus', videos: 12, duration: '45m', lastUpdated: '3 days ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your playlists today.
          </p>
        </div>
        <Link to="/playlists">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Playlists */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Playlists</CardTitle>
            <CardDescription>Your most recently updated playlists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPlaylists.map((playlist) => (
              <div key={playlist.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.videos} videos • {playlist.duration}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{playlist.lastUpdated}</p>
                </div>
              </div>
            ))}
            <Link to="/playlists">
              <Button variant="outline" className="w-full">
                View All Playlists
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/playlists">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Playlist
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Import from YouTube
            </Button>
            <Link to="/settings">
              <Button variant="outline" className="w-full justify-start">
                <Music className="h-4 w-4 mr-2" />
                Manage Downloads
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Data Fetching and State Management Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Data Fetching & State Management Demo</h2>
        <SimpleDataFetchingTest />
      </div>
    </div>
  );
};
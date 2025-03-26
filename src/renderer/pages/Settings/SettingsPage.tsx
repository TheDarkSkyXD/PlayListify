import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Save, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-60" />
        <div className="flex">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10 ml-2" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <Skeleton className="h-10 w-24 mt-6" />
    </div>
  );
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Mock settings
  const [settings, setSettings] = useState({
    downloadLocation: 'C:\\Users\\User\\Videos\\PlayListify',
    ytDlpPath: '',
    ffmpegPath: '',
    maxConcurrentDownloads: '2',
    defaultVideoQuality: '1080p'
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };
  
  const handleSelectFolder = (setting: string) => {
    // In a real app, this would use the Electron dialog API
    console.log(`Select folder for ${setting}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-36 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-lg mb-6" />
          
          <Skeleton className="h-10 w-full max-w-md mb-6" />
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <SettingsFormSkeleton />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
        
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mb-6">
          Configure application settings and preferences
        </p>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <form onSubmit={handleSubmit}>
                {saveSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Settings saved successfully
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="darkMode">Theme</Label>
                    <select 
                      id="theme"
                      name="theme" 
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md"
                    >
                      <option value="system">System Default</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="downloadLocation">Download Location</Label>
                    <div className="flex mt-1">
                      <Input 
                        id="downloadLocation"
                        name="downloadLocation"
                        value={settings.downloadLocation}
                        onChange={handleChange}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => handleSelectFolder('downloadLocation')}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label htmlFor="maxConcurrentDownloads">Max Concurrent Downloads</Label>
                    <Input 
                      id="maxConcurrentDownloads"
                      name="maxConcurrentDownloads"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxConcurrentDownloads}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="defaultVideoQuality">Default Video Quality</Label>
                    <select 
                      id="defaultVideoQuality"
                      name="defaultVideoQuality" 
                      value={settings.defaultVideoQuality}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md"
                    >
                      <option value="best">Best</option>
                      <option value="2160p">4K (2160p)</option>
                      <option value="1440p">QHD (1440p)</option>
                      <option value="1080p">Full HD (1080p)</option>
                      <option value="720p">HD (720p)</option>
                      <option value="480p">SD (480p)</option>
                      <option value="360p">LD (360p)</option>
                    </select>
                  </div>
                  
                  <Button type="submit" disabled={isSaving} className="mt-4">
                    {isSaving ? 
                      <span className="flex items-center">
                        <Skeleton className="h-4 w-4 rounded-full mr-2 animate-spin" />
                        Saving...
                      </span> : 
                      <span className="flex items-center">
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </span>
                    }
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="downloads">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <p className="text-muted-foreground">Download settings content</p>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="ytDlpPath">yt-dlp Path (optional)</Label>
                    <div className="flex mt-1">
                      <Input 
                        id="ytDlpPath"
                        name="ytDlpPath"
                        value={settings.ytDlpPath}
                        onChange={handleChange}
                        className="flex-1"
                        placeholder="Leave empty to use bundled version"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => handleSelectFolder('ytDlpPath')}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="ffmpegPath">FFmpeg Path (optional)</Label>
                    <div className="flex mt-1">
                      <Input 
                        id="ffmpegPath"
                        name="ffmpegPath"
                        value={settings.ffmpegPath}
                        onChange={handleChange}
                        className="flex-1"
                        placeholder="Leave empty to use bundled version"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => handleSelectFolder('ffmpegPath')}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                    <div>
                      <p className="font-medium">Advanced settings</p>
                      <p className="text-sm">Only change these settings if you know what you're doing.</p>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isSaving}>
                    Save Advanced Settings
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="about">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">About PlayListify</h2>
              <p className="mb-2">Version: 1.0.0</p>
              <p className="mb-4">A desktop application for managing and downloading YouTube playlists.</p>
              
              <h3 className="text-lg font-medium mt-6 mb-2">Dependencies</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>yt-dlp: 2023.12.30</li>
                <li>FFmpeg: 6.0</li>
                <li>Electron: 28.0.0</li>
                <li>React: 18.2.0</li>
              </ul>
              
              <div className="mt-6">
                <Button variant="outline" size="sm">
                  Check for Updates
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
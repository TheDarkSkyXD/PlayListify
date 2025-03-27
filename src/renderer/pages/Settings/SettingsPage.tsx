import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { ArrowLeft, Save, FolderOpen, AlertCircle, CheckCircle, Home, Settings, Youtube, Library, PlusCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { AppSettings } from '../../../shared/types/appTypes';
import SidebarNav from '../../components/SidebarNav';
import AppLayout from '../../components/AppLayout';
import { STORAGE_KEYS } from '../../../shared/constants/appConstants';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real settings from the API
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    downloadLocation: '',
    ytDlpPath: '',
    ffmpegPath: '',
    concurrentDownloads: 2,
    maxQuality: '1080p',
    theme: 'system'
  });
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.api && window.api.settings) {
          const appSettings = await window.api.settings.getAll();
          setSettings(appSettings);
          setError(null);
        } else {
          setError('Settings API not available');
        }
      } catch (err) {
        setError('Failed to load settings');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert number values
    const numericFields = ['concurrentDownloads'];
    const parsedValue = numericFields.includes(name) ? parseInt(value, 10) : value;
    
    setSettings({
      ...settings,
      [name]: parsedValue
    });

    // If theme is changed, also update it in localStorage
    if (name === 'theme' && ['light', 'dark', 'system'].includes(value)) {
      localStorage.setItem(STORAGE_KEYS.THEME, value);
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('themeChange', { detail: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      if (window.api && window.api.settings) {
        // Save each setting individually
        for (const [key, value] of Object.entries(settings)) {
          await window.api.settings.set(key as keyof AppSettings, value as any);
        }
        
        // Save theme to localStorage to ensure it's immediately available for the UI
        if (settings.theme) {
          localStorage.setItem(STORAGE_KEYS.THEME, settings.theme);
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new CustomEvent('themeChange', { detail: settings.theme }));
        }
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Settings API not available');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSelectFolder = async (setting: string) => {
    try {
      if (window.api && window.api.fs) {
        const selectedPath = await window.api.fs.selectDirectory();
        if (selectedPath) {
          setSettings({
            ...settings,
            [setting]: selectedPath
          });
        }
      }
    } catch (err) {
      console.error(`Error selecting folder for ${setting}:`, err);
    }
  };
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="mr-2 h-5 w-5" />
    },
    {
      title: "Playlists",
      href: "/playlists",
      icon: <Library className="mr-2 h-5 w-5" />
    },
    {
      title: "Import",
      href: "/import",
      icon: <Youtube className="mr-2 h-5 w-5" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 h-5 w-5" />
    }
  ];
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-8">
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
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <div className="mb-6">
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
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                      {error}
                    </div>
                  )}
                  
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-md flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      Settings saved successfully
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="downloadLocation">Download Location</Label>
                      <div className="flex mt-1">
                        <Input 
                          id="downloadLocation"
                          name="downloadLocation"
                          value={settings.downloadLocation || ''}
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
                      <Label htmlFor="concurrentDownloads">Max Concurrent Downloads</Label>
                      <Input 
                        id="concurrentDownloads"
                        name="concurrentDownloads"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.concurrentDownloads || 2}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxQuality">Default Video Quality</Label>
                      <select 
                        id="maxQuality"
                        name="maxQuality" 
                        value={settings.maxQuality || '1080p'}
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
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
                <p className="text-muted-foreground">Download settings content</p>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced">
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="ffmpegPath">FFmpeg Path (optional)</Label>
                      <div className="flex mt-1">
                        <Input 
                          id="ffmpegPath"
                          name="ffmpegPath"
                          value={settings.ffmpegPath || ''}
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
                    
                    <div>
                      <Label htmlFor="ytDlpPath">yt-dlp Path (optional)</Label>
                      <div className="flex mt-1">
                        <Input 
                          id="ytDlpPath"
                          name="ytDlpPath"
                          value={settings.ytDlpPath || ''}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Only set this if you want to use your own yt-dlp binary.
                      </p>
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
            
            <TabsContent value="about">
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">About PlayListify</h2>
                <p className="text-muted-foreground mb-4">
                  PlayListify is a YouTube playlist downloader and manager.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Version</span>
                    <span className="text-muted-foreground">1.0.0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Electron</span>
                    <span className="text-muted-foreground">v26.0.0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">yt-dlp</span>
                    <span className="text-muted-foreground">2023.03.04</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
} 
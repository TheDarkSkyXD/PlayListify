import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Settings as SettingsIcon, Folder, Download, Palette, Bell, Shield, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const settingsSections = [
    {
      title: 'General',
      description: 'Basic application settings',
      icon: SettingsIcon,
      settings: [
        { label: 'Application Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
        { label: 'Language', type: 'select', options: ['English', 'Spanish', 'French'] },
        { label: 'Start Minimized', type: 'toggle' },
        { label: 'Close to System Tray', type: 'toggle' },
      ],
    },
    {
      title: 'Downloads',
      description: 'Configure download behavior and locations',
      icon: Download,
      settings: [
        { label: 'Download Location', type: 'folder', value: '/Users/username/Downloads/Playlistify' },
        { label: 'Video Quality', type: 'select', options: ['Best', 'High (1080p)', 'Medium (720p)', 'Low (480p)'] },
        { label: 'Audio Format', type: 'select', options: ['MP3', 'AAC', 'FLAC', 'Original'] },
        { label: 'Concurrent Downloads', type: 'number', value: '3' },
        { label: 'Auto-download New Videos', type: 'toggle' },
      ],
    },
    {
      title: 'Storage',
      description: 'Manage storage and file organization',
      icon: Folder,
      settings: [
        { label: 'Organize by Playlist', type: 'toggle' },
        { label: 'Create Date Folders', type: 'toggle' },
        { label: 'Clean Temp Files on Exit', type: 'toggle' },
        { label: 'Maximum Cache Size (GB)', type: 'number', value: '5' },
      ],
    },
    {
      title: 'Notifications',
      description: 'Control when and how you receive notifications',
      icon: Bell,
      settings: [
        { label: 'Download Complete Notifications', type: 'toggle' },
        { label: 'Playlist Update Notifications', type: 'toggle' },
        { label: 'Error Notifications', type: 'toggle' },
        { label: 'System Tray Notifications', type: 'toggle' },
      ],
    },
    {
      title: 'Privacy & Security',
      description: 'Privacy settings and security options',
      icon: Shield,
      settings: [
        { label: 'Save YouTube Cookies', type: 'toggle' },
        { label: 'Clear History on Exit', type: 'toggle' },
        { label: 'Enable Analytics', type: 'toggle' },
        { label: 'Auto-update Dependencies', type: 'toggle' },
      ],
    },
  ];

  const renderSettingInput = (setting: any) => {
    switch (setting.type) {
      case 'select':
        return (
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            {setting.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        );
      case 'folder':
        return (
          <div className="flex space-x-2">
            <Input value={setting.value} readOnly className="flex-1" />
            <Button variant="outline" size="sm">
              <Folder className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'number':
        return <Input type="number" defaultValue={setting.value} className="w-24" />;
      default:
        return <Input defaultValue={setting.value} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your PlayListify experience
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.settings.map((setting, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {setting.label}
                      </label>
                    </div>
                    <div className="w-48">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Settings are automatically saved</span>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Export Settings</Button>
        </div>
      </div>
    </div>
  );
};
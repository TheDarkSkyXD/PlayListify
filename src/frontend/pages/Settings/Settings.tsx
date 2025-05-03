import React, { useEffect, useState } from 'react';
import { useIPC } from '../../hooks/useIPC';
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsType } from '../../../shared/types/appTypes';
import { RotateCw, Save } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { DirectorySelector } from '../../components/Settings/DirectorySelector';

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch all settings
  const { 
    data: settings, 
    loading: isLoading,
    error: fetchError,
    invoke: fetchSettings
  } = useIPC<void, SettingsType>(IPC_CHANNELS.SETTINGS_GET_ALL, true);
  
  // Hook for updating settings
  const {
    loading: isUpdating,
    invoke: updateSetting
  } = useIPC<{ key: string, value: any }, boolean>(IPC_CHANNELS.SETTINGS_SET);
  
  // Hook for resetting settings
  const {
    loading: isResetting,
    invoke: resetSettings
  } = useIPC<void, boolean>(IPC_CHANNELS.SETTINGS_RESET);
  
  // Local state for form values
  const [formValues, setFormValues] = useState<Partial<SettingsType>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // When settings are loaded, initialize form values
  useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);
  
  // Handle input changes
  const handleInputChange = (key: keyof SettingsType, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  // Save all changed settings
  const handleSaveSettings = async () => {
    try {
      // Compare formValues with original settings and only update changed fields
      const changedSettings = Object.entries(formValues)
        .filter(([key, value]) => settings && settings[key as keyof SettingsType] !== value);
      
      if (changedSettings.length === 0) {
        setHasChanges(false);
        return;
      }
      
      // Update each changed setting
      for (const [key, value] of changedSettings) {
        await updateSetting({ key, value });
      }
      
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Settings saved successfully'
      });
      
      setHasChanges(false);
      
      // Refetch settings to ensure UI is up to date
      await fetchSettings();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings'
      });
    }
  };
  
  // Handle settings reset
  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await resetSettings();
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Settings reset to defaults'
        });
        // Refetch settings
        await fetchSettings();
        setHasChanges(false);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to reset settings'
        });
      }
    }
  };
  
  // If there's an error fetching settings
  if (fetchError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900 rounded-lg mb-4 text-red-900 dark:text-red-100">
        <h2 className="text-xl font-bold mb-2">Error Loading Settings</h2>
        <p className="mb-2">{fetchError.message}</p>
        <Button
          onClick={() => fetchSettings()}
          variant="destructive"
          disabled={isLoading}
        >
          <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={isResetting || isLoading}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button
            variant={hasChanges ? "default" : "outline"}
            onClick={handleSaveSettings}
            disabled={!hasChanges || isUpdating || isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Download Path Setting */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-medium mb-4">Download Settings</h2>
            
            <div className="space-y-4">
              <DirectorySelector
                label="Default Download Location"
                value={formValues.downloadPath || ''}
                onChange={(path) => handleInputChange('downloadPath', path)}
                description="Where your downloaded videos will be saved"
                disabled={isLoading || isUpdating}
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Concurrent Downloads
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formValues.maxConcurrentDownloads || 2}
                    onChange={(e) => handleInputChange('maxConcurrentDownloads', parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-3 py-2 bg-background border rounded-md text-sm"
                    disabled={isLoading || isUpdating}
                  />
                  <span className="text-sm text-muted-foreground">
                    (1-10 recommended)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  How many videos can be downloaded at the same time
                </p>
              </div>
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-medium mb-4">Appearance</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Theme
              </label>
              <select
                value={formValues.theme || 'system'}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="px-3 py-2 bg-background border rounded-md text-sm w-full max-w-xs"
                disabled={isLoading || isUpdating}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose your preferred theme
              </p>
            </div>
          </div>
          
          {/* Update Settings */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-medium mb-4">Updates</h2>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoUpdateCheck"
                checked={formValues.autoUpdateCheck || false}
                onChange={(e) => handleInputChange('autoUpdateCheck', e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading || isUpdating}
              />
              <label htmlFor="autoUpdateCheck" className="text-sm font-medium">
                Automatically check for updates
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              When enabled, the app will check for updates when it starts
            </p>
          </div>
          
          {/* Advanced Settings */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-medium mb-4">Advanced Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom yt-dlp Path (Optional)
                </label>
                <input
                  type="text"
                  value={formValues.ytdlpPath || ''}
                  onChange={(e) => handleInputChange('ytdlpPath', e.target.value)}
                  placeholder="Leave empty to use bundled version"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                  disabled={isLoading || isUpdating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Path to custom yt-dlp executable (if you want to use a specific version)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom FFmpeg Path (Optional)
                </label>
                <input
                  type="text"
                  value={formValues.ffmpegPath || ''}
                  onChange={(e) => handleInputChange('ffmpegPath', e.target.value)}
                  placeholder="Leave empty to use bundled version"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                  disabled={isLoading || isUpdating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Path to custom FFmpeg executable (if you want to use a specific version)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
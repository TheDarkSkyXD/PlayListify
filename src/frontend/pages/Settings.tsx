import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserSettings } from '@/shared/types/settings-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Download,
  FileDown,
  Folder,
  Info,
  Loader2,
  Settings as SettingsIcon,
  Upload,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '../components/ui/alert';

interface SettingsFormData extends UserSettings {}

export const Settings: React.FC = () => {
  const [formData, setFormData] = useState<SettingsFormData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [importExportStatus, setImportExportStatus] = useState<
    'idle' | 'importing' | 'exporting'
  >('idle');

  const queryClient = useQueryClient();

  // Fetch current settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<UserSettings> => {
      return await window.electronAPI.settings.getAll();
    },
  });

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: keyof UserSettings;
      value: any;
    }) => {
      await window.electronAPI.settings.set(key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setValidationErrors([error.message || 'Failed to save settings']);
    },
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      await window.electronAPI.settings.reset();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('Settings reset to defaults');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setValidationErrors([error.message || 'Failed to reset settings']);
    },
  });

  // Export settings
  const handleExportSettings = async () => {
    try {
      setImportExportStatus('exporting');
      const exportData = await window.electronAPI.settings.export();

      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playlistify-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage('Settings exported successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setValidationErrors([error.message || 'Failed to export settings']);
    } finally {
      setImportExportStatus('idle');
    }
  };

  // Import settings
  const handleImportSettings = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportExportStatus('importing');
      const text = await file.text();
      const success = await window.electronAPI.settings.import(text);

      if (success) {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        setSuccessMessage('Settings imported successfully');
      } else {
        setValidationErrors([
          'Some settings could not be imported due to validation errors',
        ]);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setValidationErrors([error.message || 'Failed to import settings']);
    } finally {
      setImportExportStatus('idle');
      // Reset file input
      event.target.value = '';
    }
  };

  // Select folder for downloads
  const handleSelectFolder = async () => {
    try {
      const folderPath = await window.electronAPI.fs.selectDirectory();
      if (folderPath && formData) {
        const updatedData = { ...formData, downloadLocation: folderPath };
        setFormData(updatedData);
        updateSettingMutation.mutate({
          key: 'downloadLocation',
          value: folderPath,
        });
      }
    } catch (error: any) {
      setValidationErrors([error.message || 'Failed to select folder']);
    }
  };

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (validationErrors.length > 0) {
      const timer = setTimeout(() => setValidationErrors([]), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [validationErrors]);

  const handleInputChange = (key: keyof UserSettings, value: any) => {
    if (!formData) return;

    const updatedData = { ...formData, [key]: value };
    setFormData(updatedData);

    // Debounced save - save after user stops typing
    clearTimeout((window as any).settingsTimeout);
    (window as any).settingsTimeout = setTimeout(() => {
      updateSettingMutation.mutate({ key, value });
    }, 500);
  };

  const handleToggleChange = (key: keyof UserSettings, checked: boolean) => {
    if (!formData) return;

    const updatedData = { ...formData, [key]: checked };
    setFormData(updatedData);
    updateSettingMutation.mutate({ key, value: checked });
  };

  const handleNumberChange = (key: keyof UserSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      handleInputChange(key, numValue);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className='m-4'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Failed to load settings: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='mt-2 text-muted-foreground'>
          Customize your Playlistify experience
        </p>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <Alert className='border-green-200 bg-green-50'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>
            <ul className='list-inside list-disc'>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <SettingsIcon className='h-5 w-5 text-primary' />
            <CardTitle>General</CardTitle>
          </div>
          <CardDescription>Basic application settings</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Application Theme</label>
            <select
              value={formData.theme}
              onChange={e =>
                handleInputChange(
                  'theme',
                  e.target.value as 'light' | 'dark' | 'system',
                )
              }
              className='flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm'
            >
              <option value='light'>Light</option>
              <option value='dark'>Dark</option>
              <option value='system'>System</option>
            </select>
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Language</label>
            <Input
              value={formData.language}
              onChange={e => handleInputChange('language', e.target.value)}
              className='w-48'
              placeholder='en'
            />
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Start Minimized</label>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                checked={formData.startMinimized}
                onChange={e =>
                  handleToggleChange('startMinimized', e.target.checked)
                }
                className='peer sr-only'
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Close to System Tray</label>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                checked={formData.closeToTray}
                onChange={e =>
                  handleToggleChange('closeToTray', e.target.checked)
                }
                className='peer sr-only'
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Auto Update</label>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                checked={formData.autoUpdate}
                onChange={e =>
                  handleToggleChange('autoUpdate', e.target.checked)
                }
                className='peer sr-only'
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Download Settings */}
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <Download className='h-5 w-5 text-primary' />
            <CardTitle>Downloads</CardTitle>
          </div>
          <CardDescription>
            Configure download behavior and locations
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Download Location</label>
            <div className='flex w-48 space-x-2'>
              <Input
                value={formData.downloadLocation}
                readOnly
                className='flex-1 text-xs'
                title={formData.downloadLocation}
              />
              <Button variant='outline' size='sm' onClick={handleSelectFolder}>
                <Folder className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Video Quality</label>
            <select
              value={formData.videoQuality}
              onChange={e =>
                handleInputChange(
                  'videoQuality',
                  e.target.value as 'best' | 'worst' | '720p' | '1080p',
                )
              }
              className='flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm'
            >
              <option value='best'>Best Available</option>
              <option value='1080p'>High (1080p)</option>
              <option value='720p'>Medium (720p)</option>
              <option value='worst'>Lowest Quality</option>
            </select>
          </div>

          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>
              Max Concurrent Downloads
            </label>
            <Input
              type='number'
              min='1'
              max='10'
              value={formData.maxConcurrentDownloads}
              onChange={e =>
                handleNumberChange('maxConcurrentDownloads', e.target.value)
              }
              className='w-24'
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <Bell className='h-5 w-5 text-primary' />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Control when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Enable Notifications</label>
            <label className='relative inline-flex cursor-pointer items-center'>
              <input
                type='checkbox'
                checked={formData.notificationsEnabled}
                onChange={e =>
                  handleToggleChange('notificationsEnabled', e.target.checked)
                }
                className='peer sr-only'
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex items-center justify-between border-t pt-6'>
        <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
          <Info className='h-4 w-4' />
          <span>Settings are automatically saved</span>
        </div>
        <div className='flex space-x-3'>
          <Button
            variant='outline'
            onClick={() => resetSettingsMutation.mutate()}
            disabled={resetSettingsMutation.isPending}
          >
            {resetSettingsMutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Reset to Defaults
          </Button>

          <input
            type='file'
            accept='.json'
            onChange={handleImportSettings}
            style={{ display: 'none' }}
            id='import-settings'
          />
          <Button
            variant='outline'
            onClick={() => document.getElementById('import-settings')?.click()}
            disabled={importExportStatus === 'importing'}
          >
            {importExportStatus === 'importing' ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Upload className='mr-2 h-4 w-4' />
            )}
            Import Settings
          </Button>

          <Button
            onClick={handleExportSettings}
            disabled={importExportStatus === 'exporting'}
          >
            {importExportStatus === 'exporting' ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <FileDown className='mr-2 h-4 w-4' />
            )}
            Export Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

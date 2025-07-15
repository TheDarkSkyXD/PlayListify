/**
 * Example component demonstrating data fetching and state management
 * 
 * This component shows how to use React Query with Zustand stores
 * and proper loading, error, and empty state handling.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { QueryStateHandler } from '../common/QueryStateHandler';
import { useAppVersion, useMinimizeApp, useMaximizeApp } from '../../hooks/queries/use-app-queries';
import { useDependencyStatus, useInstallAllDependencies } from '../../hooks/queries/use-dependency-queries';
import { useThemeSetting, useUpdateSetting } from '../../hooks/queries/use-settings-queries';
import { useAppStore } from '../../stores/app-store';
import { useDependencyStore } from '../../stores/dependency-store';

export const DataFetchingExample: React.FC = () => {
  // React Query hooks
  const appVersionQuery = useAppVersion();
  const dependencyStatusQuery = useDependencyStatus();
  const themeSettingQuery = useThemeSetting();
  
  // Mutations
  const minimizeApp = useMinimizeApp();
  const maximizeApp = useMaximizeApp();
  const installDependencies = useInstallAllDependencies();
  const updateSetting = useUpdateSetting();
  
  // Zustand stores
  const { theme, setTheme, addNotification } = useAppStore();
  const { isInstalling, allReady } = useDependencyStore();

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    updateSetting.mutate({ key: 'theme', value: newTheme });
    addNotification({
      type: 'success',
      title: 'Theme Updated',
      message: `Theme changed to ${newTheme}`,
    });
  };

  const handleInstallDependencies = () => {
    installDependencies.mutate();
    addNotification({
      type: 'info',
      title: 'Installing Dependencies',
      message: 'Starting dependency installation...',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* App Version Card */}
        <Card>
          <CardHeader>
            <CardTitle>App Version</CardTitle>
            <CardDescription>Application version information</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              queryState={appVersionQuery}
              loadingProps={{ message: 'Loading version...' }}
              errorProps={{ variant: 'inline' }}
              emptyProps={{ title: 'No version data', variant: 'inline' }}
            >
              {(data) => (
                <div className="space-y-2">
                  <p><strong>Version:</strong> {data.version}</p>
                  <p><strong>Environment:</strong> {data.environment}</p>
                  <p><strong>Build Date:</strong> {new Date(data.buildDate).toLocaleDateString()}</p>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>

        {/* Dependency Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dependencies</CardTitle>
            <CardDescription>External dependency status</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              queryState={dependencyStatusQuery}
              loadingProps={{ message: 'Checking dependencies...' }}
              errorProps={{ variant: 'inline' }}
            >
              {(data) => (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>yt-dlp:</span>
                    <span className={data.ytdlp.installed ? 'text-green-600' : 'text-red-600'}>
                      {data.ytdlp.installed ? 'Installed' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>FFmpeg:</span>
                    <span className={data.ffmpeg.installed ? 'text-green-600' : 'text-red-600'}>
                      {data.ffmpeg.installed ? 'Installed' : 'Missing'}
                    </span>
                  </div>
                  {!data.allReady && (
                    <Button 
                      onClick={handleInstallDependencies}
                      disabled={isInstalling || installDependencies.isPending}
                      size="sm"
                      className="w-full"
                    >
                      {isInstalling ? 'Installing...' : 'Install Missing'}
                    </Button>
                  )}
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>

        {/* Theme Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Settings</CardTitle>
            <CardDescription>Current theme configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              queryState={themeSettingQuery}
              loadingProps={{ message: 'Loading theme...' }}
              errorProps={{ variant: 'inline' }}
            >
              {(data) => (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Current Theme:</span>
                    <span className="capitalize">{data.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Store Theme:</span>
                    <span className="capitalize">{theme}</span>
                  </div>
                  <Button 
                    onClick={handleThemeToggle}
                    disabled={updateSetting.isPending}
                    size="sm"
                    className="w-full"
                  >
                    Toggle Theme
                  </Button>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>

      </div>

      {/* Window Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Window Controls</CardTitle>
          <CardDescription>Test window management mutations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={() => minimizeApp.mutate()}
              disabled={minimizeApp.isPending}
              variant="outline"
            >
              Minimize
            </Button>
            <Button 
              onClick={() => maximizeApp.mutate()}
              disabled={maximizeApp.isPending}
              variant="outline"
            >
              Maximize
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Store State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Store State</CardTitle>
          <CardDescription>Current Zustand store states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">App Store</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({
                  theme,
                  isLoading: useAppStore(state => state.isLoading),
                  notifications: useAppStore(state => state.notifications.length),
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dependency Store</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({
                  allReady,
                  isInstalling,
                  currentInstall: useDependencyStore(state => state.currentInstall),
                }, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
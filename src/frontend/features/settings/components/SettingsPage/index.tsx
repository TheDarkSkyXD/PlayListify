import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Skeleton } from '../../../../components/ui/skeleton';
import AppLayout from '../../../../components/Layout/AppLayout';
import DatabaseBackupSection from '../../components/DatabaseBackupSection';
import { useSettings } from './useSettings';
import { SettingsFormSkeleton } from './SettingsFormSkeleton';
import { GeneralSettings } from './GeneralSettings';
import { DownloadSettings } from './DownloadSettings';
import { AdvancedSettings } from './AdvancedSettings';
import { AboutSettings } from './AboutSettings';

/**
 * Main SettingsPage component
 */
export default function SettingsPage() {
  const {
    settings,
    isLoading,
    isSaving,
    saveSuccess,
    error,
    handleChange,
    handleSelectFolder,
    handleSubmit
  } = useSettings();

  // Handle settings change
  const handleSettingsChange = (name: string, value: any) => {
    const event = {
      target: {
        name,
        value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleChange(event);
  };

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
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralSettings
                settings={settings}
                isSaving={isSaving}
                error={error}
                saveSuccess={saveSuccess}
                onSettingsChange={handleSettingsChange}
                onSelectFolder={handleSelectFolder}
                onSubmit={handleSubmit}
              />
            </TabsContent>

            <TabsContent value="downloads">
              <DownloadSettings
                settings={settings}
                isSaving={isSaving}
                error={error}
                saveSuccess={saveSuccess}
                onSettingsChange={handleSettingsChange}
                onSelectFolder={handleSelectFolder}
                onSubmit={handleSubmit}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedSettings
                settings={settings}
                isSaving={isSaving}
                error={error}
                saveSuccess={saveSuccess}
                onSettingsChange={handleSettingsChange}
                onSelectFolder={handleSelectFolder}
                onSubmit={handleSubmit}
              />
            </TabsContent>

            <TabsContent value="database">
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
                <DatabaseBackupSection />
              </div>
            </TabsContent>

            <TabsContent value="about">
              <AboutSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

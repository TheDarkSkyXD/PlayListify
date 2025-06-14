// src/frontend/hooks/useSettings.ts
import { useState, useCallback } from 'react';
import { IpcResponse, Settings } from '../../shared/types';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: IpcResponse<Settings> = await window.api.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch settings');
        setSettings(null);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching settings');
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setIsLoading(true);
    setError(null);
    try {
      // First, update optimistically or fetch current settings if not available
      // For simplicity here, we'll assume settings are loaded or not critical for this direct update call.
      // A more robust solution might involve ensuring settings are loaded first or merging.

      const response: IpcResponse<Settings[K]> = await window.api.setSetting(key, value);
      if (response.success) {
        // Optimistically update local state or refetch all settings
        setSettings(prevSettings => {
          if (prevSettings) {
            return { ...prevSettings, [key]: response.data };
          }
          // If previous settings were null, this single update might not be enough.
          // Consider fetching all settings again or designing API to return full settings object.
          // For now, we'll just update if prevSettings exist.
          return null; // Or handle as an error/refetch
        });
        // Optionally, to ensure full consistency: await fetchSettings();
        return response.data;
      } else {
        setError(response.error?.message || `Failed to update setting: ${key}`);
        return null;
      }
    } catch (e: any) {
      setError(e.message || `An unexpected error occurred while updating setting: ${key}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const saveAllSettings = useCallback(async (newSettings: Partial<Settings>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: IpcResponse<Settings> = await window.api.saveSettings(newSettings);
      if (response.success && response.data) {
        setSettings(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to save settings');
        return null;
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while saving settings');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);


  return { settings, isLoading, error, fetchSettings, updateSetting, saveAllSettings };
};

export const useOpenDialog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const openDialog = useCallback(async (options: Electron.OpenDialogOptions) => {
    setIsLoading(true);
    setError(null);
    setSelectedPath(null);
    try {
      const result: Electron.OpenDialogReturnValue = await window.api.openDialog(options);
      if (!result.canceled && result.filePaths.length > 0) {
        setSelectedPath(result.filePaths[0]);
        return result.filePaths[0];
      } else {
        setSelectedPath(null); // User cancelled or no path selected
        return null;
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while opening dialog');
      setSelectedPath(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { openDialog, selectedPath, isLoading, error };
};
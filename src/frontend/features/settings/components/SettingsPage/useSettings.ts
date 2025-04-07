import { useState, useEffect } from 'react';
import { AppSettings } from '../../../../../shared/types/appTypes';
import { STORAGE_KEYS } from '../../../../../shared/constants/appConstants';
import { UseSettingsReturn } from './types';

/**
 * Custom hook for managing settings state and functionality
 */
export function useSettings(): UseSettingsReturn {
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
        // Use the regular directory selector for all settings
        const selectedPath = await window.api.fs.selectDirectory();

        if (selectedPath) {
          // If this is the download location, append 'playlistify' folder
          if (setting === 'downloadLocation') {
            // Use path.join to properly handle different OS path separators
            const pathParts = selectedPath.split(/[\\/]/);
            const lastPart = pathParts[pathParts.length - 1];

            // Only append 'playlistify' if it's not already the last part
            if (lastPart.toLowerCase() !== 'playlistify') {
              // Create the path with 'playlistify' appended
              const playlistifyPath = `${selectedPath}${selectedPath.endsWith('/') || selectedPath.endsWith('\\') ? '' : '/'}playlistify`;

              const updatedSettings = {
                ...settings,
                [setting]: playlistifyPath
              };

              setSettings(updatedSettings);

              // Save the setting immediately
              if (window.api && window.api.settings) {
                window.api.settings.set(setting as keyof AppSettings, playlistifyPath as any)
                  .then(() => console.log(`Saved ${setting} immediately:`, playlistifyPath))
                  .catch(err => console.error(`Error saving ${setting}:`, err));
              }

              return;
            }
          }

          // For other settings or if already ends with 'playlistify'
          const updatedSettings = {
            ...settings,
            [setting]: selectedPath
          };

          setSettings(updatedSettings);

          // Save the setting immediately
          if (window.api && window.api.settings) {
            window.api.settings.set(setting as keyof AppSettings, selectedPath as any)
              .then(() => console.log(`Saved ${setting} immediately:`, selectedPath))
              .catch(err => console.error(`Error saving ${setting}:`, err));
          }
        }
      }
    } catch (err) {
      console.error(`Error selecting folder for ${setting}:`, err);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    saveSuccess,
    error,
    handleChange,
    handleSelectFolder,
    handleSubmit
  };
}

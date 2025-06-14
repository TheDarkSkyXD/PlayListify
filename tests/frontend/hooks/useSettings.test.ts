// tests/frontend/hooks/useSettings.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSettings, useOpenDialog } from '@/frontend/hooks/useSettings';
import { IpcResponse, Settings } from '@/shared/types';

const mockApi = window.api as jest.Mocked<typeof window.api>;

const mockInitialSettings: Settings = {
  theme: 'dark',
  downloadLocation: '/initial/downloads',
  concurrentDownloads: 3,
  maxQuality: '1080p',
  downloadFormat: 'mp4',
  autoUpdatePlaylists: false,
  refreshIntervalHours: 24,
  enableNotifications: true,
};

describe('useSettings Hooks', () => {
  describe('useSettings', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockApi.getSettings.mockReset();
      mockApi.setSetting.mockReset();
      mockApi.saveSettings.mockReset();
    });

    it('should fetch settings successfully', async () => {
      mockApi.getSettings.mockResolvedValueOnce({ success: true, data: mockInitialSettings } as IpcResponse<Settings>);
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.fetchSettings();
      });

      expect(result.current.settings).toEqual(mockInitialSettings);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApi.getSettings).toHaveBeenCalledTimes(1);
    });

    it('should handle API error when fetching settings', async () => {
      mockApi.getSettings.mockResolvedValueOnce({ success: false, error: { message: 'Fetch Error' } } as IpcResponse<Settings>);
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.fetchSettings();
      });

      expect(result.current.settings).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Fetch Error');
    });

    it('should update a single setting successfully and update local state', async () => {
      // Setup initial state by fetching
      mockApi.getSettings.mockResolvedValueOnce({ success: true, data: mockInitialSettings });
      const { result } = renderHook(() => useSettings());
      await act(async () => {
        await result.current.fetchSettings();
      });

      // Mock setSetting
      const newTheme = 'light';
      mockApi.setSetting.mockResolvedValueOnce({ success: true, data: newTheme } as IpcResponse<Settings['theme']>);
      
      let updatedValue;
      await act(async () => {
        updatedValue = await result.current.updateSetting('theme', newTheme);
      });

      expect(updatedValue).toBe(newTheme);
      expect(result.current.settings?.theme).toBe(newTheme);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApi.setSetting).toHaveBeenCalledWith('theme', newTheme);
    });

    it('should handle error when updating a single setting', async () => {
      mockApi.setSetting.mockResolvedValueOnce({ success: false, error: { message: 'Update Error' } } as IpcResponse<Settings['theme']>);
      const { result } = renderHook(() => useSettings());
       // Optionally fetch initial settings first if your hook logic depends on it for updates
      mockApi.getSettings.mockResolvedValueOnce({ success: true, data: mockInitialSettings });
      await act(async () => {
        await result.current.fetchSettings();
      });

      let updatedValue;
      await act(async () => {
        updatedValue = await result.current.updateSetting('theme', 'light');
      });
      
      expect(updatedValue).toBeNull();
      expect(result.current.settings?.theme).toBe(mockInitialSettings.theme); // Should not have changed
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Update Error');
    });

    it('should save all settings successfully', async () => {
        const newSettingsPayload: Partial<Settings> = { downloadLocation: '/new/path', concurrentDownloads: 5 };
        const expectedSavedSettings: Settings = { ...mockInitialSettings, ...newSettingsPayload };
        mockApi.saveSettings.mockResolvedValueOnce({ success: true, data: expectedSavedSettings } as IpcResponse<Settings>);
        const { result } = renderHook(() => useSettings());
         // Fetch initial to have some base state if needed, though saveSettings might overwrite all
        mockApi.getSettings.mockResolvedValueOnce({ success: true, data: mockInitialSettings });
        await act(async () => {
            await result.current.fetchSettings(); 
        });

        let savedSettings;
        await act(async () => {
            savedSettings = await result.current.saveAllSettings(newSettingsPayload);
        });

        expect(savedSettings).toEqual(expectedSavedSettings);
        expect(result.current.settings).toEqual(expectedSavedSettings);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(mockApi.saveSettings).toHaveBeenCalledWith(newSettingsPayload);
    });

     it('should handle error when saving all settings', async () => {
        const newSettingsPayload: Partial<Settings> = { downloadLocation: '/new/path' };
        mockApi.saveSettings.mockResolvedValueOnce({ success: false, error: { message: 'Save All Error' } } as IpcResponse<Settings>);
        const { result } = renderHook(() => useSettings());
        mockApi.getSettings.mockResolvedValueOnce({ success: true, data: mockInitialSettings });
        await act(async () => {
            await result.current.fetchSettings(); 
        });
        
        let savedSettings;
        await act(async () => {
            savedSettings = await result.current.saveAllSettings(newSettingsPayload);
        });

        expect(savedSettings).toBeNull();
        expect(result.current.settings).toEqual(mockInitialSettings); // Should revert or stay as initial
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Save All Error');
    });

  });

  describe('useOpenDialog', () => {
    beforeEach(() => {
      mockApi.openDialog.mockReset();
    });

    it('should return selected path when dialog is not cancelled', async () => {
      const mockPath = '/selected/folder/path';
      mockApi.openDialog.mockResolvedValueOnce({ canceled: false, filePaths: [mockPath] });
      const { result } = renderHook(() => useOpenDialog());
      
      let selectedPath;
      await act(async () => {
        selectedPath = await result.current.openDialog({ properties: ['openDirectory'] });
      });

      expect(selectedPath).toBe(mockPath);
      expect(result.current.selectedPath).toBe(mockPath);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApi.openDialog).toHaveBeenCalledWith({ properties: ['openDirectory'] });
    });

    it('should return null if dialog is cancelled', async () => {
      mockApi.openDialog.mockResolvedValueOnce({ canceled: true, filePaths: [] });
      const { result } = renderHook(() => useOpenDialog());
      
      let selectedPath;
      await act(async () => {
        selectedPath = await result.current.openDialog({ properties: ['openFile'] });
      });

      expect(selectedPath).toBeNull();
      expect(result.current.selectedPath).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error when opening dialog', async () => {
      // Note: openDialog doesn't return IpcResponse, it returns Electron.OpenDialogReturnValue or throws.
      // So we mock a rejection for error cases.
      mockApi.openDialog.mockRejectedValueOnce(new Error('Dialog Error'));
      const { result } = renderHook(() => useOpenDialog());
      
      let selectedPath;
      await act(async () => {
        selectedPath = await result.current.openDialog({ properties: ['openDirectory'] });
      });

      expect(selectedPath).toBeNull();
      expect(result.current.selectedPath).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Dialog Error');
    });
  });
});
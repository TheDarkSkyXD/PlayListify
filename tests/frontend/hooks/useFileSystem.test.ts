// tests/frontend/hooks/useFileSystem.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCheckPath, useCreateDirectory } from '@/frontend/hooks/useFileSystem';
import { IpcResponse } from '@/shared/types';

// Type assertion for the mocked window.api
const mockApi = window.api as jest.Mocked<typeof window.api>;

describe('useFileSystem Hooks', () => {
  describe('useCheckPath', () => {
    it('should return true if path exists', async () => {
      mockApi.checkFileExists.mockResolvedValueOnce({ success: true, data: true } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCheckPath());

      await act(async () => {
        await result.current.checkPath('/test/path/exists');
      });

      expect(result.current.pathExists).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApi.checkFileExists).toHaveBeenCalledWith('/test/path/exists');
    });

    it('should return false if path does not exist', async () => {
      mockApi.checkFileExists.mockResolvedValueOnce({ success: true, data: false } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCheckPath());

      await act(async () => {
        await result.current.checkPath('/test/path/not-exists');
      });

      expect(result.current.pathExists).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error for checkPath', async () => {
      mockApi.checkFileExists.mockResolvedValueOnce({ success: false, error: { message: 'IPC Error' } } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCheckPath());

      await act(async () => {
        await result.current.checkPath('/test/path/error');
      });

      expect(result.current.pathExists).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('IPC Error');
    });

     it('should handle unexpected error for checkPath', async () => {
      mockApi.checkFileExists.mockRejectedValueOnce(new Error('Unexpected API failure'));
      const { result } = renderHook(() => useCheckPath());

      await act(async () => {
        await result.current.checkPath('/test/path/unexpected-error');
      });

      expect(result.current.pathExists).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Unexpected API failure');
    });
  });

  describe('useCreateDirectory', () => {
    it('should return true if directory is created successfully', async () => {
      mockApi.createDirectory.mockResolvedValueOnce({ success: true, data: true } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCreateDirectory());

      await act(async () => {
        await result.current.createDirectory('/new/directory');
      });

      expect(result.current.directoryCreated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApi.createDirectory).toHaveBeenCalledWith('/new/directory');
    });

    it('should return false if directory creation fails (API success false)', async () => {
      mockApi.createDirectory.mockResolvedValueOnce({ success: true, data: false } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCreateDirectory());

      await act(async () => {
        await result.current.createDirectory('/new/directory/fail-data');
      });

      expect(result.current.directoryCreated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error for createDirectory', async () => {
      mockApi.createDirectory.mockResolvedValueOnce({ success: false, error: { message: 'Directory Creation IPC Error' } } as IpcResponse<boolean>);
      const { result } = renderHook(() => useCreateDirectory());

      await act(async () => {
        await result.current.createDirectory('/new/directory/error');
      });

      expect(result.current.directoryCreated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Directory Creation IPC Error');
    });

    it('should handle unexpected error for createDirectory', async () => {
      mockApi.createDirectory.mockRejectedValueOnce(new Error('Unexpected Directory API failure'));
      const { result } = renderHook(() => useCreateDirectory());

      await act(async () => {
        await result.current.createDirectory('/new/directory/unexpected-error');
      });

      expect(result.current.directoryCreated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Unexpected Directory API failure');
    });
  });
});
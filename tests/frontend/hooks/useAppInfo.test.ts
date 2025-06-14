// tests/frontend/hooks/useAppInfo.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAppInfo, useAppPath } from '@/frontend/hooks/useAppInfo';
import { IpcResponse, AppStatus } from '@/shared/types';

const mockApi = window.api as jest.Mocked<typeof window.api>;

const mockAppStatus: AppStatus = {
  version: '1.0.1-mock',
  isOnline: true,
  dependencies: {
    ffmpeg: 'installed',
    ytDlp: 'installed',
  },
};

describe('useAppInfo Hooks', () => {
  describe('useAppInfo', () => {
    beforeEach(() => {
      mockApi.getAppStatus.mockReset();
    });

        it('should fetch app status on mount and expose version', async () => {
          mockApi.getAppStatus.mockResolvedValueOnce({ success: true, data: mockAppStatus } as IpcResponse<AppStatus>);
          const { result } = renderHook(() => useAppInfo());
    
          // Initial state before/during useEffect's async operation might be isLoading = true
          // We will assert the final state after act completes.
          // A more robust initial check could be `expect(mockApi.getAppStatus).toHaveBeenCalledTimes(1);`
          // if we want to ensure it's called immediately.
      await act(async () => {
        // Allow useEffect to run and state to update
        // If fetchAppStatus is called in useEffect, it might already be loading or completed
        // For hooks that fetch on mount, waiting for loading to be false is a common pattern
      });
      
      // Wait for the hook to finish loading if it fetches on mount
      // This might require a more sophisticated wait if there are multiple async operations
      // For simple cases, checking isLoading and then the data might be enough.
      // If the hook immediately sets loading to true then false after fetch:
      
      // Re-evaluate after useEffect completes. If fetchAppStatus is async, need to await its completion.
      // The `act` wrapper handles this for state updates triggered by promises resolving.
      // If there's an immediate call in useEffect, isLoading might flip quickly.
      
      // A common pattern is to wait for isLoading to become false.
      // However, since `fetchAppStatus` is called in `useEffect`, the initial render might already have `isLoading` as true.
      // Then `act` will process the promise resolution.

      // Let's refine the expectation:
      // The hook calls fetchAppStatus in useEffect.
      // So, by the time we can assert, isLoading should be false, and data populated.
      
      // To ensure all async operations within useEffect and fetchAppStatus are done:
      // We might need to await something more concrete or use waitFor
      // For now, let's assume `act` handles the promise from `getAppStatus`
      
      expect(result.current.isLoading).toBe(false); // After fetch completes
      expect(result.current.appStatus).toEqual(mockAppStatus);
      expect(result.current.version).toBe(mockAppStatus.version);
      expect(result.current.error).toBeNull();
      expect(mockApi.getAppStatus).toHaveBeenCalledTimes(1);
    });

    it('should allow manual refetch of app status', async () => {
      mockApi.getAppStatus
        .mockResolvedValueOnce({ success: true, data: mockAppStatus }) // For initial fetch
        .mockResolvedValueOnce({ success: true, data: { ...mockAppStatus, version: '1.0.2-refetched' } }); // For manual fetch

      const { result } = renderHook(() => useAppInfo());

      // Wait for initial fetch
      await act(async () => {}); // ensure useEffect completes

      expect(result.current.version).toBe('1.0.1-mock');

      await act(async () => {
        await result.current.fetchAppStatus();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.appStatus?.version).toBe('1.0.2-refetched');
      expect(result.current.version).toBe('1.0.2-refetched');
      expect(mockApi.getAppStatus).toHaveBeenCalledTimes(2); // Initial + manual
    });

    it('should handle API error when fetching app status', async () => {
      mockApi.getAppStatus.mockResolvedValueOnce({ success: false, error: { message: 'Status Fetch Error' } }  as IpcResponse<AppStatus>);
      const { result } = renderHook(() => useAppInfo());
      
      await act(async () => {}); // ensure useEffect completes

      expect(result.current.isLoading).toBe(false);
      expect(result.current.appStatus).toBeNull();
      expect(result.current.version).toBeUndefined();
      expect(result.current.error).toBe('Status Fetch Error');
    });
  });

  describe('useAppPath', () => {
    beforeEach(() => {
        mockApi.getAppPath.mockReset();
    });

    it('should fetch a specific app path successfully', async () => {
        const pathName = 'userData';
        const mockPath = '/mock/user/data/path';
        mockApi.getAppPath.mockResolvedValueOnce({ success: true, data: mockPath } as IpcResponse<string>);
        const { result } = renderHook(() => useAppPath());

        await act(async () => {
            await result.current.fetchAppPath(pathName);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.path).toBe(mockPath);
        expect(result.current.error).toBeNull();
        expect(mockApi.getAppPath).toHaveBeenCalledWith(pathName);
    });

    it('should handle API error when fetching app path', async () => {
        const pathName = 'temp';
        mockApi.getAppPath.mockResolvedValueOnce({ success: false, error: { message: 'Path Fetch Error' } } as IpcResponse<string>);
        const { result } = renderHook(() => useAppPath());

        await act(async () => {
            await result.current.fetchAppPath(pathName);
        });
        
        expect(result.current.isLoading).toBe(false);
        expect(result.current.path).toBeNull();
        expect(result.current.error).toBe('Path Fetch Error');
    });

    it('should handle unexpected error when fetching app path', async () => {
      const pathName = 'logs';
      mockApi.getAppPath.mockRejectedValueOnce(new Error('Unexpected Path API failure'));
      const { result } = renderHook(() => useAppPath());

      await act(async () => {
          await result.current.fetchAppPath(pathName);
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.path).toBeNull();
      expect(result.current.error).toBe('Unexpected Path API failure');
    });
  });
});
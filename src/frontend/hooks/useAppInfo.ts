// src/frontend/hooks/useAppInfo.ts
import { useState, useCallback, useEffect } from 'react';
import { IpcResponse, AppStatus } from '../../shared/types';

export const useAppInfo = () => {
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: IpcResponse<AppStatus> = await window.api.getAppStatus();
      if (response.success && response.data) {
        setAppStatus(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch app status');
        setAppStatus(null);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching app status');
      setAppStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optionally fetch on mount
  useEffect(() => {
    fetchAppStatus();
  }, [fetchAppStatus]);

  return { appStatus, isLoading, error, fetchAppStatus, version: appStatus?.version };
};

export const useAppPath = () => {
    const [path, setPath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAppPath = useCallback(async (pathName: string) => {
        setIsLoading(true);
        setError(null);
        setPath(null);
        try {
            const response: IpcResponse<string> = await window.api.getAppPath(pathName);
            if (response.success && response.data) {
                setPath(response.data);
            } else {
                setError(response.error?.message || `Failed to fetch app path: ${pathName}`);
                setPath(null);
            }
        } catch (e: any) {
            setError(e.message || `An unexpected error occurred while fetching app path: ${pathName}`);
            setPath(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { path, isLoading, error, fetchAppPath};
}
// src/frontend/hooks/useFileSystem.ts
import { useState, useCallback } from 'react';
import { IpcResponse } from '../../shared/types';

export const useCheckPath = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathExists, setPathExists] = useState<boolean | null>(null);

  const checkPath = useCallback(async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    setPathExists(null);
    try {
      const response: IpcResponse<boolean> = await window.api.checkFileExists(filePath);
      if (response.success) {
        setPathExists(response.data ?? false);
      } else {
        setError(response.error?.message || 'Failed to check path');
        setPathExists(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
      setPathExists(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { checkPath, pathExists, isLoading, error };
};

export const useCreateDirectory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryCreated, setDirectoryCreated] = useState<boolean | null>(null);

  const createDirectory = useCallback(async (dirPath: string) => {
    setIsLoading(true);
    setError(null);
    setDirectoryCreated(null);
    try {
      const response: IpcResponse<boolean> = await window.api.createDirectory(dirPath);
      if (response.success) {
        setDirectoryCreated(response.data ?? false);
      } else {
        setError(response.error?.message || 'Failed to create directory');
        setDirectoryCreated(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
      setDirectoryCreated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createDirectory, directoryCreated, isLoading, error };
};
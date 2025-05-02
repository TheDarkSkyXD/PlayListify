import { useState, useCallback, useEffect } from 'react';

// Generic hook for IPC communication
export function useIPC<T, R = void>(
  channel: string,
  initialLoading = false
): {
  data: R | null;
  error: Error | null;
  loading: boolean;
  invoke: (args?: T) => Promise<R>;
} {
  const [data, setData] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(initialLoading);

  // Async function to invoke IPC
  const invoke = useCallback(
    async (args?: T): Promise<R> => {
      try {
        setLoading(true);
        setError(null);
        
        // Use window.electron exposed by preload script
        // @ts-ignore - Using directly without type checking
        const result: R = await window.electron.ipcRenderer.invoke(channel, args);
        
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [channel]
  );

  return { data, error, loading, invoke };
}

// Hook for listening to IPC events
export function useIPCListener<T>(
  channel: string,
  callback: (data: T) => void
): void {
  useEffect(() => {
    // Add listener
    // @ts-ignore - Using directly without type checking
    const removeListener = window.electron.ipcRenderer.on(channel, callback);
    
    // Cleanup on unmount
    return () => {
      removeListener();
    };
  }, [channel, callback]);
} 
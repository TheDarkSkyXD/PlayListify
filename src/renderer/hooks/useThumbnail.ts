import { useState, useEffect } from 'react';
import { useIPC } from './useIPC';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

interface ThumbnailResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * Hook to fetch a thumbnail through the main process proxy to avoid CSP issues
 * @param url The URL of the thumbnail to fetch
 * @param fallbackUrl Optional fallback URL to use if the main URL fails
 * @returns { dataUrl, isLoading, error }
 */
export const useThumbnail = (url: string | undefined, fallbackUrl?: string) => {
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | undefined>(undefined);
  
  const { invoke } = useIPC<{ url: string }, ThumbnailResponse>(
    IPC_CHANNELS.THUMBNAIL_FETCH
  );
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchThumbnail = async () => {
      if (!url) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(undefined);
      
      try {
        const response = await invoke({ url });
        
        if (isMounted) {
          if (response.success && response.dataUrl) {
            setDataUrl(response.dataUrl);
            setError(undefined);
          } else {
            setError(response.error || 'Failed to load thumbnail');
            
            // Try fallback URL if provided
            if (fallbackUrl && fallbackUrl !== url) {
              try {
                console.log('Attempting fallback thumbnail URL');
                const fallbackResponse = await invoke({ url: fallbackUrl });
                
                if (isMounted) {
                  if (fallbackResponse.success && fallbackResponse.dataUrl) {
                    setDataUrl(fallbackResponse.dataUrl);
                    setError(undefined);
                  } else {
                    setError(fallbackResponse.error || 'Failed to load thumbnail');
                  }
                }
              } catch (fallbackError) {
                if (isMounted) {
                  setError(`Failed to load thumbnail: ${fallbackError}`);
                }
              }
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(`Failed to load thumbnail: ${error}`);
          
          // Try fallback URL if provided
          if (fallbackUrl && fallbackUrl !== url) {
            try {
              console.log('Attempting fallback thumbnail URL');
              const fallbackResponse = await invoke({ url: fallbackUrl });
              
              if (isMounted) {
                if (fallbackResponse.success && fallbackResponse.dataUrl) {
                  setDataUrl(fallbackResponse.dataUrl);
                  setError(undefined);
                }
              }
            } catch (fallbackError) {
              if (isMounted) {
                setError(`Failed to load thumbnail: ${fallbackError}`);
              }
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchThumbnail();
    
    return () => {
      isMounted = false;
    };
  }, [url, fallbackUrl, invoke]);
  
  return { dataUrl, isLoading, error };
}; 
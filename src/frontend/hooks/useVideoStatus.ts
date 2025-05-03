import { useState, useEffect } from 'react';
import { useIPC } from './useIPC';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

interface VideoStatusResponse {
  isAvailable: boolean;
  isPrivate: boolean;
  isDeleted: boolean;
  error?: string;
}

interface VideoStatusCache {
  [videoId: string]: VideoStatusResponse;
}

// Create an in-memory cache to avoid checking the same video multiple times
const videoStatusCache: VideoStatusCache = {};

/**
 * Custom hook to check if a YouTube video is available, private, or deleted
 * @param videoId YouTube video ID to check
 * @returns Status of the video and loading state
 */
export const useVideoStatus = (videoId: string) => {
  const [status, setStatus] = useState<VideoStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!!videoId);
  const [error, setError] = useState<string | null>(null);
  
  const { invoke } = useIPC<{ videoId: string }, VideoStatusResponse>(
    IPC_CHANNELS.CHECK_VIDEO_STATUS
  );
  
  useEffect(() => {
    let isMounted = true;
    
    const checkStatus = async () => {
      if (!videoId) {
        setIsLoading(false);
        setError('No video ID provided');
        return;
      }
      
      // Check cache first
      if (videoStatusCache[videoId]) {
        setStatus(videoStatusCache[videoId]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await invoke({ videoId });
        
        if (!isMounted) return;
        
        // Cache the result
        videoStatusCache[videoId] = response;
        
        setStatus(response);
        if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        
        // Set default status for errors
        setStatus({
          isAvailable: false,
          isPrivate: false,
          isDeleted: true,
          error: errorMessage
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkStatus();
    
    return () => {
      isMounted = false;
    };
  }, [videoId, invoke]);
  
  return { status, isLoading, error };
}; 
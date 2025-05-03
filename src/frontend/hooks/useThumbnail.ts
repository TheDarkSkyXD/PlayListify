import { useState, useEffect, useCallback, useRef } from 'react';
import { useIPC } from './useIPC';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

interface ThumbnailResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

// Create an in-memory cache for thumbnail URLs
const thumbnailCache: Record<string, string | null> = {};

// Create a cache of known-failed video IDs to prevent repeated requests
// Store failed IDs in localStorage for persistence between sessions
const loadFailedVideoIds = (): Set<string> => {
  try {
    const storedIds = localStorage.getItem('failed-thumbnail-video-ids');
    if (storedIds) {
      return new Set(JSON.parse(storedIds));
    }
  } catch (error) {
    console.warn('Failed to load failed video IDs from localStorage', error);
  }
  return new Set<string>();
};

// Initialize the set with stored values
const failedVideoIds = loadFailedVideoIds();

// Function to add video ID to failed list and persist to localStorage
const addToFailedVideoIds = (videoId: string): void => {
  if (!videoId || failedVideoIds.has(videoId)) return;
  
  failedVideoIds.add(videoId);
  
  try {
    localStorage.setItem(
      'failed-thumbnail-video-ids',
      JSON.stringify(Array.from(failedVideoIds))
    );
    
    // Sync with main process in the background
    syncFailedIdsWithMainProcess().catch(error => 
      console.warn('Failed to sync failed IDs with main process', error)
    );
  } catch (error) {
    console.warn('Failed to save failed video IDs to localStorage', error);
  }
};

// Sync failed IDs with the main process
const syncFailedIdsWithMainProcess = async (): Promise<void> => {
  try {
    // Use the electron API exposed by the preload script
    if (!window.electron?.ipcRenderer?.invoke) {
      console.warn('Electron IPC not available for communication');
      return;
    }

    const mainProcessIds = await window.electron.ipcRenderer.invoke(
      IPC_CHANNELS.SYNC_FAILED_THUMBNAIL_IDS, 
      Array.from(failedVideoIds)
    );
    
    // Add any additional IDs from the main process
    if (Array.isArray(mainProcessIds)) {
      let hasNewIds = false;
      
      mainProcessIds.forEach(id => {
        if (!failedVideoIds.has(id)) {
          failedVideoIds.add(id);
          hasNewIds = true;
        }
      });
      
      // If we got new IDs, update localStorage
      if (hasNewIds) {
        localStorage.setItem(
          'failed-thumbnail-video-ids',
          JSON.stringify(Array.from(failedVideoIds))
        );
      }
    }
  } catch (error) {
    console.error('Error syncing failed video IDs with main process:', error);
  }
};

// Initialize by syncing with main process
// Delay syncing until the DOM is loaded to ensure electron is available
setTimeout(() => {
  // Check if electron IPC is available before trying to sync
  if (typeof window.electron?.ipcRenderer?.invoke === 'function') {
    syncFailedIdsWithMainProcess().catch(error => 
      console.warn('Failed to initially sync failed IDs with main process', error)
    );
  }
}, 1000); // Delay by 1 second

/**
 * Helper function to extract YouTube video ID from URL
 */
const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  
  // First check if it's a thumbnail URL
  const thumbnailMatches = 
    url.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//) || 
    url.match(/\/([a-zA-Z0-9_-]{11})\/.*\.(?:jpg|webp)/);
  
  if (thumbnailMatches) return thumbnailMatches[1];
  
  // Then check if it's a regular YouTube URL
  const videoMatches = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^\/\?\&]+)/);
  if (videoMatches) return videoMatches[1];
  
  return null;
};

/**
 * Generate multiple fallback URLs for YouTube thumbnails
 * The order is important - we try the most reliable formats first
 */
const getYouTubeFallbackUrls = (videoId: string): string[] => {
  if (!videoId) return [];
  
  return [
    // Most reliable formats first
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    
    // Medium quality options
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    
    // WebP versions (efficient but not as widely supported)
    `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,
    `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`,
    
    // Standard definition (not always available for older videos)
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    
    // Use max resolution last (often not available)
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    
    // Low quality fallbacks (almost always available)
    `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
  ];
};

/**
 * Check if a URL is a YouTube thumbnail URL
 */
const isYouTubeThumbnailUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com/vi') || 
         url.includes('ytimg.com/vi') || 
         url.includes('ytimg.com/vi_webp');
};

/**
 * Get the suggested format to try first based on a YouTube URL pattern
 */
const getSuggestedFormat = (url?: string): string => {
  if (!url) return 'hqdefault';
  
  // Check which format is specified in the URL
  if (url.includes('maxresdefault')) return 'hqdefault'; // Replace with more reliable format
  if (url.includes('sddefault')) return 'hqdefault';     // Replace with more reliable format
  if (url.includes('hqdefault')) return 'hqdefault';     // Keep as is
  if (url.includes('mqdefault')) return 'mqdefault';     // Keep as is
  if (url.includes('default')) return 'default';         // Keep as is
  
  // Default to most reliable format
  return 'hqdefault';
};

/**
 * Parse pipe-separated fallback URLs if provided
 */
const parseFallbackUrls = (fallbackUrl?: string): string[] => {
  if (!fallbackUrl) return [];
  
  // If the fallback contains pipe separators, treat it as multiple fallbacks
  if (fallbackUrl.includes('|')) {
    return fallbackUrl.split('|').filter(url => url.trim());
  }
  
  return [fallbackUrl];
};

/**
 * Hook to fetch a thumbnail through the main process proxy to avoid CSP issues
 * @param url The URL of the thumbnail to fetch
 * @param fallbackUrl Optional fallback URL to use if the main URL fails (can be pipe-separated list)
 * @returns { dataUrl, isLoading, error }
 */
export const useThumbnail = (url: string | undefined, fallbackUrl?: string) => {
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Start with not loading state
  const [error, setError] = useState<string | undefined>(undefined);
  const [attemptedUrls, setAttemptedUrls] = useState<string[]>([]);
  const abortController = useRef<AbortController | null>(null);
  const currentRequestUrl = useRef<string | undefined>(url);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset attempted URLs when the URL changes
  useEffect(() => {
    if (url !== currentRequestUrl.current) {
      setAttemptedUrls([]);
      currentRequestUrl.current = url;
    }
  }, [url]);
  
  const { invoke } = useIPC<{ url: string }, ThumbnailResponse>(
    IPC_CHANNELS.THUMBNAIL_FETCH
  );
  
  // Function to prepareURLsToTry
  const prepareUrlsToTry = useCallback((mainUrl?: string, backup?: string): string[] => {
    if (!mainUrl) return [];
    
    // Don't filter out already attempted URLs - this was causing issues
    // Just get all possible URLs and we'll track which ones we've tried during the actual fetch
    let urlsToTry: string[] = [];
    
    // Extract YouTube video ID if the URL is a YouTube URL
    const videoId = extractYouTubeId(mainUrl);
    
    // If we've seen this video ID fail before, don't try again
    if (videoId && failedVideoIds.has(videoId)) {
      return [];
    }
    
    if (videoId) {
      // For YouTube URLs, we have a specific priority of formats to try
      
      // If the main URL is a potentially unreliable format, replace it
      if (isYouTubeThumbnailUrl(mainUrl)) {
        const suggestedFormat = getSuggestedFormat(mainUrl);
        if (suggestedFormat) {
          // Replace the format in the URL
          const formatRegex = /(default|[mhs]qdefault|maxresdefault)/;
          const hqUrl = mainUrl.replace(formatRegex, suggestedFormat);
          urlsToTry.push(hqUrl);
        }
      } else {
        // For non-thumbnail YouTube URLs, use our reliable format
        urlsToTry.push(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      }
      
      // Add any provided fallback URLs
      const fallbackUrls = parseFallbackUrls(backup);
      fallbackUrls.forEach(fbUrl => {
        if (!urlsToTry.includes(fbUrl)) {
          urlsToTry.push(fbUrl);
        }
      });
      
      // Add generated fallbacks
      urlsToTry = urlsToTry.concat(getYouTubeFallbackUrls(videoId));
    } else {
      // For non-YouTube URLs, just try the original and the fallback
      urlsToTry = [mainUrl];
      
      // Add any provided fallback URLs
      const fallbackUrls = parseFallbackUrls(backup);
      fallbackUrls.forEach(fbUrl => {
        if (!urlsToTry.includes(fbUrl)) {
          urlsToTry.push(fbUrl);
        }
      });
    }
    
    return Array.from(new Set(urlsToTry));
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    const myAttemptedUrls: string[] = [];
    const debugMode = false; // Set to true only when debugging thumbnail issues
    
    const fetchThumbnail = async () => {
      // Cancel any previous requests
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Cancel any existing retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      abortController.current = new AbortController();
      
      if (!url) {
        setIsLoading(false);
        setError('No URL provided');
        return;
      }
      
      // Extract the video ID to check failed cache
      const videoId = extractYouTubeId(url);
      
      // Check if this video ID is known to fail - skip fetching entirely
      if (videoId && failedVideoIds.has(videoId)) {
        setIsLoading(false);
        setDataUrl(undefined);
        setError(`Video thumbnail unavailable`);
        return;
      }
      
      // Check cache first
      if (thumbnailCache[url] !== undefined) {
        // Note: null means we've tried this URL before and it failed
        setDataUrl(thumbnailCache[url] || undefined);
        setIsLoading(false);
        setError(thumbnailCache[url] === null ? 'Thumbnail unavailable' : undefined);
        return;
      }
      
      // Set to loading state only when we're actually going to fetch
      setIsLoading(true);
      setError(undefined);
      
      // Get URLs to try
      const urlsToTry = prepareUrlsToTry(url, fallbackUrl);
      
      // If no valid URLs to try, exit early
      if (urlsToTry.length === 0) {
        setIsLoading(false);
        setError('No valid thumbnail URLs to try');
        return;
      }
      
      // Try each URL in sequence until one works
      let currentUrlIndex = 0;
      let successfulUrl: string | null = null;
      
      // Only try a maximum of 2 URLs to avoid excessive requests (reduced from 3)
      const maxUrlsToTry = Math.min(2, urlsToTry.length);
      
      while (currentUrlIndex < maxUrlsToTry && !successfulUrl) {
        if (!isMounted) return;
        
        const currentUrl = urlsToTry[currentUrlIndex];
        
        // Skip URLs we've already tried in this session
        if (myAttemptedUrls.includes(currentUrl)) {
          currentUrlIndex++;
          continue;
        }
        
        // Check if the URL is already cached
        if (thumbnailCache[currentUrl] !== undefined) {
          if (thumbnailCache[currentUrl] !== null) {
            successfulUrl = currentUrl;
            setDataUrl(thumbnailCache[currentUrl] || undefined);
            setError(undefined);
            setIsLoading(false);
            break;
          } else {
            // This URL previously failed
            currentUrlIndex++;
            continue;
          }
        }
        
        // Mark this URL as attempted
        myAttemptedUrls.push(currentUrl);
        
        try {
          if (debugMode) console.log(`Trying thumbnail URL: ${currentUrl}`);
          
          const response = await invoke({ url: currentUrl });
          
          if (!isMounted) return;
          
          if (response.success && response.dataUrl) {
            if (debugMode) console.log(`Successfully loaded thumbnail: ${currentUrl}`);
            successfulUrl = currentUrl;
            // Cache the result
            thumbnailCache[currentUrl] = response.dataUrl;
            thumbnailCache[url] = response.dataUrl; // Also cache for the original URL
            
            setDataUrl(response.dataUrl);
            setError(undefined);
            break;
          } else if (response.error) {
            thumbnailCache[currentUrl] = null; // Cache failures
            if (debugMode) console.log(`Error loading thumbnail ${currentUrl}: ${response.error}`);
          }
        } catch (err) {
          thumbnailCache[currentUrl] = null; // Cache failures
          if (debugMode) console.log(`Exception loading thumbnail ${currentUrl}:`, err);
        }
        
        currentUrlIndex++;
      }
      
      if (!successfulUrl) {
        // Add to failed videos cache to avoid future attempts for this video
        if (videoId) {
          // Add to our set and persist to localStorage
          addToFailedVideoIds(videoId);
          
          // Only log once per session and only in debug mode
          if (debugMode) {
            console.error(`All YouTube thumbnail formats failed for video ID: ${videoId}`);
          }
        }
        
        // Cache the failure for this URL
        thumbnailCache[url] = null;
        
        setIsLoading(false);
        setError(`Failed to fetch thumbnail: ${videoId ? `Thumbnail unavailable for video` : 'Unable to load image'}`);
      } else {
        // Set loading false on success
        setIsLoading(false);
      }
    };

    if (url) {
      fetchThumbnail();
    } else {
      setIsLoading(false);
      setDataUrl(undefined);
    }
    
    return () => {
      isMounted = false;
      
      // Clean up any abort controller
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Clean up any retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [url, fallbackUrl, invoke, prepareUrlsToTry]);
  
  return { dataUrl, isLoading, error };
}; 
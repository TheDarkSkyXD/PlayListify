import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the window.electron interface for TypeScript
interface ElectronAPI {
  ipcRenderer: {
    invoke: <T = unknown, R = unknown>(channel: string, data?: T | undefined) => Promise<R>;
    on: <T = unknown>(channel: string, callback: (data: T) => void) => () => void;
    once: <T = unknown>(channel: string, callback: (data: T) => void) => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// Types for format conversion
export interface ConversionFormat {
  id: string;
  name: string;
  type: 'video' | 'audio';
  extensions: string[];
}

export interface QualityOption {
  id: string;
  name: string;
  resolution?: string;
}

export interface AudioBitrateOption {
  id: string;
  name: string;
}

export interface ConversionProgress {
  percent: number;
  fps?: number;
  kbps?: number;
  timemark?: string;
  eta?: string;
}

export interface ConversionResult {
  id: string;
  success: boolean;
  outputPath: string;
  duration: number;
  format: string;
  size: number;
  error?: string;
}

export interface ConversionOptions {
  inputPath: string;
  format: string;
  quality?: string;
  audioBitrate?: string;
  videoCodec?: string;
  audioCodec?: string;
  outputFilename?: string;
  customOptions?: string[];
}

export interface ExtractAudioOptions {
  inputPath: string;
  outputFormat: string;
  audioBitrate?: string;
}

export interface ChangeQualityOptions {
  inputPath: string;
  quality: string;
  outputFormat?: string;
}

// Progress tracking map (conversion ID -> progress)
const activeConversions = new Map<string, ConversionProgress>();

// Helper function to safely extract response data
function safeExtractData<T>(result: any): T {
  if (!result || typeof result !== 'object' || !('success' in result) || !result.success) {
    const errorMsg = result && typeof result === 'object' && 'error' in result 
      ? String(result.error) 
      : 'Failed to extract data';
    throw new Error(errorMsg);
  }
  return result.data as T;
}

// Hook to fetch available formats
export function useAvailableFormats() {
  return useQuery<ConversionFormat[]>({
    queryKey: ['format-converter', 'formats'],
    queryFn: async () => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:get-formats');
      return safeExtractData<ConversionFormat[]>(result);
    }
  });
}

// Hook to fetch available quality options
export function useAvailableQualities() {
  return useQuery<QualityOption[]>({
    queryKey: ['format-converter', 'qualities'],
    queryFn: async () => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:get-qualities');
      return safeExtractData<QualityOption[]>(result);
    }
  });
}

// Hook to fetch available audio bitrates
export function useAvailableAudioBitrates() {
  return useQuery<AudioBitrateOption[]>({
    queryKey: ['format-converter', 'audio-bitrates'],
    queryFn: async () => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:get-audio-bitrates');
      return safeExtractData<AudioBitrateOption[]>(result);
    }
  });
}

// Hook to get video information
export function useVideoInfo(filePath: string | null) {
  return useQuery<any>({
    queryKey: ['format-converter', 'video-info', filePath],
    queryFn: async () => {
      if (!filePath) {
        return null;
      }
      
      const result = await window.electron.ipcRenderer.invoke('format-converter:get-video-info', filePath);
      return safeExtractData<any>(result);
    },
    enabled: !!filePath // Only run query if filePath is provided
  });
}

// Hook to convert a file
export function useConvertFile() {
  const queryClient = useQueryClient();
  
  return useMutation<ConversionResult, Error, ConversionOptions>({
    mutationFn: async (options) => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:convert-file', options);
      return safeExtractData<ConversionResult>(result);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful conversion
      queryClient.invalidateQueries({ queryKey: ['format-converter', 'conversions'] });
    }
  });
}

// Hook to extract audio from a video
export function useExtractAudio() {
  const queryClient = useQueryClient();
  
  return useMutation<ConversionResult, Error, ExtractAudioOptions>({
    mutationFn: async (options) => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:extract-audio', options);
      return safeExtractData<ConversionResult>(result);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful extraction
      queryClient.invalidateQueries({ queryKey: ['format-converter', 'conversions'] });
    }
  });
}

// Hook to change video quality
export function useChangeVideoQuality() {
  const queryClient = useQueryClient();
  
  return useMutation<ConversionResult, Error, ChangeQualityOptions>({
    mutationFn: async (options) => {
      const result = await window.electron.ipcRenderer.invoke('format-converter:change-quality', options);
      return safeExtractData<ConversionResult>(result);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful quality change
      queryClient.invalidateQueries({ queryKey: ['format-converter', 'conversions'] });
    }
  });
}

// Hook to select a file for conversion
export function useSelectFile() {
  const selectFile = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('format-converter:select-file');
      // Use type assertion to properly type the result
      const typedResult = result as { success: boolean; data: { path: string } | null; error?: string };
      if (!typedResult || !typedResult.success || !typedResult.data) {
        return null;
      }
      return typedResult.data.path;
    } catch (error) {
      console.error('Error selecting file:', error);
      return null;
    }
  }, []);
  
  return { selectFile };
}

// Hook to select an output directory
export function useSelectOutputDirectory() {
  const selectDirectory = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('format-converter:select-output-directory');
      // Use type assertion to properly type the result
      const typedResult = result as { success: boolean; data: { path: string } | null; error?: string };
      if (!typedResult || !typedResult.success || !typedResult.data) {
        return null;
      }
      return typedResult.data.path;
    } catch (error) {
      console.error('Error selecting directory:', error);
      return null;
    }
  }, []);
  
  return { selectDirectory };
}

// Hook to track conversion progress
export function useConversionProgress(conversionId: string | null) {
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [result, setResult] = useState<{success: boolean; outputPath: string; error?: string} | null>(null);
  
  useEffect(() => {
    if (!conversionId) {
      return;
    }
    
    // Reset states when conversion ID changes
    setProgress(null);
    setIsComplete(false);
    setResult(null);
    
    // Set up listeners for progress and completion
    const progressListener = (data: any) => {
      if (data.id === conversionId) {
        setProgress(data.progress);
        
        // Update the global tracking map
        activeConversions.set(conversionId, data.progress);
      }
    };
    
    const completeListener = (data: any) => {
      if (data.id === conversionId) {
        setIsComplete(true);
        setResult({
          success: data.success,
          outputPath: data.outputPath,
          error: data.error
        });
        
        // Remove from the tracking map once complete
        activeConversions.delete(conversionId);
      }
    };
    
    // Add event listeners
    const removeProgressListener = window.electron.ipcRenderer.on('format-converter:progress', progressListener);
    const removeCompleteListener = window.electron.ipcRenderer.on('format-converter:complete', completeListener);
    
    // Cleanup function
    return () => {
      removeProgressListener();
      removeCompleteListener();
    };
  }, [conversionId]);
  
  return { progress, isComplete, result };
}

// Hook to get all active conversions
export function useActiveConversions() {
  const [conversions, setConversions] = useState<Map<string, ConversionProgress>>(new Map());
  
  useEffect(() => {
    // Update the state periodically to reflect the current active conversions
    const intervalId = setInterval(() => {
      setConversions(new Map(activeConversions));
    }, 500);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return conversions;
} 
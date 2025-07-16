// src/frontend/hooks/useYouTubeImportQueries.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ipcClient } from '../lib/ipc-client';
import { invalidationHelpers, youtubeKeys } from '../lib/query-keys';

// Types
export interface ValidationResult {
  isValid: boolean;
  urlInfo: {
    type: 'playlist' | 'video' | 'channel' | 'invalid';
    id: string;
    originalUrl: string;
    normalizedUrl: string;
    isValid: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface YouTubePlaylistPreview {
  id: string;
  title: string;
  description?: string;
  videoCount: number;
  visibility: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
  channelTitle: string;
  channelId: string;
  createdAt?: string;
  updatedAt?: string;
  isAccessible: boolean;
  estimatedDuration?: number;
}

export interface ImportJob {
  id: string;
  playlistUrl: string;
  targetPlaylistName?: string;
  userId?: string;
  sessionId?: string;
  status:
    | 'pending'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: ImportProgress;
  result?: ImportResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  options: ImportOptions;
}

export interface ImportProgress {
  stage:
    | 'initializing'
    | 'validating'
    | 'extracting'
    | 'importing'
    | 'finalizing'
    | 'completed'
    | 'error';
  totalSteps: number;
  currentStep: number;
  percentage: number;
  currentOperation: string;
  videosTotal: number;
  videosProcessed: number;
  videosSkipped: number;
  videosFailed: number;
  estimatedTimeRemaining?: number;
  throughput?: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportResult {
  success: boolean;
  playlistId?: string;
  totalVideos: number;
  importedVideos: number;
  skippedVideos: number;
  failedVideos: number;
  duration: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  recoveryActions: string[];
}

export interface ImportError {
  code: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}

export interface ImportWarning {
  code: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  timestamp: Date;
}

export interface ImportOptions {
  skipUnavailableVideos: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  createNewPlaylist: boolean;
  overwriteExisting: boolean;
  preserveOrder: boolean;
  timeout: number;
  enableRecovery: boolean;
}

export interface RateLimitStatus {
  requestsInLastMinute: number;
  requestsInLastHour: number;
  isInCooldown: boolean;
  remainingRequests: {
    perMinute: number;
    perHour: number;
  };
}

// URL validation hook
export const useYouTubeUrlValidation = (
  url: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<ValidationResult>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.validation(url),
    queryFn: async () => {
      return await ipcClient.validateYouTubeUrl(url);
    },
    enabled: enabled && !!url && url.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry validation failures
    ...queryOptions,
  });
};

// Batch URL validation hook
export const useBatchYouTubeUrlValidation = (
  urls: string[],
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<ValidationResult[]>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.batchValidation(urls),
    queryFn: async () => {
      return await ipcClient.batchValidateYouTubeUrls(urls);
    },
    enabled: enabled && urls.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...queryOptions,
  });
};

// Playlist preview hook
export const useYouTubePlaylistPreview = (
  playlistId: string,
  options?: {
    enabled?: boolean;
  } & Omit<
    UseQueryOptions<YouTubePlaylistPreview | null>,
    'queryKey' | 'queryFn'
  >,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.preview(playlistId),
    queryFn: async () => {
      return await ipcClient.getYouTubePlaylistPreview(playlistId);
    },
    enabled: enabled && !!playlistId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Retry once for network issues
    ...queryOptions,
  });
};

// Rate limit status hook
export const useRateLimitStatus = (
  userId?: string,
  options?: Omit<UseQueryOptions<RateLimitStatus>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: youtubeKeys.rateLimit(userId),
    queryFn: async () => {
      return await ipcClient.getRateLimitStatus();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
};

// Import status hook
export const useImportStatus = (
  jobId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  } & Omit<UseQueryOptions<ImportJob | null>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, refetchInterval, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.importStatus(jobId),
    queryFn: async () => {
      return await ipcClient.getImportStatus(jobId);
    },
    enabled: enabled && !!jobId,
    staleTime: 1000, // 1 second
    refetchInterval: refetchInterval || 2000, // Refetch every 2 seconds by default
    ...queryOptions,
  });
};

// User imports hook
export const useUserImports = (
  userId: string,
  options?: {
    enabled?: boolean;
  } & Omit<UseQueryOptions<ImportJob[]>, 'queryKey' | 'queryFn'>,
) => {
  const { enabled = true, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.userImports(userId),
    queryFn: async () => {
      return await ipcClient.getUserImports(userId);
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    ...queryOptions,
  });
};

// Active imports hook
export const useActiveImports = (
  options?: {
    refetchInterval?: number;
  } & Omit<UseQueryOptions<ImportJob[]>, 'queryKey' | 'queryFn'>,
) => {
  const { refetchInterval, ...queryOptions } = options || {};

  return useQuery({
    queryKey: youtubeKeys.activeImports(),
    queryFn: async () => {
      return await ipcClient.getActiveImports();
    },
    staleTime: 1000, // 1 second
    refetchInterval: refetchInterval || 5000, // Refetch every 5 seconds
    ...queryOptions,
  });
};

// Import statistics hook
export const useImportStats = (
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: youtubeKeys.importStats(),
    queryFn: async () => {
      return await ipcClient.getImportStats();
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

// YouTube import mutations hook
export const useYouTubeImportMutations = () => {
  const queryClient = useQueryClient();

  // Start import mutation
  const startImport = useMutation({
    mutationFn: async (data: {
      playlistUrl: string;
      targetPlaylistName?: string;
      options?: Partial<ImportOptions>;
    }) => {
      return await ipcClient.startYouTubeImport(data);
    },
    onSuccess: jobId => {
      // Invalidate active imports to show the new job
      queryClient.invalidateQueries({ queryKey: youtubeKeys.activeImports() });
      queryClient.invalidateQueries({ queryKey: youtubeKeys.imports() });

      toast.success('Import started successfully');
      return jobId;
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to start import');
    },
  });

  // Cancel import mutation
  const cancelImport = useMutation({
    mutationFn: async (jobId: string) => {
      return await ipcClient.cancelYouTubeImport(jobId);
    },
    onSuccess: (_, jobId) => {
      // Invalidate import status and active imports
      queryClient.invalidateQueries({
        queryKey: youtubeKeys.importStatus(jobId),
      });
      queryClient.invalidateQueries({ queryKey: youtubeKeys.activeImports() });

      toast.success('Import cancelled');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to cancel import');
    },
  });

  // Pause import mutation
  const pauseImport = useMutation({
    mutationFn: async (jobId: string) => {
      return await ipcClient.pauseYouTubeImport(jobId);
    },
    onSuccess: (_, jobId) => {
      // Invalidate import status
      queryClient.invalidateQueries({
        queryKey: youtubeKeys.importStatus(jobId),
      });

      toast.success('Import paused');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to pause import');
    },
  });

  // Resume import mutation
  const resumeImport = useMutation({
    mutationFn: async (jobId: string) => {
      return await ipcClient.resumeYouTubeImport(jobId);
    },
    onSuccess: (_, jobId) => {
      // Invalidate import status and active imports
      queryClient.invalidateQueries({
        queryKey: youtubeKeys.importStatus(jobId),
      });
      queryClient.invalidateQueries({ queryKey: youtubeKeys.activeImports() });

      toast.success('Import resumed');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to resume import');
    },
  });

  // Retry import mutation
  const retryImport = useMutation({
    mutationFn: async (data: { jobId: string; recoveryOptions?: any }) => {
      return await ipcClient.retryYouTubeImport(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate import status and active imports
      queryClient.invalidateQueries({
        queryKey: youtubeKeys.importStatus(variables.jobId),
      });
      queryClient.invalidateQueries({ queryKey: youtubeKeys.activeImports() });

      toast.success('Import retry started');
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to retry import');
    },
  });

  // Cleanup jobs mutation
  const cleanupJobs = useMutation({
    mutationFn: async (olderThanHours?: number) => {
      return await ipcClient.cleanupImportJobs(olderThanHours);
    },
    onSuccess: cleanedCount => {
      // Invalidate all import-related queries
      queryClient.invalidateQueries({ queryKey: youtubeKeys.imports() });

      if (cleanedCount > 0) {
        toast.success(`Cleaned up ${cleanedCount} old import jobs`);
      }
    },
    onError: (error: any) => {
      toast.error(error.userMessage || 'Failed to cleanup import jobs');
    },
  });

  return {
    startImport,
    cancelImport,
    pauseImport,
    resumeImport,
    retryImport,
    cleanupJobs,
  };
};

// Real-time import updates hook
export const useImportUpdates = (
  onUpdate?: (event: any) => void,
  onComplete?: (event: any) => void,
  onError?: (event: any) => void,
) => {
  const queryClient = useQueryClient();

  const handleImportUpdate = useCallback(
    (event: any) => {
      const { type, data } = event;

      // Update query cache based on event type
      switch (type) {
        case 'importStarted':
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.activeImports(),
          });
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.importStatus(data.jobId),
          });
          break;

        case 'importProgress':
          // Update the specific import status in cache
          queryClient.setQueryData(
            youtubeKeys.importStatus(data.jobId),
            (oldData: ImportJob | null) => {
              if (oldData) {
                return { ...oldData, progress: data.progress };
              }
              return oldData;
            },
          );
          break;

        case 'importCompleted':
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.importStatus(data.jobId),
          });
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.activeImports(),
          });
          queryClient.invalidateQueries({
            queryKey: invalidationHelpers.afterImportCompletion(),
          });
          onComplete?.(event);
          break;

        case 'importFailed':
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.importStatus(data.jobId),
          });
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.activeImports(),
          });
          onError?.(event);
          break;

        case 'importCancelled':
        case 'importPaused':
        case 'importResumed':
        case 'importRetried':
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.importStatus(data.jobId),
          });
          queryClient.invalidateQueries({
            queryKey: youtubeKeys.activeImports(),
          });
          break;
      }

      onUpdate?.(event);
    },
    [queryClient, onUpdate, onComplete, onError],
  );

  useEffect(() => {
    // Subscribe to YouTube import events
    const unsubscribe =
      ipcClient.subscribeToYouTubeImportEvents(handleImportUpdate);

    return unsubscribe;
  }, [handleImportUpdate]);
};

// Import job management hook
export const useImportJobManager = (jobId: string) => {
  const { data: job, isLoading } = useImportStatus(jobId);
  const mutations = useYouTubeImportMutations();

  const canCancel = job?.status === 'running' || job?.status === 'pending';
  const canPause = job?.status === 'running';
  const canResume = job?.status === 'paused';
  const canRetry = job?.status === 'failed';

  const cancel = useCallback(() => {
    if (canCancel) {
      mutations.cancelImport.mutate(jobId);
    }
  }, [canCancel, mutations.cancelImport, jobId]);

  const pause = useCallback(() => {
    if (canPause) {
      mutations.pauseImport.mutate(jobId);
    }
  }, [canPause, mutations.pauseImport, jobId]);

  const resume = useCallback(() => {
    if (canResume) {
      mutations.resumeImport.mutate(jobId);
    }
  }, [canResume, mutations.resumeImport, jobId]);

  const retry = useCallback(
    (recoveryOptions?: any) => {
      if (canRetry) {
        mutations.retryImport.mutate({ jobId, recoveryOptions });
      }
    },
    [canRetry, mutations.retryImport, jobId],
  );

  return {
    job,
    isLoading,
    canCancel,
    canPause,
    canResume,
    canRetry,
    cancel,
    pause,
    resume,
    retry,
    isOperating:
      mutations.cancelImport.isPending ||
      mutations.pauseImport.isPending ||
      mutations.resumeImport.isPending ||
      mutations.retryImport.isPending,
  };
};

// Prefetch helpers for YouTube imports
export const useYouTubeImportPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchPlaylistPreview = (playlistId: string) => {
    return queryClient.prefetchQuery({
      queryKey: youtubeKeys.preview(playlistId),
      queryFn: async () => {
        return await ipcClient.getYouTubePlaylistPreview(playlistId);
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchImportStatus = (jobId: string) => {
    return queryClient.prefetchQuery({
      queryKey: youtubeKeys.importStatus(jobId),
      queryFn: async () => {
        return await ipcClient.getImportStatus(jobId);
      },
      staleTime: 1000,
    });
  };

  return {
    prefetchPlaylistPreview,
    prefetchImportStatus,
  };
};

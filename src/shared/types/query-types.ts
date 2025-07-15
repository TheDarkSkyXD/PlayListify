/**
 * TypeScript interfaces for React Query data structures
 * 
 * This file defines all the types used for data fetching, caching,
 * and state management throughout the application.
 */

// Base query result types
export interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  isFetching: boolean;
  isStale: boolean;
  refetch: () => Promise<any>;
}

export interface MutationResult<T, V = unknown> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  mutate: (variables: V) => void;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
}

// Loading states for different UI components
export interface LoadingState {
  isLoading: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
}

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string | null;
  canRetry: boolean;
  retryCount: number;
}

export interface EmptyState {
  isEmpty: boolean;
  emptyMessage: string;
  emptyAction?: {
    label: string;
    action: () => void;
  };
}

// Combined state for UI components
export interface UIState extends LoadingState, ErrorState, EmptyState {
  isReady: boolean;
}

// Application-specific query types
export interface AppVersionQuery {
  version: string;
  buildDate: string;
  environment: 'development' | 'production';
}

export interface DependencyStatusQuery {
  ytdlp: {
    installed: boolean;
    version?: string;
    path?: string;
    lastChecked: Date;
  };
  ffmpeg: {
    installed: boolean;
    version?: string;
    path?: string;
    lastChecked: Date;
  };
  allReady: boolean;
  isInitialized: boolean;
}

export interface SettingsQuery<T = any> {
  key: string;
  value: T;
  hasCustomValue: boolean;
  defaultValue: T;
}

export interface AllSettingsQuery {
  [key: string]: any;
  theme: 'light' | 'dark' | 'system';
  language: string;
  downloadLocation: string;
  tempDirectory: string;
  startMinimized: boolean;
  closeToTray: boolean;
  autoUpdate: boolean;
}

export interface FileSystemQuery {
  exists: boolean;
  path: string;
  stats?: {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: Date;
    modifiedAt: Date;
  };
}

export interface DirectoryListQuery {
  path: string;
  files: string[];
  directories: string[];
  totalItems: number;
}

// Future: Playlist-related query types (Phase 2)
export interface PlaylistQuery {
  id: number;
  title: string;
  description: string;
  type: 'YOUTUBE' | 'CUSTOM';
  videoCount: number;
  totalDuration: string;
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheck: Date;
}

export interface PlaylistListQuery {
  playlists: PlaylistQuery[];
  totalCount: number;
  hasMore: boolean;
}

export interface PlaylistVideosQuery {
  playlistId: number;
  videos: VideoQuery[];
  totalCount: number;
  hasMore: boolean;
}

export interface VideoQuery {
  id: string;
  title: string;
  channelName: string;
  duration: string;
  viewCount: number;
  uploadDate: Date;
  thumbnailURL: string;
  availabilityStatus: 'LIVE' | 'PUBLIC' | 'PRIVATE' | 'DELETED';
  downloadedQuality?: string;
  downloadPath?: string;
  isDownloaded: boolean;
}

export interface YouTubeMetadataQuery {
  url: string;
  title: string;
  description: string;
  channelName: string;
  videoCount: number;
  isPlaylist: boolean;
  thumbnailURL: string;
  videos: {
    id: string;
    title: string;
    duration: string;
    thumbnailURL: string;
  }[];
}

// Mutation input types
export interface CreatePlaylistMutation {
  title: string;
  description?: string;
  type: 'YOUTUBE' | 'CUSTOM';
}

export interface UpdatePlaylistMutation {
  id: number;
  title?: string;
  description?: string;
}

export interface ImportPlaylistMutation {
  url: string;
  title?: string;
  description?: string;
}

export interface DownloadVideoMutation {
  videoId: string;
  quality: string;
  format: 'mp4' | 'mp3';
  downloadPath?: string;
}

export interface UpdateSettingMutation<T = any> {
  key: string;
  value: T;
}

export interface InstallDependencyMutation {
  dependency: 'ytdlp' | 'ffmpeg';
  force?: boolean;
}

// Progress tracking types
export interface ProgressUpdate {
  id: string;
  type: 'download' | 'import' | 'install';
  progress: number;
  status: string;
  speed?: string;
  eta?: string;
  error?: string;
}

export interface TaskProgress {
  taskId: string;
  type: 'IMPORT_PLAYLIST' | 'DOWNLOAD_VIDEO' | 'INSTALL_DEPENDENCY';
  title: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  details?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search and filter types
export interface SearchParams {
  query: string;
  type?: 'playlist' | 'video' | 'all';
  filters?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    duration?: {
      min: number;
      max: number;
    };
    status?: string[];
  };
}

export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
}

// Cache invalidation types
export interface InvalidationTarget {
  queryKey: readonly unknown[];
  exact?: boolean;
  refetchType?: 'active' | 'inactive' | 'all';
}

export interface CacheUpdate<T> {
  queryKey: readonly unknown[];
  data: T;
  merge?: boolean;
}

// Error types specific to queries
export interface QueryError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, any>;
  retryable?: boolean;
}

export interface MutationError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, any>;
  field?: string;
  validation?: Record<string, string[]>;
}

// Optimistic update types
export interface OptimisticUpdate<T> {
  queryKey: readonly unknown[];
  updater: (old: T | undefined) => T;
  rollback?: (old: T | undefined) => T;
}

// Background sync types
export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  syncError?: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}
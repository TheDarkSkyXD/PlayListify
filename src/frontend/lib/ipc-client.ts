// src/frontend/lib/ipc-client.ts

import { ipcRenderer } from 'electron';

// IPC Response type (matches backend)
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    userMessage?: string;
    suggestions?: string[];
    recoverable?: boolean;
  };
  requestId?: string;
}

// IPC Request type (matches backend)
export interface IPCRequest<T = any> {
  data: T;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// Error class for IPC errors
export class IPCError extends Error {
  public readonly code: string;
  public readonly userMessage?: string;
  public readonly suggestions?: string[];
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: string,
    userMessage?: string,
    suggestions?: string[],
    recoverable: boolean = true,
  ) {
    super(message);
    this.name = 'IPCError';
    this.code = code;
    this.userMessage = userMessage;
    this.suggestions = suggestions;
    this.recoverable = recoverable;
  }
}

// IPC Client class
export class IPCClient {
  private userId?: string;
  private sessionId: string;

  constructor(userId?: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Set user ID for requests
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Make IPC request with error handling
   */
  private async request<TRequest, TResponse>(
    channel: string,
    data: TRequest,
  ): Promise<TResponse> {
    const requestId = this.generateRequestId();

    const request: IPCRequest<TRequest> = {
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      requestId,
    };

    try {
      const response: IPCResponse<TResponse> = await ipcRenderer.invoke(
        channel,
        request,
      );

      if (!response.success) {
        const error = response.error!;
        throw new IPCError(
          error.message,
          error.code,
          error.userMessage,
          error.suggestions,
          error.recoverable,
        );
      }

      return response.data!;
    } catch (error) {
      if (error instanceof IPCError) {
        throw error;
      }

      // Handle unexpected errors
      throw new IPCError(
        error instanceof Error ? error.message : String(error),
        'IPC_ERROR',
        'Communication with the application failed. Please try again.',
        ['Check your internet connection', 'Restart the application'],
        true,
      );
    }
  }

  // Playlist API methods

  /**
   * Create a new playlist
   */
  async createPlaylist(data: {
    name: string;
    description?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) {
    return this.request('playlist:create', data);
  }

  /**
   * Get playlist by ID
   */
  async getPlaylist(id: string, includeMetadata: boolean = false) {
    return this.request('playlist:get', { id, includeMetadata });
  }

  /**
   * Get all playlists
   */
  async getAllPlaylists() {
    return this.request('playlist:getAll', {});
  }

  /**
   * Update playlist
   */
  async updatePlaylist(data: {
    id: string;
    name?: string;
    description?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) {
    return this.request('playlist:update', data);
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(id: string) {
    return this.request('playlist:delete', { id });
  }

  /**
   * Search playlists
   */
  async searchPlaylists(query?: string, tags?: string[], isPrivate?: boolean) {
    return this.request('playlist:search', { query, tags, isPrivate });
  }

  /**
   * Duplicate playlist
   */
  async duplicatePlaylist(data: {
    sourceId: string;
    newName?: string;
    includeSongs?: boolean;
    includeMetadata?: boolean;
  }) {
    return this.request('playlist:duplicate', data);
  }

  /**
   * Get playlist statistics
   */
  async getPlaylistStats(playlistId: string) {
    return this.request('playlist:getStats', { playlistId });
  }

  /**
   * Get playlist songs
   */
  async getPlaylistSongs(playlistId: string) {
    return this.request('playlist:getSongs', { playlistId });
  }

  /**
   * Add song to playlist
   */
  async addSongToPlaylist(data: {
    playlistId: string;
    songId: string;
    position?: number;
  }) {
    return this.request('playlist:addSong', data);
  }

  /**
   * Remove song from playlist
   */
  async removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.request('playlist:removeSong', { playlistId, songId });
  }

  /**
   * Reorder song in playlist
   */
  async reorderSongInPlaylist(data: {
    playlistId: string;
    songId: string;
    newPosition: number;
  }) {
    return this.request('playlist:reorderSong', data);
  }

  /**
   * Get playlist with metadata
   */
  async getPlaylistWithMetadata(id: string) {
    return this.request('playlist:getWithMetadata', { id });
  }

  /**
   * Advanced playlist search
   */
  async searchPlaylistsAdvanced(criteria: any) {
    return this.request('playlist:searchAdvanced', criteria);
  }

  /**
   * Validate playlist integrity
   */
  async validatePlaylistIntegrity(playlistId: string) {
    return this.request('playlist:validateIntegrity', { playlistId });
  }

  /**
   * Get all tags
   */
  async getAllTags() {
    return this.request('playlist:getTags', {});
  }

  // Song API methods

  /**
   * Create a new song
   */
  async createSong(data: {
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    file_path?: string;
  }) {
    return this.request('song:create', data);
  }

  /**
   * Get song by ID
   */
  async getSong(id: string) {
    return this.request('song:get', { id });
  }

  /**
   * Get all songs
   */
  async getAllSongs() {
    return this.request('song:getAll', {});
  }

  /**
   * Update song
   */
  async updateSong(data: {
    id: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    file_path?: string;
  }) {
    return this.request('song:update', data);
  }

  /**
   * Delete song
   */
  async deleteSong(id: string) {
    return this.request('song:delete', { id });
  }

  /**
   * Search songs
   */
  async searchSongs(query: string) {
    return this.request('song:search', { query });
  }

  // YouTube API methods

  /**
   * Validate YouTube URL
   */
  async validateYouTubeUrl(url: string) {
    return this.request('youtube:validateUrl', { url });
  }

  /**
   * Batch validate YouTube URLs
   */
  async batchValidateYouTubeUrls(urls: string[]) {
    return this.request('youtube:batchValidateUrls', { urls });
  }

  /**
   * Get YouTube playlist preview
   */
  async getYouTubePlaylistPreview(playlistId: string) {
    return this.request('youtube:getPlaylistPreview', { playlistId });
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus() {
    return this.request('youtube:getRateLimitStatus', {});
  }

  /**
   * Start YouTube import
   */
  async startYouTubeImport(data: {
    playlistUrl: string;
    targetPlaylistName?: string;
    options?: any;
  }) {
    return this.request('youtube:startImport', data);
  }

  /**
   * Cancel YouTube import
   */
  async cancelYouTubeImport(jobId: string) {
    return this.request('youtube:cancelImport', { jobId });
  }

  /**
   * Pause YouTube import
   */
  async pauseYouTubeImport(jobId: string) {
    return this.request('youtube:pauseImport', { jobId });
  }

  /**
   * Resume YouTube import
   */
  async resumeYouTubeImport(jobId: string) {
    return this.request('youtube:resumeImport', { jobId });
  }

  /**
   * Retry YouTube import
   */
  async retryYouTubeImport(data: { jobId: string; recoveryOptions?: any }) {
    return this.request('youtube:retryImport', data);
  }

  /**
   * Get import status
   */
  async getImportStatus(jobId: string) {
    return this.request('youtube:getImportStatus', { jobId });
  }

  /**
   * Get user imports
   */
  async getUserImports(userId: string) {
    return this.request('youtube:getUserImports', { userId });
  }

  /**
   * Get active imports
   */
  async getActiveImports() {
    return this.request('youtube:getActiveImports', {});
  }

  /**
   * Get import statistics
   */
  async getImportStats() {
    return this.request('youtube:getImportStats', {});
  }

  /**
   * Cleanup old import jobs
   */
  async cleanupImportJobs(olderThanHours?: number) {
    return this.request('youtube:cleanupJobs', { olderThanHours });
  }

  // Event subscription methods

  /**
   * Subscribe to playlist events
   */
  subscribeToPlaylistEvents(callback: (event: any) => void): () => void {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('playlist-event', handler);

    return () => {
      ipcRenderer.removeListener('playlist-event', handler);
    };
  }

  /**
   * Subscribe to YouTube import events
   */
  subscribeToYouTubeImportEvents(callback: (event: any) => void): () => void {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('youtube-import-update', handler);

    return () => {
      ipcRenderer.removeListener('youtube-import-update', handler);
    };
  }

  // Utility methods

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global IPC client instance
export const ipcClient = new IPCClient();

// Development helpers
if (process.env.NODE_ENV === 'development') {
  (window as any).ipcClient = ipcClient;
}

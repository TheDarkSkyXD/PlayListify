// src/backend/ipc/playlist-ipc-handlers.ts

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { BaseError, ValidationError } from '../../shared/errors';
import { Playlist, Song } from '../models';
import {
  DatabaseService,
  PlaylistBusinessLogicService,
  PlaylistCrudService,
} from '../services';
import { StructuredLoggerService } from '../services/structured-logger-service';

// IPC Request/Response Types
export interface IPCRequest<T = any> {
  data: T;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

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

// Playlist Operation Types
export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface UpdatePlaylistRequest {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface DeletePlaylistRequest {
  id: string;
}

export interface GetPlaylistRequest {
  id: string;
  includeMetadata?: boolean;
}

export interface SearchPlaylistsRequest {
  query?: string;
  tags?: string[];
  isPrivate?: boolean;
  minSongCount?: number;
  maxSongCount?: number;
  limit?: number;
  offset?: number;
}

export interface DuplicatePlaylistRequest {
  sourceId: string;
  newName?: string;
  includeSongs?: boolean;
  includeMetadata?: boolean;
}

// Song Operation Types
export interface CreateSongRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface UpdateSongRequest {
  id: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface AddSongToPlaylistRequest {
  playlistId: string;
  songId: string;
  position?: number;
}

export interface RemoveSongFromPlaylistRequest {
  playlistId: string;
  songId: string;
}

export interface ReorderSongRequest {
  playlistId: string;
  songId: string;
  newPosition: number;
}

export class PlaylistIPCHandlers {
  private logger: StructuredLoggerService;
  private crudService: PlaylistCrudService;
  private businessLogicService: PlaylistBusinessLogicService;

  constructor(
    databaseService: DatabaseService,
    logger?: StructuredLoggerService,
  ) {
    this.logger = logger || new StructuredLoggerService();
    this.crudService = new PlaylistCrudService(
      databaseService.getPlaylistRepository(),
      databaseService.getSongRepository(),
    );
    this.businessLogicService = new PlaylistBusinessLogicService(
      this.crudService,
      databaseService.getPlaylistRepository(),
      databaseService.getSongRepository(),
    );
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    // Playlist CRUD operations
    ipcMain.handle('playlist:create', this.handleCreatePlaylist.bind(this));
    ipcMain.handle('playlist:get', this.handleGetPlaylist.bind(this));
    ipcMain.handle('playlist:getAll', this.handleGetAllPlaylists.bind(this));
    ipcMain.handle('playlist:update', this.handleUpdatePlaylist.bind(this));
    ipcMain.handle('playlist:delete', this.handleDeletePlaylist.bind(this));
    ipcMain.handle('playlist:search', this.handleSearchPlaylists.bind(this));
    ipcMain.handle(
      'playlist:duplicate',
      this.handleDuplicatePlaylist.bind(this),
    );
    ipcMain.handle('playlist:getStats', this.handleGetPlaylistStats.bind(this));

    // Song CRUD operations
    ipcMain.handle('song:create', this.handleCreateSong.bind(this));
    ipcMain.handle('song:get', this.handleGetSong.bind(this));
    ipcMain.handle('song:getAll', this.handleGetAllSongs.bind(this));
    ipcMain.handle('song:update', this.handleUpdateSong.bind(this));
    ipcMain.handle('song:delete', this.handleDeleteSong.bind(this));
    ipcMain.handle('song:search', this.handleSearchSongs.bind(this));

    // Playlist-Song relationship operations
    ipcMain.handle('playlist:getSongs', this.handleGetPlaylistSongs.bind(this));
    ipcMain.handle('playlist:addSong', this.handleAddSongToPlaylist.bind(this));
    ipcMain.handle(
      'playlist:removeSong',
      this.handleRemoveSongFromPlaylist.bind(this),
    );
    ipcMain.handle('playlist:reorderSong', this.handleReorderSong.bind(this));

    // Advanced operations
    ipcMain.handle(
      'playlist:getWithMetadata',
      this.handleGetPlaylistWithMetadata.bind(this),
    );
    ipcMain.handle(
      'playlist:searchAdvanced',
      this.handleAdvancedSearch.bind(this),
    );
    ipcMain.handle(
      'playlist:validateIntegrity',
      this.handleValidateIntegrity.bind(this),
    );
    ipcMain.handle('playlist:getTags', this.handleGetAllTags.bind(this));

    this.logger.info('Playlist IPC handlers registered');
  }

  /**
   * Unregister all IPC handlers
   */
  unregisterHandlers(): void {
    const channels = [
      'playlist:create',
      'playlist:get',
      'playlist:getAll',
      'playlist:update',
      'playlist:delete',
      'playlist:search',
      'playlist:duplicate',
      'playlist:getStats',
      'playlist:getSongs',
      'playlist:addSong',
      'playlist:removeSong',
      'playlist:reorderSong',
      'playlist:getWithMetadata',
      'playlist:searchAdvanced',
      'playlist:validateIntegrity',
      'playlist:getTags',
      'song:create',
      'song:get',
      'song:getAll',
      'song:update',
      'song:delete',
      'song:search',
    ];

    channels.forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });

    this.logger.info('Playlist IPC handlers unregistered');
  }

  // Playlist CRUD Handlers

  private async handleCreatePlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<CreatePlaylistRequest>,
  ): Promise<IPCResponse<Playlist>> {
    return this.executeWithErrorHandling(
      'playlist:create',
      request,
      async () => {
        if (request.data.tags || request.data.isPrivate !== undefined) {
          // Use business logic service for enhanced features
          return await this.businessLogicService.createPlaylistWithMetadata({
            name: request.data.name,
            description: request.data.description,
            tags: request.data.tags,
            isPrivate: request.data.isPrivate,
            createdBy: request.userId,
          });
        } else {
          // Use basic CRUD service
          return await this.crudService.createPlaylist({
            name: request.data.name,
            description: request.data.description,
          });
        }
      },
    );
  }

  private async handleGetPlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<GetPlaylistRequest>,
  ): Promise<IPCResponse<Playlist>> {
    return this.executeWithErrorHandling('playlist:get', request, async () => {
      if (request.data.includeMetadata) {
        return await this.businessLogicService.getPlaylistWithMetadata(
          request.data.id,
        );
      } else {
        return await this.crudService.getPlaylistById(request.data.id);
      }
    });
  }

  private async handleGetAllPlaylists(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<Playlist[]>> {
    return this.executeWithErrorHandling(
      'playlist:getAll',
      request,
      async () => {
        return await this.crudService.getPlaylistsWithStats();
      },
    );
  }

  private async handleUpdatePlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<UpdatePlaylistRequest>,
  ): Promise<IPCResponse<Playlist>> {
    return this.executeWithErrorHandling(
      'playlist:update',
      request,
      async () => {
        if (request.data.tags || request.data.isPrivate !== undefined) {
          // Use business logic service for enhanced features
          return await this.businessLogicService.updatePlaylistWithValidation(
            request.data.id,
            {
              name: request.data.name,
              description: request.data.description,
              tags: request.data.tags,
              isPrivate: request.data.isPrivate,
            },
          );
        } else {
          // Use basic CRUD service
          return await this.crudService.updatePlaylist(request.data.id, {
            name: request.data.name,
            description: request.data.description,
          });
        }
      },
    );
  }

  private async handleDeletePlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<DeletePlaylistRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'playlist:delete',
      request,
      async () => {
        return await this.crudService.deletePlaylist(request.data.id);
      },
    );
  }

  private async handleSearchPlaylists(
    event: IpcMainInvokeEvent,
    request: IPCRequest<SearchPlaylistsRequest>,
  ): Promise<IPCResponse<Playlist[]>> {
    return this.executeWithErrorHandling(
      'playlist:search',
      request,
      async () => {
        if (request.data.query) {
          return await this.crudService.searchPlaylists(request.data.query);
        } else {
          return await this.crudService.getAllPlaylists();
        }
      },
    );
  }

  private async handleDuplicatePlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<DuplicatePlaylistRequest>,
  ): Promise<IPCResponse<Playlist>> {
    return this.executeWithErrorHandling(
      'playlist:duplicate',
      request,
      async () => {
        return await this.businessLogicService.duplicatePlaylist(
          request.data.sourceId,
          request.data.newName,
          {
            includeSongs: request.data.includeSongs,
            includeMetadata: request.data.includeMetadata,
          },
        );
      },
    );
  }

  private async handleGetPlaylistStats(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ playlistId: string }>,
  ): Promise<IPCResponse<any>> {
    return this.executeWithErrorHandling(
      'playlist:getStats',
      request,
      async () => {
        return await this.businessLogicService.getPlaylistStatistics(
          request.data.playlistId,
        );
      },
    );
  }

  // Song CRUD Handlers

  private async handleCreateSong(
    event: IpcMainInvokeEvent,
    request: IPCRequest<CreateSongRequest>,
  ): Promise<IPCResponse<Song>> {
    return this.executeWithErrorHandling('song:create', request, async () => {
      return await this.crudService.createSong(request.data);
    });
  }

  private async handleGetSong(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ id: string }>,
  ): Promise<IPCResponse<Song>> {
    return this.executeWithErrorHandling('song:get', request, async () => {
      return await this.crudService.getSongById(request.data.id);
    });
  }

  private async handleGetAllSongs(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<Song[]>> {
    return this.executeWithErrorHandling('song:getAll', request, async () => {
      return await this.crudService.getAllSongs();
    });
  }

  private async handleUpdateSong(
    event: IpcMainInvokeEvent,
    request: IPCRequest<UpdateSongRequest>,
  ): Promise<IPCResponse<Song>> {
    return this.executeWithErrorHandling('song:update', request, async () => {
      const { id, ...updateData } = request.data;
      return await this.crudService.updateSong(id, updateData);
    });
  }

  private async handleDeleteSong(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ id: string }>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling('song:delete', request, async () => {
      return await this.crudService.deleteSong(request.data.id);
    });
  }

  private async handleSearchSongs(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ query: string }>,
  ): Promise<IPCResponse<Song[]>> {
    return this.executeWithErrorHandling('song:search', request, async () => {
      return await this.crudService.searchSongs(request.data.query);
    });
  }

  // Playlist-Song Relationship Handlers

  private async handleGetPlaylistSongs(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ playlistId: string }>,
  ): Promise<IPCResponse<Song[]>> {
    return this.executeWithErrorHandling(
      'playlist:getSongs',
      request,
      async () => {
        return await this.crudService.getPlaylistSongs(request.data.playlistId);
      },
    );
  }

  private async handleAddSongToPlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<AddSongToPlaylistRequest>,
  ): Promise<IPCResponse<void>> {
    return this.executeWithErrorHandling(
      'playlist:addSong',
      request,
      async () => {
        await this.crudService.addSongToPlaylist(request.data);
      },
    );
  }

  private async handleRemoveSongFromPlaylist(
    event: IpcMainInvokeEvent,
    request: IPCRequest<RemoveSongFromPlaylistRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'playlist:removeSong',
      request,
      async () => {
        return await this.crudService.removeSongFromPlaylist(
          request.data.playlistId,
          request.data.songId,
        );
      },
    );
  }

  private async handleReorderSong(
    event: IpcMainInvokeEvent,
    request: IPCRequest<ReorderSongRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'playlist:reorderSong',
      request,
      async () => {
        return await this.crudService.reorderSongInPlaylist(request.data);
      },
    );
  }

  // Advanced Operation Handlers

  private async handleGetPlaylistWithMetadata(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ id: string }>,
  ): Promise<IPCResponse<any>> {
    return this.executeWithErrorHandling(
      'playlist:getWithMetadata',
      request,
      async () => {
        return await this.businessLogicService.getPlaylistWithMetadata(
          request.data.id,
        );
      },
    );
  }

  private async handleAdvancedSearch(
    event: IpcMainInvokeEvent,
    request: IPCRequest<SearchPlaylistsRequest>,
  ): Promise<IPCResponse<Playlist[]>> {
    return this.executeWithErrorHandling(
      'playlist:searchAdvanced',
      request,
      async () => {
        return await this.businessLogicService.searchPlaylistsAdvanced(
          request.data,
        );
      },
    );
  }

  private async handleValidateIntegrity(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ playlistId: string }>,
  ): Promise<IPCResponse<any>> {
    return this.executeWithErrorHandling(
      'playlist:validateIntegrity',
      request,
      async () => {
        return await this.businessLogicService.validatePlaylistIntegrity(
          request.data.playlistId,
        );
      },
    );
  }

  private async handleGetAllTags(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<string[]>> {
    return this.executeWithErrorHandling(
      'playlist:getTags',
      request,
      async () => {
        return await this.businessLogicService.getAllTags();
      },
    );
  }

  // Utility Methods

  /**
   * Execute operation with comprehensive error handling
   */
  private async executeWithErrorHandling<T>(
    operation: string,
    request: IPCRequest,
    handler: () => Promise<T>,
  ): Promise<IPCResponse<T>> {
    const startTime = Date.now();

    try {
      // Log operation start
      this.logger.logUserAction(
        operation,
        request.userId || 'anonymous',
        request.sessionId || 'unknown',
        { requestId: request.requestId },
      );

      // Execute handler
      const result = await handler();

      // Log successful operation
      const duration = Date.now() - startTime;
      this.logger.info(`IPC operation completed: ${operation}`, {
        operation,
        duration,
        userId: request.userId,
        requestId: request.requestId,
      });

      return {
        success: true,
        data: result,
        requestId: request.requestId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      this.logger.error(
        `IPC operation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          operation,
          duration,
          userId: request.userId,
          requestId: request.requestId,
          requestData: this.sanitizeRequestData(request.data),
        },
      );

      // Format error for IPC response
      const formattedError = this.formatErrorForIPC(error);

      return {
        success: false,
        error: formattedError,
        requestId: request.requestId,
      };
    }
  }

  /**
   * Format error for IPC transmission
   */
  private formatErrorForIPC(error: any): {
    code: string;
    message: string;
    userMessage?: string;
    suggestions?: string[];
    recoverable?: boolean;
  } {
    if (error instanceof BaseError) {
      return {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        recoverable: error.recoverable,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        suggestions: [
          'Try refreshing the application',
          'Check your internet connection',
        ],
        recoverable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
    };
  }

  /**
   * Sanitize request data for logging (remove sensitive information)
   */
  private sanitizeRequestData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Validate request structure
   */
  private validateRequest<T>(request: IPCRequest<T>): void {
    if (!request) {
      throw new ValidationError('Request is required');
    }

    if (!request.data) {
      throw new ValidationError('Request data is required');
    }
  }
}

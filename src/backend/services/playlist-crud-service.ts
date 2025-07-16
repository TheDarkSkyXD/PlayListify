// src/backend/services/playlist-crud-service.ts

import { ZodError } from 'zod';
import {
  DatabaseError,
  InvalidPlaylistOperationError,
  PlaylistAlreadyExistsError,
  PlaylistNotFoundError,
  SongAlreadyInPlaylistError,
  SongNotFoundError,
  ValidationError,
} from '../../shared/errors';
import {
  Playlist,
  PlaylistWithStats,
  Song,
  SongWithPlaylistInfo,
} from '../models';
import { PlaylistRepository, SongRepository } from '../repositories';
import {
  AddSongToPlaylistInput,
  AddSongToPlaylistSchema,
  CreatePlaylistInput,
  CreatePlaylistSchema,
  CreateSongInput,
  CreateSongSchema,
  PlaylistIdSchema,
  ReorderSongInput,
  ReorderSongSchema,
  SearchInput,
  SearchSchema,
  SongIdSchema,
  UpdatePlaylistInput,
  UpdatePlaylistSchema,
  UpdateSongInput,
  UpdateSongSchema,
} from '../validation/playlist-schemas';

export class PlaylistCrudService {
  constructor(
    private playlistRepository: PlaylistRepository,
    private songRepository: SongRepository,
  ) {}

  /**
   * Validate input data using Zod schemas
   */
  private validateInput<T>(schema: any, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          `Validation failed: ${firstError.message}`,
          firstError.path.join('.'),
          { details: { zodErrors: error.errors } },
        );
      }
      throw error;
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(data: CreatePlaylistInput): Promise<Playlist> {
    // Validate input
    const validatedData = this.validateInput<CreatePlaylistInput>(
      CreatePlaylistSchema,
      data,
    );

    // Check for duplicate names
    const existingPlaylist = await this.playlistRepository.findByName(
      validatedData.name,
    );
    if (existingPlaylist) {
      throw new PlaylistAlreadyExistsError(
        `Playlist with name "${validatedData.name}" already exists`,
        validatedData.name,
      );
    }

    try {
      return await this.playlistRepository.create(validatedData);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get playlist by ID
   */
  async getPlaylistById(id: string): Promise<Playlist> {
    // Validate input
    const validatedId = this.validateInput<string>(PlaylistIdSchema, id);

    const playlist = await this.playlistRepository.findById(validatedId);
    if (!playlist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    return playlist;
  }

  /**
   * Get all playlists
   */
  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      return await this.playlistRepository.findAll();
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch playlists: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all playlists with statistics
   */
  async getPlaylistsWithStats(): Promise<PlaylistWithStats[]> {
    try {
      return await this.playlistRepository.findWithStats();
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch playlists with stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update playlist
   */
  async updatePlaylist(
    id: string,
    data: UpdatePlaylistInput,
  ): Promise<Playlist> {
    // Validate inputs
    const validatedId = this.validateInput<string>(PlaylistIdSchema, id);
    const validatedData = this.validateInput<UpdatePlaylistInput>(
      UpdatePlaylistSchema,
      data,
    );

    // Check if playlist exists
    const existingPlaylist =
      await this.playlistRepository.findById(validatedId);
    if (!existingPlaylist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    // Check for duplicate names if name is being updated
    if (validatedData.name && validatedData.name !== existingPlaylist.name) {
      const duplicatePlaylist = await this.playlistRepository.findByName(
        validatedData.name,
      );
      if (duplicatePlaylist) {
        throw new PlaylistAlreadyExistsError(
          `Playlist with name "${validatedData.name}" already exists`,
          validatedData.name,
        );
      }
    }

    try {
      const updatedPlaylist = await this.playlistRepository.update(
        validatedId,
        validatedData,
      );
      if (!updatedPlaylist) {
        throw new PlaylistNotFoundError(
          `Playlist with ID "${validatedId}" not found`,
          validatedId,
        );
      }
      return updatedPlaylist;
    } catch (error) {
      if (error instanceof PlaylistNotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(id: string): Promise<boolean> {
    // Validate input
    const validatedId = this.validateInput<string>(PlaylistIdSchema, id);

    // Check if playlist exists
    const existingPlaylist =
      await this.playlistRepository.findById(validatedId);
    if (!existingPlaylist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    try {
      return await this.playlistRepository.delete(validatedId);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Search playlists
   */
  async searchPlaylists(query: string): Promise<Playlist[]> {
    // Validate input
    const validatedQuery = this.validateInput<SearchInput>(SearchSchema, {
      query,
    });

    try {
      return await this.playlistRepository.search(validatedQuery.query);
    } catch (error) {
      throw new DatabaseError(
        `Failed to search playlists: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a new song
   */
  async createSong(data: CreateSongInput): Promise<Song> {
    // Validate input
    const validatedData = this.validateInput<CreateSongInput>(
      CreateSongSchema,
      data,
    );

    try {
      return await this.songRepository.create(validatedData);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to create song: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get song by ID
   */
  async getSongById(id: string): Promise<Song> {
    // Validate input
    const validatedId = this.validateInput<string>(SongIdSchema, id);

    const song = await this.songRepository.findById(validatedId);
    if (!song) {
      throw new SongNotFoundError(
        `Song with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    return song;
  }

  /**
   * Get all songs
   */
  async getAllSongs(): Promise<Song[]> {
    try {
      return await this.songRepository.findAll();
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch songs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update song
   */
  async updateSong(id: string, data: UpdateSongInput): Promise<Song> {
    // Validate inputs
    const validatedId = this.validateInput<string>(SongIdSchema, id);
    const validatedData = this.validateInput<UpdateSongInput>(
      UpdateSongSchema,
      data,
    );

    // Check if song exists
    const existingSong = await this.songRepository.findById(validatedId);
    if (!existingSong) {
      throw new SongNotFoundError(
        `Song with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    try {
      const updatedSong = await this.songRepository.update(
        validatedId,
        validatedData,
      );
      if (!updatedSong) {
        throw new SongNotFoundError(
          `Song with ID "${validatedId}" not found`,
          validatedId,
        );
      }
      return updatedSong;
    } catch (error) {
      if (error instanceof SongNotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update song: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete song
   */
  async deleteSong(id: string): Promise<boolean> {
    // Validate input
    const validatedId = this.validateInput<string>(SongIdSchema, id);

    // Check if song exists
    const existingSong = await this.songRepository.findById(validatedId);
    if (!existingSong) {
      throw new SongNotFoundError(
        `Song with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    try {
      return await this.songRepository.delete(validatedId);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete song: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Search songs
   */
  async searchSongs(query: string): Promise<Song[]> {
    // Validate input
    const validatedQuery = this.validateInput<SearchInput>(SearchSchema, {
      query,
    });

    try {
      return await this.songRepository.search(validatedQuery.query);
    } catch (error) {
      throw new DatabaseError(
        `Failed to search songs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get songs in a playlist
   */
  async getPlaylistSongs(playlistId: string): Promise<SongWithPlaylistInfo[]> {
    // Validate input
    const validatedId = this.validateInput<string>(
      PlaylistIdSchema,
      playlistId,
    );

    // Check if playlist exists
    const playlist = await this.playlistRepository.findById(validatedId);
    if (!playlist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedId}" not found`,
        validatedId,
      );
    }

    try {
      return await this.songRepository.findByPlaylistId(validatedId);
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch playlist songs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Add song to playlist
   */
  async addSongToPlaylist(data: AddSongToPlaylistInput): Promise<void> {
    // Validate input
    const validatedData = this.validateInput<AddSongToPlaylistInput>(
      AddSongToPlaylistSchema,
      data,
    );

    // Check if playlist exists
    const playlist = await this.playlistRepository.findById(
      validatedData.playlistId,
    );
    if (!playlist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedData.playlistId}" not found`,
        validatedData.playlistId,
      );
    }

    // Check if song exists
    const song = await this.songRepository.findById(validatedData.songId);
    if (!song) {
      throw new SongNotFoundError(
        `Song with ID "${validatedData.songId}" not found`,
        validatedData.songId,
      );
    }

    // Check if song is already in playlist
    const playlistSongs = await this.songRepository.findByPlaylistId(
      validatedData.playlistId,
    );
    const isAlreadyInPlaylist = playlistSongs.some(
      ps => ps.id === validatedData.songId,
    );
    if (isAlreadyInPlaylist) {
      throw new SongAlreadyInPlaylistError(
        `Song "${song.title}" is already in playlist "${playlist.name}"`,
        validatedData.songId,
        validatedData.playlistId,
      );
    }

    try {
      await this.songRepository.addToPlaylist(
        validatedData.playlistId,
        validatedData.songId,
        validatedData.position,
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to add song to playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Remove song from playlist
   */
  async removeSongFromPlaylist(
    playlistId: string,
    songId: string,
  ): Promise<boolean> {
    // Validate inputs
    const validatedPlaylistId = this.validateInput<string>(
      PlaylistIdSchema,
      playlistId,
    );
    const validatedSongId = this.validateInput<string>(SongIdSchema, songId);

    // Check if playlist exists
    const playlist =
      await this.playlistRepository.findById(validatedPlaylistId);
    if (!playlist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedPlaylistId}" not found`,
        validatedPlaylistId,
      );
    }

    // Check if song is in playlist
    const playlistSongs =
      await this.songRepository.findByPlaylistId(validatedPlaylistId);
    const songInPlaylist = playlistSongs.find(ps => ps.id === validatedSongId);
    if (!songInPlaylist) {
      throw new InvalidPlaylistOperationError(
        `Song is not in the specified playlist`,
        'remove_song',
      );
    }

    try {
      return await this.songRepository.removeFromPlaylist(
        validatedPlaylistId,
        validatedSongId,
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to remove song from playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Reorder song in playlist
   */
  async reorderSongInPlaylist(data: ReorderSongInput): Promise<boolean> {
    // Validate input
    const validatedData = this.validateInput<ReorderSongInput>(
      ReorderSongSchema,
      data,
    );

    // Check if playlist exists
    const playlist = await this.playlistRepository.findById(
      validatedData.playlistId,
    );
    if (!playlist) {
      throw new PlaylistNotFoundError(
        `Playlist with ID "${validatedData.playlistId}" not found`,
        validatedData.playlistId,
      );
    }

    // Check if song is in playlist
    const playlistSongs = await this.songRepository.findByPlaylistId(
      validatedData.playlistId,
    );
    const songInPlaylist = playlistSongs.find(
      ps => ps.id === validatedData.songId,
    );
    if (!songInPlaylist) {
      throw new InvalidPlaylistOperationError(
        `Song is not in the specified playlist`,
        'reorder_song',
      );
    }

    // Validate new position
    if (validatedData.newPosition > playlistSongs.length) {
      throw new ValidationError(
        `New position ${validatedData.newPosition} is greater than playlist length ${playlistSongs.length}`,
        'newPosition',
      );
    }

    try {
      return await this.songRepository.reorderInPlaylist(
        validatedData.playlistId,
        validatedData.songId,
        validatedData.newPosition,
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to reorder song in playlist: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

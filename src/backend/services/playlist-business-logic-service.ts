// src/backend/services/playlist-business-logic-service.ts

import {
  InvalidPlaylistOperationError,
  PlaylistAlreadyExistsError,
  ValidationError,
} from '../../shared/errors';
import { CreatePlaylistData, Playlist, UpdatePlaylistData } from '../models';
import { PlaylistRepository, SongRepository } from '../repositories';
import { PlaylistCrudService } from './playlist-crud-service';

export interface PlaylistMetadata {
  tags: string[];
  isPrivate: boolean;
  createdBy?: string;
  lastModified: string;
  statistics: {
    totalDuration: number;
    songCount: number;
    averageSongDuration: number;
    mostRecentlyAdded?: string;
  };
}

export interface PlaylistWithMetadata extends Playlist {
  metadata: PlaylistMetadata;
}

export interface PlaylistValidationRules {
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTagsPerPlaylist: number;
  maxTagLength: number;
  reservedNames: string[];
  allowDuplicateTitles: boolean;
}

export class PlaylistBusinessLogicService {
  private validationRules: PlaylistValidationRules = {
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    maxTagsPerPlaylist: 10,
    maxTagLength: 30,
    reservedNames: ['system', 'admin', 'default', 'temp', 'temporary'],
    allowDuplicateTitles: false,
  };

  constructor(
    private crudService: PlaylistCrudService,
    private playlistRepository: PlaylistRepository,
    private songRepository: SongRepository,
  ) {}

  /**
   * Update validation rules
   */
  updateValidationRules(rules: Partial<PlaylistValidationRules>): void {
    this.validationRules = { ...this.validationRules, ...rules };
  }

  /**
   * Get current validation rules
   */
  getValidationRules(): PlaylistValidationRules {
    return { ...this.validationRules };
  }

  /**
   * Validate playlist title with enhanced business rules
   */
  private async validatePlaylistTitle(
    title: string,
    excludeId?: string,
  ): Promise<void> {
    // Basic length validation
    if (title.length > this.validationRules.maxTitleLength) {
      throw new ValidationError(
        `Playlist title must be less than ${this.validationRules.maxTitleLength} characters`,
        'title',
      );
    }

    // Check for reserved names
    const normalizedTitle = title.toLowerCase().trim();
    if (this.validationRules.reservedNames.includes(normalizedTitle)) {
      throw new ValidationError(
        `"${title}" is a reserved name and cannot be used`,
        'title',
      );
    }

    // Check for uniqueness if required
    if (!this.validationRules.allowDuplicateTitles) {
      const existingPlaylist = await this.playlistRepository.findByName(title);
      if (existingPlaylist && existingPlaylist.id !== excludeId) {
        throw new PlaylistAlreadyExistsError(
          `Playlist with name "${title}" already exists`,
          title,
        );
      }
    }

    // Check for potentially problematic characters
    const problematicChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (problematicChars.test(title)) {
      throw new ValidationError(
        'Playlist title contains invalid characters',
        'title',
      );
    }
  }

  /**
   * Validate playlist tags
   */
  private validateTags(tags: string[]): void {
    if (tags.length > this.validationRules.maxTagsPerPlaylist) {
      throw new ValidationError(
        `Maximum ${this.validationRules.maxTagsPerPlaylist} tags allowed per playlist`,
        'tags',
      );
    }

    for (const tag of tags) {
      if (tag.length > this.validationRules.maxTagLength) {
        throw new ValidationError(
          `Tag "${tag}" exceeds maximum length of ${this.validationRules.maxTagLength} characters`,
          'tags',
        );
      }

      if (!/^[a-zA-Z0-9\-_\s]+$/.test(tag)) {
        throw new ValidationError(
          `Tag "${tag}" contains invalid characters. Only letters, numbers, hyphens, underscores, and spaces are allowed`,
          'tags',
        );
      }
    }

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()));
    if (uniqueTags.size !== tags.length) {
      throw new ValidationError('Duplicate tags are not allowed', 'tags');
    }
  }

  /**
   * Generate unique playlist name
   */
  async generateUniquePlaylistName(baseName: string): Promise<string> {
    let counter = 1;
    let uniqueName = baseName;

    while (true) {
      const existing = await this.playlistRepository.findByName(uniqueName);
      if (!existing) {
        return uniqueName;
      }

      counter++;
      uniqueName = `${baseName} (${counter})`;

      // Prevent infinite loops
      if (counter > 1000) {
        throw new InvalidPlaylistOperationError(
          'Unable to generate unique playlist name after 1000 attempts',
          'generate_unique_name',
        );
      }
    }
  }

  /**
   * Create playlist with enhanced validation and metadata
   */
  async createPlaylistWithMetadata(
    data: CreatePlaylistData & {
      tags?: string[];
      isPrivate?: boolean;
      createdBy?: string;
    },
  ): Promise<PlaylistWithMetadata> {
    // Enhanced validation
    await this.validatePlaylistTitle(data.name);

    if (data.tags) {
      this.validateTags(data.tags);
    }

    // Create the playlist
    const playlist = await this.crudService.createPlaylist({
      name: data.name,
      description: data.description,
    });

    // Create metadata
    const metadata: PlaylistMetadata = {
      tags: data.tags || [],
      isPrivate: data.isPrivate || false,
      createdBy: data.createdBy,
      lastModified: playlist.created_at,
      statistics: {
        totalDuration: 0,
        songCount: 0,
        averageSongDuration: 0,
      },
    };

    return {
      ...playlist,
      metadata,
    };
  }

  /**
   * Update playlist with enhanced validation
   */
  async updatePlaylistWithValidation(
    id: string,
    data: UpdatePlaylistData & {
      tags?: string[];
      isPrivate?: boolean;
    },
  ): Promise<PlaylistWithMetadata> {
    // Enhanced validation
    if (data.name) {
      await this.validatePlaylistTitle(data.name, id);
    }

    if (data.tags) {
      this.validateTags(data.tags);
    }

    // Update the playlist
    const playlist = await this.crudService.updatePlaylist(id, {
      name: data.name,
      description: data.description,
    });

    // Get current metadata and update
    const currentMetadata = await this.getPlaylistMetadata(id);
    const updatedMetadata: PlaylistMetadata = {
      ...currentMetadata,
      tags: data.tags !== undefined ? data.tags : currentMetadata.tags,
      isPrivate:
        data.isPrivate !== undefined
          ? data.isPrivate
          : currentMetadata.isPrivate,
      lastModified: new Date().toISOString(),
    };

    return {
      ...playlist,
      metadata: updatedMetadata,
    };
  }

  /**
   * Get playlist metadata
   */
  async getPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata> {
    // Get playlist songs to calculate statistics
    const songs = await this.crudService.getPlaylistSongs(playlistId);

    const totalDuration = songs.reduce(
      (sum, song) => sum + (song.duration || 0),
      0,
    );
    const songCount = songs.length;
    const averageSongDuration = songCount > 0 ? totalDuration / songCount : 0;
    const mostRecentlyAdded =
      songs.length > 0
        ? songs.sort(
            (a, b) =>
              new Date(b.added_at).getTime() - new Date(a.added_at).getTime(),
          )[0].added_at
        : undefined;

    // In a real implementation, you'd store metadata in the database
    // For now, we'll return computed metadata
    return {
      tags: [], // Would be retrieved from database
      isPrivate: false, // Would be retrieved from database
      lastModified: new Date().toISOString(),
      statistics: {
        totalDuration,
        songCount,
        averageSongDuration,
        mostRecentlyAdded,
      },
    };
  }

  /**
   * Get playlist with full metadata
   */
  async getPlaylistWithMetadata(id: string): Promise<PlaylistWithMetadata> {
    const playlist = await this.crudService.getPlaylistById(id);
    const metadata = await this.getPlaylistMetadata(id);

    return {
      ...playlist,
      metadata,
    };
  }

  /**
   * Duplicate playlist with unique name generation
   */
  async duplicatePlaylist(
    sourceId: string,
    newName?: string,
    options: {
      includeSongs?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<PlaylistWithMetadata> {
    const { includeSongs = true, includeMetadata = true } = options;

    // Get source playlist
    const sourcePlaylist = await this.getPlaylistWithMetadata(sourceId);

    // Generate unique name
    const baseName = newName || `${sourcePlaylist.name} (Copy)`;
    const uniqueName = await this.generateUniquePlaylistName(baseName);

    // Create new playlist
    const newPlaylist = await this.createPlaylistWithMetadata({
      name: uniqueName,
      description: sourcePlaylist.description,
      tags: includeMetadata ? sourcePlaylist.metadata.tags : [],
      isPrivate: includeMetadata ? sourcePlaylist.metadata.isPrivate : false,
    });

    // Copy songs if requested
    if (includeSongs) {
      const sourceSongs = await this.crudService.getPlaylistSongs(sourceId);

      for (const song of sourceSongs) {
        await this.crudService.addSongToPlaylist({
          playlistId: newPlaylist.id,
          songId: song.id,
          position: song.position,
        });
      }
    }

    return await this.getPlaylistWithMetadata(newPlaylist.id);
  }

  /**
   * Get playlist statistics
   */
  async getPlaylistStatistics(playlistId: string): Promise<{
    songCount: number;
    totalDuration: number;
    averageSongDuration: number;
    durationByArtist: Record<string, number>;
    songsByArtist: Record<string, number>;
    oldestSong?: { title: string; added_at: string };
    newestSong?: { title: string; added_at: string };
  }> {
    const songs = await this.crudService.getPlaylistSongs(playlistId);

    if (songs.length === 0) {
      return {
        songCount: 0,
        totalDuration: 0,
        averageSongDuration: 0,
        durationByArtist: {},
        songsByArtist: {},
      };
    }

    const totalDuration = songs.reduce(
      (sum, song) => sum + (song.duration || 0),
      0,
    );
    const averageSongDuration = totalDuration / songs.length;

    // Group by artist
    const durationByArtist: Record<string, number> = {};
    const songsByArtist: Record<string, number> = {};

    songs.forEach(song => {
      const artist = song.artist;
      durationByArtist[artist] =
        (durationByArtist[artist] || 0) + (song.duration || 0);
      songsByArtist[artist] = (songsByArtist[artist] || 0) + 1;
    });

    // Find oldest and newest songs
    const sortedByDate = [...songs].sort(
      (a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime(),
    );

    const oldestSong = sortedByDate[0];
    const newestSong = sortedByDate[sortedByDate.length - 1];

    return {
      songCount: songs.length,
      totalDuration,
      averageSongDuration,
      durationByArtist,
      songsByArtist,
      oldestSong: {
        title: oldestSong.title,
        added_at: oldestSong.added_at,
      },
      newestSong: {
        title: newestSong.title,
        added_at: newestSong.added_at,
      },
    };
  }

  /**
   * Search playlists with advanced filtering
   */
  async searchPlaylistsAdvanced(criteria: {
    query?: string;
    tags?: string[];
    isPrivate?: boolean;
    minSongCount?: number;
    maxSongCount?: number;
    minDuration?: number;
    maxDuration?: number;
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<PlaylistWithMetadata[]> {
    // Start with basic search if query provided
    let playlists: Playlist[] = [];

    if (criteria.query) {
      playlists = await this.crudService.searchPlaylists(criteria.query);
    } else {
      playlists = await this.crudService.getAllPlaylists();
    }

    // Get playlists with metadata and apply filters
    const playlistsWithMetadata = await Promise.all(
      playlists.map(p => this.getPlaylistWithMetadata(p.id)),
    );

    return playlistsWithMetadata.filter(playlist => {
      // Filter by tags
      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag =>
          playlist.metadata.tags.some(pTag =>
            pTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
        if (!hasAllTags) return false;
      }

      // Filter by privacy
      if (
        criteria.isPrivate !== undefined &&
        playlist.metadata.isPrivate !== criteria.isPrivate
      ) {
        return false;
      }

      // Filter by song count
      if (
        criteria.minSongCount !== undefined &&
        playlist.metadata.statistics.songCount < criteria.minSongCount
      ) {
        return false;
      }
      if (
        criteria.maxSongCount !== undefined &&
        playlist.metadata.statistics.songCount > criteria.maxSongCount
      ) {
        return false;
      }

      // Filter by duration
      if (
        criteria.minDuration !== undefined &&
        playlist.metadata.statistics.totalDuration < criteria.minDuration
      ) {
        return false;
      }
      if (
        criteria.maxDuration !== undefined &&
        playlist.metadata.statistics.totalDuration > criteria.maxDuration
      ) {
        return false;
      }

      // Filter by creation date
      if (
        criteria.createdAfter &&
        new Date(playlist.created_at) < new Date(criteria.createdAfter)
      ) {
        return false;
      }
      if (
        criteria.createdBefore &&
        new Date(playlist.created_at) > new Date(criteria.createdBefore)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get all unique tags across all playlists
   */
  async getAllTags(): Promise<string[]> {
    const playlists = await this.crudService.getAllPlaylists();
    const allTags = new Set<string>();

    for (const playlist of playlists) {
      const metadata = await this.getPlaylistMetadata(playlist.id);
      metadata.tags.forEach(tag => allTags.add(tag));
    }

    return Array.from(allTags).sort();
  }

  /**
   * Validate playlist relationships and dependencies
   */
  async validatePlaylistIntegrity(playlistId: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check if playlist exists
      const playlist = await this.crudService.getPlaylistById(playlistId);

      // Check songs in playlist
      const songs = await this.crudService.getPlaylistSongs(playlistId);

      // Validate song references
      for (const song of songs) {
        try {
          await this.crudService.getSongById(song.id);
        } catch (error) {
          issues.push(`Song "${song.title}" (ID: ${song.id}) no longer exists`);
          suggestions.push(`Remove invalid song reference from playlist`);
        }
      }

      // Check for position gaps or duplicates
      const positions = songs.map(s => s.position).sort((a, b) => a - b);
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i + 1) {
          issues.push(`Position gap or duplicate found at position ${i + 1}`);
          suggestions.push(`Reorder playlist to fix position sequence`);
          break;
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [
          `Playlist validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        suggestions: ['Check if playlist exists and is accessible'],
      };
    }
  }
}

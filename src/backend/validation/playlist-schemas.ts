// src/backend/validation/playlist-schemas.ts

import { z } from 'zod';

// Playlist validation schemas
export const CreatePlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
});

export const UpdatePlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
});

export const PlaylistIdSchema = z.string().min(1, 'Playlist ID is required');

// Song validation schemas
export const CreateSongSchema = z.object({
  title: z
    .string()
    .min(1, 'Song title is required')
    .max(200, 'Song title must be less than 200 characters')
    .trim(),
  artist: z
    .string()
    .min(1, 'Artist name is required')
    .max(100, 'Artist name must be less than 100 characters')
    .trim(),
  album: z
    .string()
    .max(100, 'Album name must be less than 100 characters')
    .trim()
    .optional(),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(0, 'Duration must be positive')
    .optional(),
  file_path: z.string().trim().optional(),
});

export const UpdateSongSchema = z.object({
  title: z
    .string()
    .min(1, 'Song title is required')
    .max(200, 'Song title must be less than 200 characters')
    .trim()
    .optional(),
  artist: z
    .string()
    .min(1, 'Artist name is required')
    .max(100, 'Artist name must be less than 100 characters')
    .trim()
    .optional(),
  album: z
    .string()
    .max(100, 'Album name must be less than 100 characters')
    .trim()
    .optional(),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(0, 'Duration must be positive')
    .optional(),
  file_path: z.string().trim().optional(),
});

export const SongIdSchema = z.string().min(1, 'Song ID is required');

// Playlist-Song relationship schemas
export const AddSongToPlaylistSchema = z.object({
  playlistId: PlaylistIdSchema,
  songId: SongIdSchema,
  position: z
    .number()
    .int('Position must be an integer')
    .min(1, 'Position must be at least 1')
    .optional(),
});

export const ReorderSongSchema = z.object({
  playlistId: PlaylistIdSchema,
  songId: SongIdSchema,
  newPosition: z
    .number()
    .int('Position must be an integer')
    .min(1, 'Position must be at least 1'),
});

// Search and filter schemas
export const SearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .trim(),
});

// Type exports
export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
export type CreateSongInput = z.infer<typeof CreateSongSchema>;
export type UpdateSongInput = z.infer<typeof UpdateSongSchema>;
export type AddSongToPlaylistInput = z.infer<typeof AddSongToPlaylistSchema>;
export type ReorderSongInput = z.infer<typeof ReorderSongSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;

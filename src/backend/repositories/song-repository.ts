// src/backend/repositories/song-repository.ts

import { DatabaseError } from '../../shared/errors';
import {
  CreateSongData,
  PlaylistSong,
  Song,
  SongWithPlaylistInfo,
  UpdateSongData,
} from '../models/song';
import { SQLiteAdapter } from '../sqlite-adapter';
import { BaseRepository } from './base-repository';

export class SongRepository extends BaseRepository<
  Song,
  CreateSongData,
  UpdateSongData
> {
  constructor(db: SQLiteAdapter) {
    super(db, 'songs');
  }

  async create(data: CreateSongData): Promise<Song> {
    const id = this.generateId();
    const timestamp = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO songs (id, title, artist, album, duration, file_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.executeRun(sql, [
      id,
      data.title,
      data.artist,
      data.album || null,
      data.duration || null,
      data.file_path || null,
      timestamp,
      timestamp,
    ]);

    const song = await this.findById(id);
    if (!song) {
      throw new DatabaseError('Failed to create song');
    }

    return song;
  }

  async findById(id: string): Promise<Song | null> {
    const sql = 'SELECT * FROM songs WHERE id = ?';
    const results = await this.executeQuery<Song>(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Song[]> {
    const sql = 'SELECT * FROM songs ORDER BY created_at DESC';
    return await this.executeQuery<Song>(sql);
  }

  async update(id: string, data: UpdateSongData): Promise<Song | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.artist !== undefined) {
      updates.push('artist = ?');
      params.push(data.artist);
    }

    if (data.album !== undefined) {
      updates.push('album = ?');
      params.push(data.album);
    }

    if (data.duration !== undefined) {
      updates.push('duration = ?');
      params.push(data.duration);
    }

    if (data.file_path !== undefined) {
      updates.push('file_path = ?');
      params.push(data.file_path);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    params.push(this.getCurrentTimestamp());
    params.push(id);

    const sql = `UPDATE songs SET ${updates.join(', ')} WHERE id = ?`;
    await this.executeRun(sql, params);

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM songs WHERE id = ?';
    const result = await this.executeRun(sql, [id]);
    return result.changes > 0;
  }

  async findByPlaylistId(playlistId: string): Promise<SongWithPlaylistInfo[]> {
    const sql = `
      SELECT 
        s.*,
        ps.position,
        ps.added_at
      FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
    `;
    return await this.executeQuery<SongWithPlaylistInfo>(sql, [playlistId]);
  }

  async addToPlaylist(
    playlistId: string,
    songId: string,
    position?: number,
  ): Promise<PlaylistSong> {
    // If no position specified, add to the end
    if (position === undefined) {
      const maxPositionSql =
        'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?';
      const maxResult = await this.executeQuery<{ max_pos: number | null }>(
        maxPositionSql,
        [playlistId],
      );
      position = (maxResult[0]?.max_pos || 0) + 1;
    }

    const timestamp = this.getCurrentTimestamp();
    const sql = `
      INSERT INTO playlist_songs (playlist_id, song_id, position, added_at)
      VALUES (?, ?, ?, ?)
    `;

    const result = await this.executeRun(sql, [
      playlistId,
      songId,
      position,
      timestamp,
    ]);

    return {
      id: result.lastInsertRowid as number,
      playlist_id: playlistId,
      song_id: songId,
      position,
      added_at: timestamp,
    };
  }

  async removeFromPlaylist(
    playlistId: string,
    songId: string,
  ): Promise<boolean> {
    const sql =
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?';
    const result = await this.executeRun(sql, [playlistId, songId]);
    return result.changes > 0;
  }

  async reorderInPlaylist(
    playlistId: string,
    songId: string,
    newPosition: number,
  ): Promise<boolean> {
    return this.db.transaction(() => {
      // Get current position
      const currentPosSql =
        'SELECT position FROM playlist_songs WHERE playlist_id = ? AND song_id = ?';
      const currentResult = this.db.db
        .prepare(currentPosSql)
        .get(playlistId, songId) as { position: number } | undefined;

      if (!currentResult) {
        return false;
      }

      const currentPosition = currentResult.position;

      if (currentPosition === newPosition) {
        return true;
      }

      // Update positions of other songs
      if (newPosition < currentPosition) {
        // Moving up - shift others down
        const shiftSql = `
          UPDATE playlist_songs 
          SET position = position + 1 
          WHERE playlist_id = ? AND position >= ? AND position < ?
        `;
        this.db.db
          .prepare(shiftSql)
          .run(playlistId, newPosition, currentPosition);
      } else {
        // Moving down - shift others up
        const shiftSql = `
          UPDATE playlist_songs 
          SET position = position - 1 
          WHERE playlist_id = ? AND position > ? AND position <= ?
        `;
        this.db.db
          .prepare(shiftSql)
          .run(playlistId, currentPosition, newPosition);
      }

      // Update the target song's position
      const updateSql =
        'UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?';
      this.db.db.prepare(updateSql).run(newPosition, playlistId, songId);

      return true;
    });
  }

  async search(query: string): Promise<Song[]> {
    const sql = `
      SELECT * FROM songs 
      WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
      ORDER BY created_at DESC
    `;
    const searchTerm = `%${query}%`;
    return await this.executeQuery<Song>(sql, [
      searchTerm,
      searchTerm,
      searchTerm,
    ]);
  }
}

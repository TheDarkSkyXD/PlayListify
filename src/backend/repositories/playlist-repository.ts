// src/backend/repositories/playlist-repository.ts

import { DatabaseError } from '../../shared/errors';
import {
  CreatePlaylistData,
  Playlist,
  PlaylistWithStats,
  UpdatePlaylistData,
} from '../models/playlist';
import { SQLiteAdapter } from '../sqlite-adapter';
import { BaseRepository } from './base-repository';

export class PlaylistRepository extends BaseRepository<
  Playlist,
  CreatePlaylistData,
  UpdatePlaylistData
> {
  constructor(db: SQLiteAdapter) {
    super(db, 'playlists');
  }

  async create(data: CreatePlaylistData): Promise<Playlist> {
    const id = this.generateId();
    const timestamp = this.getCurrentTimestamp();

    const sql = `
      INSERT INTO playlists (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.executeRun(sql, [
      id,
      data.name,
      data.description || null,
      timestamp,
      timestamp,
    ]);

    const playlist = await this.findById(id);
    if (!playlist) {
      throw new DatabaseError('Failed to create playlist');
    }

    return playlist;
  }

  async findById(id: string): Promise<Playlist | null> {
    const sql = 'SELECT * FROM playlists WHERE id = ?';
    const results = await this.executeQuery<Playlist>(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Playlist[]> {
    const sql = 'SELECT * FROM playlists ORDER BY created_at DESC';
    return await this.executeQuery<Playlist>(sql);
  }

  async update(id: string, data: UpdatePlaylistData): Promise<Playlist | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    params.push(this.getCurrentTimestamp());
    params.push(id);

    const sql = `UPDATE playlists SET ${updates.join(', ')} WHERE id = ?`;
    await this.executeRun(sql, params);

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM playlists WHERE id = ?';
    const result = await this.executeRun(sql, [id]);
    return result.changes > 0;
  }

  async findByName(name: string): Promise<Playlist | null> {
    const sql = 'SELECT * FROM playlists WHERE name = ?';
    const results = await this.executeQuery<Playlist>(sql, [name]);
    return results.length > 0 ? results[0] : null;
  }

  async findWithStats(): Promise<PlaylistWithStats[]> {
    const sql = `
      SELECT 
        p.*,
        COUNT(ps.song_id) as video_count,
        COALESCE(SUM(s.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      LEFT JOIN songs s ON ps.song_id = s.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return await this.executeQuery<PlaylistWithStats>(sql);
  }

  async search(query: string): Promise<Playlist[]> {
    const sql = `
      SELECT * FROM playlists 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
    `;
    const searchTerm = `%${query}%`;
    return await this.executeQuery<Playlist>(sql, [searchTerm, searchTerm]);
  }
}

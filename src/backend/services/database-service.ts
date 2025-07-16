// src/backend/services/database-service.ts

import { DatabaseConnectionError } from '../../shared/errors';
import { DatabaseConfig, DatabaseManager } from '../database-manager';
import { PlaylistRepository } from '../repositories/playlist-repository';
import { SongRepository } from '../repositories/song-repository';

export class DatabaseService {
  private manager: DatabaseManager;
  private playlistRepository: PlaylistRepository | null = null;
  private songRepository: SongRepository | null = null;

  constructor(config: DatabaseConfig) {
    this.manager = new DatabaseManager(config);
  }

  /**
   * Initialize database service
   */
  async initialize(): Promise<void> {
    await this.manager.initialize();

    const adapter = this.manager.getAdapter();
    this.playlistRepository = new PlaylistRepository(adapter);
    this.songRepository = new SongRepository(adapter);
  }

  /**
   * Get playlist repository
   */
  getPlaylistRepository(): PlaylistRepository {
    if (!this.playlistRepository) {
      throw new DatabaseConnectionError('Database service not initialized');
    }
    return this.playlistRepository;
  }

  /**
   * Get song repository
   */
  getSongRepository(): SongRepository {
    if (!this.songRepository) {
      throw new DatabaseConnectionError('Database service not initialized');
    }
    return this.songRepository;
  }

  /**
   * Check if database is healthy
   */
  async isHealthy(): Promise<boolean> {
    return await this.manager.checkHealth();
  }

  /**
   * Get database statistics
   */
  async getStats() {
    return await this.manager.getStats();
  }

  /**
   * Create database backup
   */
  async createBackup(backupName?: string): Promise<string> {
    return await this.manager.createBackup(backupName);
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    await this.manager.restoreFromBackup(backupPath);

    // Reinitialize repositories after restore
    const adapter = this.manager.getAdapter();
    this.playlistRepository = new PlaylistRepository(adapter);
    this.songRepository = new SongRepository(adapter);
  }

  /**
   * List available backups
   */
  listBackups(): string[] {
    return this.manager.listBackups();
  }

  /**
   * Optimize database
   */
  async optimize(): Promise<void> {
    await this.manager.optimize();
  }

  /**
   * Close database service
   */
  async close(): Promise<void> {
    await this.manager.close();
    this.playlistRepository = null;
    this.songRepository = null;
  }
}

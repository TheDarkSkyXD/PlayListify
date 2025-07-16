// src/backend/database-manager.ts

import fs from 'fs';
import path from 'path';
import { DatabaseConnectionError, DatabaseError } from '../shared/errors';
import { SQLiteAdapter } from './sqlite-adapter';

export interface DatabaseConfig {
  dbPath: string;
  backupPath?: string;
  maxConnections?: number;
  healthCheckInterval?: number;
}

export class DatabaseManager {
  private adapter: SQLiteAdapter | null = null;
  private config: DatabaseConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isHealthy: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = {
      maxConnections: 10,
      healthCheckInterval: 30000, // 30 seconds
      backupPath: path.join(path.dirname(config.dbPath), 'backups'),
      ...config,
    };
  }

  /**
   * Initialize database connection and schema
   */
  async initialize(): Promise<void> {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create database connection
      this.adapter = new SQLiteAdapter(this.config.dbPath);

      // Initialize schema
      this.adapter.initializeSchema();

      // Start health checks
      this.startHealthChecks();

      this.isHealthy = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseConnectionError(
        `Failed to initialize database: ${message}`,
      );
    }
  }

  /**
   * Get database adapter instance
   */
  getAdapter(): SQLiteAdapter {
    if (!this.adapter) {
      throw new DatabaseConnectionError('Database not initialized');
    }
    return this.adapter;
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }

    try {
      // Simple query to test connection
      await this.adapter.query('SELECT 1');
      this.isHealthy = true;
      return true;
    } catch (error) {
      this.isHealthy = false;
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get current health status
   */
  isHealthyStatus(): boolean {
    return this.isHealthy;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.checkHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(backupName?: string): Promise<string> {
    if (!this.adapter) {
      throw new DatabaseConnectionError('Database not initialized');
    }

    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupPath!)) {
        fs.mkdirSync(this.config.backupPath!, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = backupName || `backup-${timestamp}.db`;
      const backupPath = path.join(this.config.backupPath!, filename);

      // Use SQLite backup API for consistent backup
      const backupDb = new (require('better-sqlite3'))(backupPath);
      this.adapter.db.backup(backupDb);
      backupDb.close();

      return backupPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Backup failed: ${message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new DatabaseError(`Backup file not found: ${backupPath}`);
    }

    try {
      // Close current connection
      if (this.adapter) {
        this.adapter.close();
      }

      // Copy backup file to main database location
      fs.copyFileSync(backupPath, this.config.dbPath);

      // Reinitialize connection
      await this.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Restore failed: ${message}`);
    }
  }

  /**
   * List available backups
   */
  listBackups(): string[] {
    if (!fs.existsSync(this.config.backupPath!)) {
      return [];
    }

    try {
      return fs
        .readdirSync(this.config.backupPath!)
        .filter(file => file.endsWith('.db'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.config.backupPath!, a));
          const statB = fs.statSync(path.join(this.config.backupPath!, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Optimize database (VACUUM, ANALYZE)
   */
  async optimize(): Promise<void> {
    if (!this.adapter) {
      throw new DatabaseConnectionError('Database not initialized');
    }

    try {
      // VACUUM reclaims unused space
      this.adapter.db.exec('VACUUM');

      // ANALYZE updates query planner statistics
      this.adapter.db.exec('ANALYZE');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Optimization failed: ${message}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    size: number;
    pageCount: number;
    pageSize: number;
    freePages: number;
    tables: Array<{ name: string; rowCount: number }>;
  }> {
    if (!this.adapter) {
      throw new DatabaseConnectionError('Database not initialized');
    }

    try {
      const stats = fs.statSync(this.config.dbPath);
      const pragmaResults = await Promise.all([
        this.adapter.query<{ page_count: number }>('PRAGMA page_count'),
        this.adapter.query<{ page_size: number }>('PRAGMA page_size'),
        this.adapter.query<{ freelist_count: number }>('PRAGMA freelist_count'),
        this.adapter.query<{ name: string }>(
          'SELECT name FROM sqlite_master WHERE type="table"',
        ),
      ]);

      const [pageCountResult, pageSizeResult, freelistResult, tablesResult] =
        pragmaResults;

      // Get row counts for each table
      const tables = await Promise.all(
        tablesResult.map(async table => {
          const countResult = await this.adapter!.query<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${table.name}`,
          );
          return {
            name: table.name,
            rowCount: countResult[0]?.count || 0,
          };
        }),
      );

      return {
        size: stats.size,
        pageCount: pageCountResult[0]?.page_count || 0,
        pageSize: pageSizeResult[0]?.page_size || 0,
        freePages: freelistResult[0]?.freelist_count || 0,
        tables,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Failed to get stats: ${message}`);
    }
  }

  /**
   * Close database connection and cleanup
   */
  async close(): Promise<void> {
    this.stopHealthChecks();

    if (this.adapter) {
      this.adapter.close();
      this.adapter = null;
    }

    this.isHealthy = false;
  }
}

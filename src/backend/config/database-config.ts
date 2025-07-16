// src/backend/config/database-config.ts

import { app } from 'electron';
import path from 'path';
import { DatabaseConfig } from '../database-manager';

/**
 * Get default database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const userDataPath = app?.getPath('userData') || './data';

  const dbPath = isDevelopment
    ? path.join(process.cwd(), 'data', 'playlists-dev.db')
    : path.join(userDataPath, 'playlists.db');

  const backupPath = isDevelopment
    ? path.join(process.cwd(), 'data', 'backups')
    : path.join(userDataPath, 'backups');

  return {
    dbPath,
    backupPath,
    maxConnections: 10,
    healthCheckInterval: 30000, // 30 seconds
  };
}

/**
 * Get test database configuration
 */
export function getTestDatabaseConfig(): DatabaseConfig {
  return {
    dbPath: ':memory:', // In-memory database for tests
    maxConnections: 1,
    healthCheckInterval: 60000, // 1 minute for tests
  };
}

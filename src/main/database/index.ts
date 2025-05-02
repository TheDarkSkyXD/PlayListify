// import Database from 'better-sqlite3';
import Database from './sqlite-adapter';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';
import logger from '../services/logService';

// Database version for migrations
const DB_VERSION = 1;

// Define database file path
const getDbPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'playlistify.db');
};

// Define type for app_meta row
interface AppMetaRow {
  key: string;
  value: string;
}

// Initialize database connection
export const initDatabase = async (): Promise<Database> => {
  try {
    // Ensure the directory exists
    const dbPath = getDbPath();
    fs.ensureDirSync(path.dirname(dbPath));
    logger.info(`Using database at ${dbPath}`);

    // Create or open the database
    const db = new Database(dbPath);
    
    // Enable foreign keys
    await db.pragma('foreign_keys = ON');
    logger.info('Foreign key constraints enabled');
    
    // Check if this is a new database (needs initialization)
    const tableExists = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_meta'")
      .get();
    
    if (!tableExists) {
      logger.info('Initializing new database with schema');
      // Initialize new database with schema
      await initializeSchema(db);
      
      // Save the current version
      await db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('version', DB_VERSION.toString());
      logger.info(`Database initialized at version ${DB_VERSION}`);
    } else {
      // Check version and run migrations if needed
      const versionRow = await db.prepare("SELECT value FROM app_meta WHERE key='version'").get() as AppMetaRow | undefined;
      const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;
      
      if (currentVersion < DB_VERSION) {
        logger.info(`Migrating database from version ${currentVersion} to ${DB_VERSION}`);
        // Run migrations
        await runMigrations(db, currentVersion, DB_VERSION);
        logger.info(`Database migrated to version ${DB_VERSION}`);
      } else {
        logger.info(`Database already at version ${currentVersion}, no migration needed`);
      }
    }
    
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Initialize schema for a new database
const initializeSchema = async (db: Database): Promise<void> => {
  try {
    // Read schema from schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema SQL
    await db.exec(schemaSQL);
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database schema:', error);
    throw error;
  }
};

// Run migrations to update database schema when needed
const runMigrations = async (db: Database, fromVersion: number, toVersion: number): Promise<void> => {
  try {
    // For now, we'll just apply the full schema which includes "IF NOT EXISTS" clauses
    // In a future version, we could implement more sophisticated migrations
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema SQL (safe because of IF NOT EXISTS)
    await db.exec(schemaSQL);
    
    // Update the stored version
    await db.prepare("UPDATE app_meta SET value = ? WHERE key = 'version'").run(toVersion.toString());
    logger.info(`Database migrated from version ${fromVersion} to ${toVersion}`);
  } catch (error) {
    logger.error(`Failed to migrate database from version ${fromVersion} to ${toVersion}:`, error);
    throw error;
  }
};

// Export a singleton instance
export const getDatabase = (() => {
  let db: Database | null = null;
  
  return async (): Promise<Database> => {
    if (!db) {
      db = await initDatabase();
    }
    return db;
  };
})(); 
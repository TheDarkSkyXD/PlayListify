import path from 'path';
import fsExtra from 'fs-extra';
import { app } from 'electron';
import { logger } from '../utils/logger';

let dbInstance: SQLiteDatabase | null = null;

const MIGRATIONS_DIR_NAME = 'migrations';
import Database from 'better-sqlite3';
import type { Database as SQLiteDatabase } from 'better-sqlite3';

function applyMigrations(db: SQLiteDatabase, migrationsPath: string): void {
  logger.info('[DB Migrations] Starting migration check...');

  // --- TEMPORARY DEBUG LOGGING ---
  // const specificMigrationFile = '001_add_sourceurl_to_playlists.sql';
  // const specificMigrationPath = path.join(migrationsPath, specificMigrationFile);
  // if (fsExtra.existsSync(specificMigrationPath)) {
  //   logger.info(`[DB Migrations - DEBUG] CONFIRMED: Migration file exists at: ${specificMigrationPath}`);
  // } else {
  //   logger.error(`[DB Migrations - DEBUG] NOT FOUND: Migration file NOT found at: ${specificMigrationPath}`);
  //   // Log contents of the migrations directory if it exists
  //   if (fsExtra.existsSync(migrationsPath)) {
  //     try {
  //       const filesInDir = fsExtra.readdirSync(migrationsPath);
  //       logger.info(`[DB Migrations - DEBUG] Files in migrations dir (${migrationsPath}): ${filesInDir.join(', ')}`);
  //     } catch (readDirError: any) {
  //       logger.error(`[DB Migrations - DEBUG] Error reading migrations directory ${migrationsPath}: ${readDirError.message}`);
  //     }
  //   } else {
  //     logger.error(`[DB Migrations - DEBUG] Migrations directory itself also not found at ${migrationsPath}`);
  //   }
  // }
  // --- END TEMPORARY DEBUG LOGGING ---

  try {
    if (!fsExtra.existsSync(migrationsPath)) {
      logger.info(`[DB Migrations] Migrations directory not found at ${migrationsPath}, skipping migrations.`);
      fsExtra.ensureDirSync(migrationsPath);
      logger.info(`[DB Migrations] Created migrations directory at ${migrationsPath}.`);
      // continue to look for migration files (there may already be some on disk)
    }

    const migrationFiles = fsExtra.readdirSync(migrationsPath)
      .filter((file: string) => file.endsWith('.sql'))
      .sort(); // Ensure migrations are applied in order

    if (migrationFiles.length === 0) {
      logger.info('[DB Migrations] No migration files found, skipping migrations.');
      return;
    }

    // Check for user_version pragma. If not set, initialize to 0.
    let currentVersion = db.pragma('user_version', { simple: true }) as number;
    if (currentVersion === undefined || currentVersion === null) { // SQLite might return null
        logger.info('[DB Migrations] user_version not set, initializing to 0.');
        db.pragma(`user_version = 0`);
        currentVersion = 0;
    }
    logger.info(`[DB Migrations] Current database schema version: ${currentVersion}`);

    for (const file of migrationFiles) {
      const fileVersion = parseInt(file.split('_')[0]);
      if (isNaN(fileVersion)) {
        logger.warn(`[DB Migrations] Migration file ${file} has an invalid version prefix. Skipping.`);
        continue;
      }

      if (fileVersion > currentVersion) {
        logger.info(`[DB Migrations] Applying migration: ${file}`);
        try {
          const migrationSql = fsExtra.readFileSync(path.join(migrationsPath, file), 'utf-8');
          db.exec(migrationSql); // Execute the whole SQL file
          db.pragma(`user_version = ${fileVersion}`); // Update schema version
          logger.info(`[DB Migrations] Successfully applied ${file}. Database schema version now: ${fileVersion}`);
        } catch (err: any) {
          logger.error(`[DB Migrations] Error applying migration ${file}: ${err.message}`);
          // Decide on error handling: stop all migrations or continue with others?
          // For now, let's stop to prevent further issues.
          throw new Error(`Migration ${file} failed: ${err.message}`); 
        }
      }
    }
    logger.info('[DB Migrations] All applicable migrations processed.');
  } catch (error: any) {
    logger.error(`[DB Migrations] Failed to apply migrations: ${error.message}`);
    // Optionally re-throw or handle as appropriate for your application's startup
    // throw error; 
  }
}

export function initializeDB(): Database.Database {
  if (dbInstance) {
    logger.info('[DB] Database already initialized.');
    return dbInstance;
  }

  // Determine the project root. app.getAppPath() is reliable once the app is packaged.
  // For development, process.cwd() might be more appropriate if running from the project root.
  // Let's try to be robust.
  const projectRoot = app.isPackaged ? path.dirname(app.getAppPath()) : process.cwd();
  
  // --- MODIFIED PATH --- 
  // Point directly to the database file in the project's src/backend/databases directory
  const dbPath = path.join(projectRoot, 'src', 'backend', 'databases', 'playlistify.db');
  // --- END MODIFIED PATH ---

  const schemaPath = path.join(projectRoot, 'src', 'backend', 'databases', 'schema.sql');
  const migrationsPath = path.join(projectRoot, 'src', 'backend', 'databases', MIGRATIONS_DIR_NAME);

  logger.info(`[DB] PROJECT ROOT determined as: ${projectRoot}`);
  logger.info(`[DB] Initializing database connection at (PROJECT RELATIVE): ${dbPath}`);
  logger.info(`[DB] Expecting schema file at (PROJECT RELATIVE): ${schemaPath}`);
  logger.info(`[DB] Expecting migrations directory at (PROJECT RELATIVE): ${migrationsPath}`);

  try {
    // Ensure the schema file exists as a sanity check for correct pathing
    if (!fsExtra.existsSync(schemaPath)) {
      logger.error(`[DB] Schema file NOT FOUND at: ${schemaPath}. This indicates a serious pathing or project structure issue.`);
      throw new Error(`Schema file not found at ${schemaPath}. Cannot initialize database.`);
    }

    // Ensure the directory for the DB exists (src/backend/databases/)
    const dbFileDir = path.dirname(dbPath);
    fsExtra.ensureDirSync(dbFileDir); // Create it if it doesn't exist

    // Log whether the DB file itself already existed before opening
    // const dbAlreadyExisted = fsExtra.existsSync(dbPath);

    dbInstance = new Database(dbPath, { verbose: logger.info }); // Log all statements
    // if (!dbAlreadyExisted) {
    //   logger.info('[DB] New database file created at project path.');
    // } else {
    //   logger.info('[DB] Opened existing database file at project path.');
    // }

    dbInstance.pragma('journal_mode = WAL');
    logger.info('[DB] Database connection established and WAL mode set.');

    // Create tables based on schema.sql if they don't exist
    logger.info(`[DB] Attempting to apply schema from: ${schemaPath}`);
    const schemaSql = fsExtra.readFileSync(schemaPath, 'utf-8');
    if (dbInstance) { 
      const currentDB = dbInstance; // Assign to a new constant for type narrowing
      currentDB.transaction(() => {
        currentDB.exec(schemaSql);
      })(); // Immediately invoke the transaction
    } else {
      // This case should ideally not be reached if initialization logic is correct
      logger.error('[DB] dbInstance is null before attempting to apply schema. This is unexpected.');
      throw new Error('Database instance is null before schema application.');
    }
    logger.info('[DB] Database schema applied successfully (or tables already existed).');

    // Attempt to create the specific index separately
    if (dbInstance) {
      try {
        const indexSql = 'CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlistId_position ON playlist_videos (playlistId, position);';
        dbInstance.exec(indexSql);
        logger.info('[DB] Successfully created idx_playlist_videos_playlistId_position index.');
      } catch (indexError: any) {
        logger.error(`[DB] Error creating idx_playlist_videos_playlistId_position index: ${indexError.message}`);
        // Decide if this is critical enough to throw. For now, just log.
      }
    }

    // Apply migrations
    applyMigrations(dbInstance, migrationsPath);

    logger.info('[DB] Database initialized successfully.');
    return dbInstance;
  } catch (error: any) {
    logger.error(`[DB] Failed to initialize database: ${error.message}`, error);
    throw error; // Re-throw the error to halt app initialization if DB setup fails
  }
}

export function getDB(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDB first.');
  }
  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      logger.info('[DB] Database connection closed.');
    } catch (error: any) {
      logger.error(`[DB] Error closing the database: ${error.message}`, error);
    }
  }
} 
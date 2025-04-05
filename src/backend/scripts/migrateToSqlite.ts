import * as migrationUtils from '../utils/migrationUtils';
import * as dbManager from '../services/databaseManager';
import { backupBeforeMigration } from './backupBeforeMigration';
import { app } from 'electron';

/**
 * Migrate all playlists from file system to SQLite database
 */
async function migrateToSqlite() {
  console.log('Starting migration to SQLite...');

  try {
    // Create a backup before migration
    console.log('Creating backup before migration...');
    const backupDir = await backupBeforeMigration();
    console.log(`Backup created at: ${backupDir}`);

    // Initialize the database
    dbManager.initDatabase();
    console.log('Database initialized');

    // Migrate all playlists
    const result = await migrationUtils.migrateAllPlaylists();

    console.log('Migration completed with the following results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Playlists migrated: ${result.migrated}`);
    console.log(`- Playlists failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Verify migration
    console.log('\nVerifying migration...');
    const verification = await migrationUtils.verifyMigration();

    console.log(`Verification result: ${verification.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Playlists in files: ${verification.playlistsInFiles}`);
    console.log(`- Playlists in database: ${verification.playlistsInDb}`);
    console.log(`- Videos in files: ${verification.videosInFiles}`);
    console.log(`- Videos in database: ${verification.videosInDb}`);

    if (verification.missingPlaylists.length > 0) {
      console.log('Missing playlists:');
      verification.missingPlaylists.forEach((playlist, index) => {
        console.log(`  ${index + 1}. ${playlist}`);
      });
    }

    if (verification.missingVideos.length > 0) {
      console.log('Missing videos:');
      verification.missingVideos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video}`);
      });
    }

    // Get database stats
    const stats = dbManager.getDatabaseStats();
    console.log('\nDatabase statistics:');
    console.log(`- Playlists: ${stats.playlistCount}`);
    console.log(`- Videos: ${stats.videoCount}`);
    console.log(`- Downloaded videos: ${stats.downloadedVideoCount}`);
    console.log(`- Total video size: ${(stats.totalVideoSize / (1024 * 1024)).toFixed(2)} MB`);

    // Close the database
    dbManager.closeDatabase();

    console.log('\nMigration process completed.');
  } catch (error: any) {
    console.error('Migration failed:', error);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  // Wait for app to be ready
  if (app.isReady()) {
    migrateToSqlite();
  } else {
    app.on('ready', () => {
      migrateToSqlite();
    });
  }
}

export { migrateToSqlite };

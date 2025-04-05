import { getDatabase } from '../services/databaseManager';

/**
 * Optimize the database by creating indexes and running VACUUM
 * This should be called periodically to maintain database performance
 */
export function optimizeDatabase(): boolean {
  try {
    const db = getDatabase();

    // Create indexes for common queries

    // Index for playlist searches
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_playlists_name ON playlists(name);
    `);

    // Index for video searches
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);
    `);

    // Index for video URLs
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_url ON videos(url);
    `);

    // Index for downloaded videos
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_downloaded ON videos(downloaded);
    `);

    // Index for video status
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
    `);

    // Index for video download status
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_download_status ON videos(downloadStatus);
    `);

    // Index for video added date
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_added_at ON videos(addedAt);
    `);

    // Index for playlist tags
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_playlist_tags_tag_id ON playlist_tags(tagId);
    `);

    // Run ANALYZE to update statistics
    db.exec('ANALYZE;');

    // Run VACUUM to compact the database
    // This can take a while for large databases
    db.exec('VACUUM;');

    return true;
  } catch (error) {
    console.error('Failed to optimize database:', error);
    return false;
  }
}

/**
 * Get database statistics
 * @returns Object with database statistics
 */
export function getDatabaseStats() {
  try {
    const db = getDatabase();

    // Get database file size
    const pageCount = db.pragma('page_count', { simple: true }) as number;
    const pageSize = db.pragma('page_size', { simple: true }) as number;
    const dbInfo = pageCount * pageSize;
    const dbSizeInMB = dbInfo / (1024 * 1024);

    // Get table counts
    const playlistCount = db.prepare('SELECT COUNT(*) as count FROM playlists').get() as { count: number };
    const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number };
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };

    // Get downloaded video count and size
    const downloadedVideos = db.prepare('SELECT COUNT(*) as count, SUM(fileSize) as totalSize FROM videos WHERE downloaded = 1').get() as { count: number, totalSize: number | null };
    const downloadedCount = downloadedVideos.count;
    const downloadedSizeInMB = (downloadedVideos.totalSize || 0) / (1024 * 1024);

    // Get video status counts
    const videoStatusCounts = db.prepare(`
      SELECT downloadStatus, COUNT(*) as count
      FROM videos
      GROUP BY downloadStatus
    `).all();

    // Get most recent activity
    const recentPlaylists = db.prepare(`
      SELECT id, name, updatedAt
      FROM playlists
      ORDER BY updatedAt DESC
      LIMIT 5
    `).all();

    return {
      databaseSize: {
        bytes: dbInfo,
        megabytes: dbSizeInMB.toFixed(2)
      },
      counts: {
        playlists: playlistCount,
        videos: videoCount,
        tags: tagCount,
        downloadedVideos: downloadedCount
      },
      downloadedSize: {
        bytes: downloadedVideos.totalSize || 0,
        megabytes: downloadedSizeInMB.toFixed(2)
      },
      videoStatus: videoStatusCounts,
      recentActivity: recentPlaylists
    };
  } catch (error) {
    console.error('Failed to get database statistics:', error);
    return null;
  }
}

/**
 * Check database integrity
 * @returns Object with integrity check results
 */
export function checkDatabaseIntegrity() {
  try {
    const db = getDatabase();

    // Run integrity check
    const integrityCheck = db.pragma('integrity_check', { simple: false }) as string[];

    // Check foreign keys
    const foreignKeyCheck = db.pragma('foreign_key_check', { simple: false }) as any[];

    return {
      integrityCheck,
      foreignKeyCheck,
      hasIssues: integrityCheck.length > 1 || foreignKeyCheck.length > 0
    };
  } catch (error: any) {
    console.error('Failed to check database integrity:', error);
    return {
      integrityCheck: ['Error checking integrity'],
      foreignKeyCheck: [],
      hasIssues: true,
      error: error.message
    };
  }
}

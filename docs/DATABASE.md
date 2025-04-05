# PlayListify Database Documentation

PlayListify uses SQLite as the default and only storage method for playlist and video metadata, while keeping the actual video files on the filesystem. This hybrid approach provides efficient metadata querying with optimal storage for large files.

## Recent Changes

1. **SQLite as Default Storage**: The application now exclusively uses SQLite for metadata storage, removing the file-based storage option.
2. **Composite Primary Key**: The videos table now uses a composite primary key of `(id, playlistId)` instead of just `id`, allowing the same video to be added to multiple playlists.
3. **Database Optimization**: Added indexes for common queries and optimization functions for better performance.
4. **Database Backup UI**: Added a user interface for database backup and restore operations.
5. **Automatic Migration**: Added automatic migration from file-based storage to SQLite on first launch.

## Database Schema

### Tables

#### Playlists Table

```sql
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  source TEXT,
  sourceUrl TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

#### Videos Table

```sql
CREATE TABLE videos (
  id TEXT NOT NULL,
  playlistId TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER,
  fileSize INTEGER,
  downloaded BOOLEAN NOT NULL DEFAULT 0,
  downloadPath TEXT,
  format TEXT,
  addedAt TEXT NOT NULL,
  status TEXT,
  downloadStatus TEXT,
  PRIMARY KEY (id, playlistId),
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE
);
```

#### Tags Table

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL
);
```

#### Playlist Tags Table

```sql
CREATE TABLE playlist_tags (
  playlistId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (playlistId, tagId),
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);
```

### Indexes

The database includes the following indexes for improved performance:

- `idx_videos_playlist`: Index on `videos.playlistId` for faster playlist video lookups
- `idx_playlists_name`: Index on `playlists.name` for faster playlist searches
- `idx_videos_title`: Index on `videos.title` for faster video searches
- `idx_videos_url`: Index on `videos.url` for faster video URL lookups
- `idx_videos_downloaded`: Index on `videos.downloaded` for faster downloaded video lookups
- `idx_videos_status`: Index on `videos.status` for faster video status lookups
- `idx_videos_download_status`: Index on `videos.downloadStatus` for faster download status lookups
- `idx_videos_added_at`: Index on `videos.addedAt` for faster date-based lookups
- `idx_playlist_tags_tag_id`: Index on `playlist_tags.tagId` for faster tag lookups

## Database Location

### Development Mode

In development mode, the database is stored in the `database` folder in the project root directory. This makes it easier to access and manage during development.

```
/database/playlistify.db
```

### Production Mode

In production mode, the database is stored in the user's data directory:

- Windows: `%APPDATA%\playlistify\playlists\playlistify.db`
- macOS: `~/Library/Application Support/playlistify/playlists/playlistify.db`
- Linux: `~/.config/playlistify/playlists/playlistify.db`

## Database Management

### Backup and Restore

The application provides functionality to backup and restore the database. Backups are stored in the `backups` directory within the database directory.

### Optimization

The database is automatically optimized on application startup. This includes:

1. Creating indexes for common queries
2. Running ANALYZE to update statistics
3. Running VACUUM to compact the database

### Migration

When upgrading from file-based storage to SQLite, the application automatically migrates existing playlists and videos to the database. This process includes:

1. Creating a backup of the existing playlists
2. Initializing the database
3. Migrating all playlists and videos to the database
4. Marking the migration as completed

## Database API

The application provides a set of API functions for interacting with the database:

### Database Information

```typescript
window.api.database.getInfo()
```

Returns information about the database, including:
- Path to the database file
- Database size
- Table counts
- Integrity check results

### Database Backup

```typescript
window.api.database.backup()
```

Creates a backup of the database and returns information about the backup.

### Database Restore

```typescript
window.api.database.restore(backupPath)
```

Restores the database from a backup and restarts the application.

### List Backups

```typescript
window.api.database.listBackups()
```

Returns a list of available database backups.

### Optimize Database

```typescript
window.api.database.optimize()
```

Optimizes the database by creating indexes and running VACUUM.

## Composite Primary Key for Videos

The videos table uses a composite primary key of `(id, playlistId)` instead of just `id`. This allows the same video to be added to multiple playlists without causing UNIQUE constraint errors.

### Benefits of Composite Primary Key

1. **Multiple Playlists**: The same video can be added to multiple playlists.
2. **Playlist-Specific Metadata**: Each video entry can have playlist-specific metadata (e.g., download status).
3. **Efficient Queries**: Queries can efficiently filter videos by both video ID and playlist ID.
4. **Data Integrity**: Foreign key constraints ensure that videos are associated with valid playlists.

### Implementation Details

The composite primary key is implemented in the database schema as follows:

```sql
CREATE TABLE videos (
  id TEXT NOT NULL,
  playlistId TEXT NOT NULL,
  -- other fields...
  PRIMARY KEY (id, playlistId),
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE
);
```

When adding a video to a playlist, the application first checks if the video already exists in that playlist:

```typescript
// Check if the video already exists in this playlist
const existingVideo = db.prepare(
  'SELECT * FROM videos WHERE id = ? AND playlistId = ?'
).get(video.id, playlistId);

if (existingVideo) {
  // Video already exists in this playlist, return it
  return existingVideo;
}

// Insert the video if it doesn't exist
```

## Error Handling

The database manager includes robust error handling to prevent crashes when database operations fail. If a database operation fails, the application will log the error and continue running.

## Performance Considerations

1. **WAL Mode**: The database uses Write-Ahead Logging (WAL) mode for better performance.
2. **Indexes**: The database includes indexes for common queries to improve performance.
3. **Synchronous Mode**: The database uses NORMAL synchronous mode for a balance of performance and safety.
4. **Foreign Keys**: The database uses foreign key constraints to maintain data integrity.

## Future Improvements

1. **Database Monitoring**: Add functionality for monitoring database size and performance.
2. **Database Maintenance**: Add functionality for compacting and optimizing the database.
3. **Database Backup UI**: Add a UI for backing up and restoring the database.
4. **Database Migration**: Improve the migration process to handle edge cases.
5. **Database Versioning**: Add support for database schema versioning and upgrades.

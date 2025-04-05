# SQLite Implementation for Playlistify

This document describes the implementation of SQLite for storing playlists and videos in Playlistify.

## Overview

Playlistify now uses better-sqlite3 to store playlist and video metadata in a SQLite database. This provides several benefits over the previous file-based approach:

1. **Improved Performance**: Faster queries, especially for large playlists
2. **Better Data Integrity**: Transaction support prevents data corruption
3. **Simplified Management**: Single database file instead of many JSON files
4. **Advanced Querying**: More powerful search and filtering capabilities
5. **Future Scalability**: Better foundation for adding features like search, filtering, and sorting

## Database Schema

The database schema consists of the following tables:

### Playlists Table

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

### Videos Table

```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
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
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE
);
```

### Tags Table

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

### Playlist-Tags Relationship Table

```sql
CREATE TABLE playlist_tags (
  playlistId TEXT NOT NULL,
  tagId INTEGER NOT NULL,
  PRIMARY KEY (playlistId, tagId),
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);
```

## Implementation Details

### Database Manager

The `databaseManager.ts` file provides a comprehensive API for interacting with the SQLite database:

- **initDatabase()**: Initializes the database connection and creates tables if they don't exist
- **closeDatabase()**: Closes the database connection
- **createPlaylist()**: Creates a new playlist
- **getPlaylistById()**: Retrieves a playlist by ID
- **getAllPlaylists()**: Retrieves all playlists
- **updatePlaylist()**: Updates a playlist
- **deletePlaylist()**: Deletes a playlist
- **addVideo()**: Adds a video to a playlist
- **updateVideo()**: Updates a video
- **deleteVideo()**: Deletes a video
- **searchPlaylists()**: Searches for playlists by name, description, video title, or tags
- **getDatabaseStats()**: Gets statistics about the database

### Migration Utility

The `migrationUtils.ts` file provides utilities for migrating from the file-based approach to SQLite:

- **migrateAllPlaylists()**: Migrates all playlists from the file system to SQLite
- **migratePlaylist()**: Migrates a single playlist
- **verifyMigration()**: Verifies that the migration was successful

### Playlist Manager

The `playlistManagerDb.ts` file provides a high-level API for managing playlists and videos, using the database manager internally:

- **createEmptyPlaylist()**: Creates a new empty playlist
- **importYoutubePlaylist()**: Imports a YouTube playlist
- **getAllPlaylists()**: Retrieves all playlists
- **getPlaylistById()**: Retrieves a playlist by ID
- **deletePlaylist()**: Deletes a playlist
- **updatePlaylist()**: Updates a playlist
- **addVideoToPlaylist()**: Adds a video to a playlist
- **removeVideoFromPlaylist()**: Removes a video from a playlist
- **downloadPlaylistVideo()**: Downloads a video from a playlist
- **refreshYoutubePlaylist()**: Refreshes a YouTube playlist
- **searchPlaylists()**: Searches for playlists
- **getDatabaseStats()**: Gets statistics about the database

## Migration Process

To migrate from the file-based approach to SQLite, run the following command:

```bash
npm run migrate:sqlite
```

This will:

1. Initialize the SQLite database
2. Migrate all playlists and videos from the file system to SQLite
3. Verify that the migration was successful
4. Display statistics about the migrated data

## Benefits of SQLite

### Performance

SQLite provides significant performance improvements, especially for large playlists:

- Faster playlist retrieval
- Efficient video filtering and sorting
- Reduced memory usage
- Better handling of concurrent operations

### Data Integrity

SQLite's transaction support ensures that operations either complete fully or not at all, preventing data corruption if the application crashes during a write operation.

### Advanced Querying

SQLite allows for complex queries that would be difficult to implement with the file-based approach:

- Finding all playlists containing a specific video
- Sorting playlists by various criteria
- Filtering videos by multiple attributes
- Performing full-text search on video titles or descriptions

### Future Enhancements

The SQLite implementation provides a solid foundation for future enhancements:

- Full-text search for playlists and videos
- Advanced filtering and sorting options
- Playlist statistics and analytics
- Better performance for large libraries

## File Storage

While playlist and video metadata are stored in SQLite, the actual video files are still stored on the filesystem. The database stores the file paths, providing a hybrid approach that gives the best of both worlds: efficient metadata querying with SQLite and efficient large file storage with the filesystem.

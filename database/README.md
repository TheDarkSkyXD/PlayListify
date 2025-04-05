# PlayListify Database

This folder contains the SQLite database used by PlayListify during development.

PlayListify uses SQLite to store playlist and video metadata for improved performance, while keeping the actual video files on the filesystem. This hybrid approach provides efficient metadata querying with optimal storage for large files.

## Database Files

- `playlistify.db`: The main database file
- `playlistify.db-wal`: Write-Ahead Log file (created when the database is in use)
- `playlistify.db-shm`: Shared Memory file (created when the database is in use)
- `backups/`: Directory containing database backups

## Database Schema

The database schema includes the following tables:

- `playlists`: Stores playlist metadata
- `videos`: Stores video metadata and download information
- `tags`: Stores tag metadata
- `playlist_tags`: Junction table for playlist-tag relationships

## Database Management

You can manage the database using the following npm scripts:

```bash
# Show database information
npm run db:info

# Create a database backup
npm run db:backup

# Restore a database backup
npm run db:restore [backup-file]

# Clear the database (delete all data)
npm run db:clear

# Reset the database (delete and recreate)
npm run db:reset
```

## Migration

To migrate from file-based storage to SQLite, use:

```bash
npm run migrate:sqlite
```

## Testing

To test the database implementation, use:

```bash
npm run test:sqlite
```

## Development vs. Production

During development, the database is stored in this folder for easy access and debugging.

In production, the database is stored in the user's data directory:
- Windows: `%APPDATA%\playlistify\playlists\playlistify.db`
- macOS: `~/Library/Application Support/playlistify/playlists/playlistify.db`
- Linux: `~/.config/playlistify/playlists/playlistify.db`

# PlayListify

PlayListify is an all-in-one solution for saving YouTube playlists, downloading videos, and organizing your media collection. It features a modern user interface, SQLite database for efficient metadata storage, and a hybrid approach that keeps video files on the filesystem for optimal performance.

## Features

- **YouTube Playlist Import**: Import playlists from YouTube with a simple URL
- **Custom Playlists**: Create your own playlists and add videos from YouTube
- **Video Download**: Download videos for offline viewing
- **Playlist Management**: Organize your videos into playlists
- **Video Player**: Built-in video player for watching your videos
- **Dark Mode**: Toggle between light and dark themes
- **Database Backup**: Backup and restore your playlist database

## Recent Updates

1. **SQLite as Default Storage**: The application now exclusively uses SQLite for metadata storage, providing better performance and reliability.
2. **Composite Primary Key**: Videos can now be added to multiple playlists without conflicts.
3. **Database Optimization**: Added indexes and optimization functions for better performance.
4. **Database Backup UI**: Added a user interface for database backup and restore operations.
5. **Improved Folder Structure**: Renamed 'main' to 'backend' and 'renderer' to 'frontend' for clarity.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): Overview of the application architecture
- [Database](docs/DATABASE.md): Information about the database structure and operations
- [Development](docs/DEVELOPMENT.md): Guidelines for developers

## Development

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

See the [Development Guide](docs/DEVELOPMENT.md) for more detailed instructions.

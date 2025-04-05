# Changelog

All notable changes to the PlayListify project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Database backup and restore UI in the settings page
- Database optimization functions for better performance
- Automatic database migration from file-based storage to SQLite
- Comprehensive documentation (ARCHITECTURE.md, DATABASE.md, DEVELOPMENT.md)
- Database statistics and monitoring

### Changed
- SQLite is now the default and only storage method for metadata
- Videos table now uses a composite primary key (id, playlistId) to allow the same video in multiple playlists
- Renamed folder structure from 'main'/'renderer' to 'backend'/'frontend' for clarity
- Updated TypeScript types for better type safety
- Improved error handling in database operations

### Fixed
- Fixed UNIQUE constraint error when adding the same video to multiple playlists
- Fixed TypeScript errors in database optimization functions
- Fixed import path errors in main.ts and renderer.tsx
- Fixed function signature mismatches in playlistServiceProvider.ts
- Fixed error in deleteVideo function call in testDatabaseManager.ts

## [1.0.0] - 2023-06-01

### Added
- Initial release of PlayListify
- YouTube playlist import functionality
- Custom playlist creation
- Video downloading
- Playlist management
- Video player
- Dark mode support
- Settings management

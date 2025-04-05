# PlayListify Architecture

This document provides an overview of the PlayListify application architecture, including the folder structure, key components, and data flow.

## Application Structure

PlayListify is an Electron application with a React frontend. The application is structured into two main parts:

1. **Backend**: The Electron main process that handles file system operations, YouTube downloads, and database management.
2. **Frontend**: The Electron renderer process that provides the user interface using React.

### Folder Structure

```
PlayListify/
├── database/                 # SQLite database files and backups
├── docs/                     # Documentation files
├── logs/                     # Application logs
├── scripts/                  # Utility scripts for development and maintenance
├── src/                      # Source code
│   ├── backend/              # Electron main process code
│   │   ├── database/         # Database configuration and optimization
│   │   ├── ipc/              # IPC handlers for communication with the frontend
│   │   ├── scripts/          # Backend utility scripts
│   │   ├── services/         # Core services (playlist, YouTube, settings, etc.)
│   │   └── utils/            # Utility functions
│   ├── frontend/             # Electron renderer process code (React)
│   │   ├── components/       # Reusable UI components
│   │   ├── features/         # Feature-specific components and logic
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # Frontend services
│   │   └── styles/           # CSS and styling
│   ├── preload.ts            # Electron preload script for IPC
│   ├── main.ts               # Electron main process entry point
│   ├── renderer.tsx          # Electron renderer process entry point
│   └── shared/               # Code shared between backend and frontend
│       ├── constants/        # Application constants
│       └── types/            # TypeScript type definitions
└── static/                   # Static assets (images, icons, etc.)
```

## Key Components

### Backend

#### Database Management

The application uses SQLite for storing playlist and video metadata. The database management is handled by the following components:

- `src/backend/database/config.ts`: Database configuration and path management
- `src/backend/database/optimize.ts`: Database optimization and statistics
- `src/backend/services/databaseManager.ts`: Core database operations (CRUD)
- `src/backend/services/playlistManagerDb.ts`: Database-based playlist management

#### YouTube Integration

YouTube playlist and video management is handled by:

- `src/backend/services/ytDlpManager.ts`: Integration with yt-dlp for YouTube downloads
- `src/backend/services/ytDlp/playlist.ts`: YouTube playlist operations
- `src/backend/services/ytDlp/video.ts`: YouTube video operations

#### IPC Communication

Communication between the backend and frontend is handled through IPC:

- `src/backend/ipc/handlers.ts`: Registers all IPC handlers
- `src/preload.ts`: Exposes IPC methods to the renderer process

### Frontend

#### UI Components

The frontend is built with React and uses a component-based architecture:

- `src/frontend/components/ui/`: Reusable UI components (buttons, cards, etc.)
- `src/frontend/components/common/`: Common application components (sidebar, header, etc.)
- `src/frontend/features/`: Feature-specific components organized by domain

#### State Management

The application uses React's Context API and hooks for state management:

- `src/frontend/hooks/`: Custom hooks for state management and side effects
- `src/frontend/services/`: Frontend services for data fetching and manipulation

## Data Flow

### Playlist Management

1. **Creating a Playlist**:
   - User initiates playlist creation in the UI
   - Frontend calls `window.api.playlists.create()`
   - IPC handler invokes `playlistServiceProvider.createEmptyPlaylist()`
   - Database manager creates the playlist entry
   - Result is returned to the frontend

2. **Importing a YouTube Playlist**:
   - User enters a YouTube playlist URL
   - Frontend calls `window.api.youtube.importPlaylist()`
   - IPC handler invokes `ytDlpManager.importYoutubePlaylist()`
   - YouTube data is fetched and processed
   - Playlist and videos are saved to the database
   - Progress updates are sent to the frontend via IPC
   - Completed playlist is returned to the frontend

3. **Adding a Video to a Playlist**:
   - User enters a YouTube video URL
   - Frontend calls `window.api.playlists.addVideo()`
   - IPC handler invokes `playlistServiceProvider.addVideoToPlaylist()`
   - Video info is fetched from YouTube
   - Video is added to the database
   - Updated playlist is returned to the frontend

4. **Downloading a Video**:
   - User initiates video download
   - Frontend calls `window.api.playlists.downloadVideo()`
   - IPC handler invokes `playlistServiceProvider.downloadPlaylistVideo()`
   - Video is downloaded using yt-dlp
   - Video metadata is updated in the database
   - Progress updates are sent to the frontend via IPC
   - Download path is returned to the frontend

## Storage Strategy

PlayListify uses a hybrid storage approach:

1. **Metadata Storage**: SQLite database for efficient querying of playlists and videos
2. **File Storage**: File system for storing the actual video files
3. **Settings Storage**: Electron's app.getPath('userData') for application settings

This hybrid approach provides the best of both worlds:
- Fast and efficient metadata queries with SQLite
- Optimal storage and playback of large video files from the file system

## Error Handling

The application implements a comprehensive error handling strategy:

1. **Backend Errors**: Caught and logged, with appropriate error messages returned to the frontend
2. **Frontend Errors**: Displayed to the user via toast notifications
3. **Database Errors**: Handled with transactions to ensure data integrity
4. **Network Errors**: Retried with exponential backoff for YouTube operations

## Recent Architectural Changes

1. **Database as Default Storage**: SQLite is now the default and only storage method for metadata
2. **Composite Primary Key for Videos**: Videos table now uses (id, playlistId) as the primary key to allow the same video in multiple playlists
3. **Database Optimization**: Added indexes and optimization functions for better performance
4. **Folder Structure Rename**: Renamed 'main' to 'backend' and 'renderer' to 'frontend' for clarity
5. **Database Backup UI**: Added UI for database backup and restore operations

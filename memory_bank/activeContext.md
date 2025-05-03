# Active Context

## Current Focus
The current development focus is on continuing to establish the core infrastructure for PlayListify as an Electron desktop application. With the basic Electron setup now complete (including TypeScript, webpack, and a basic IPC bridge), attention is shifting to implementing the database layer, state management, and building the UI component library.

## Priority Features
1. User authentication and profile management
2. Basic playlist creation and editing
3. Connection to at least one streaming service (Spotify as initial platform)
4. Simple UI for playlist management
5. Desktop-specific features (system tray, notifications)

## Active Development Tasks
- Setting up ESLint and Prettier for code quality
- Implementing database service with better-sqlite3
- Setting up state management with Zustand
- Creating a UI component library with Tailwind CSS
- Implementing authentication flow with OAuth
- Designing local storage for user data and playlists
- Building API communication for playlist management

## Technical Decisions

### Current Implementation Status
- ✅ Electron set up with Electron Forge, webpack, and TypeScript
- ✅ React configured for the renderer process
- ✅ Preload script established for secure IPC communication
- ✅ Basic IPC ping example implemented
- ✅ Tailwind CSS configured for styling
- ✅ Project structure created with main, renderer, and shared directories

### Electron Implementation
- Using Electron for cross-platform desktop application
- React with TypeScript for the renderer process
- Node.js for the main process
- IPC for communication between processes
- Local storage for user preferences and cached data

### UI Implementation
- Using React with TypeScript for type safety
- Planning to implement Zustand for state management
- Using Tailwind CSS for styling with a consistent design system
- Developing a component library for reusable UI elements

### Backend Integration
- Direct API communication with music streaming services
- OAuth authentication for streaming service accounts
- Local storage for offline capabilities
- Secure credential storage
- SQLite database for persistent data storage

## Current Challenges
- Resolving current linter errors in the codebase
- Implementing a database service with SQLite
- Setting up proper state management with Zustand
- Designing an effective UI component library
- Handling authentication across multiple streaming services
- Normalizing playlist data from different sources
- Managing API rate limits for streaming services
- Implementing secure storage for user credentials

## Next Milestones
- Fix current linter errors
- Complete the ESLint and Prettier setup
- Implement database service with better-sqlite3
- Set up state management with Zustand
- Create basic UI component library
- Establish OAuth authentication system
- Implement basic playlist CRUD operations with local storage
- Establish connection with Spotify API

## Current Task

Phase 2: Database Setup

## Current Active Files

- src/main/database/index.ts
- src/main/services/logService.ts
- src/main/services/settingsService.ts
- src/shared/types/index.ts
- src/main/index.ts
- src/renderer/App.tsx
- src/renderer/index.tsx

## Recent Changes

- Completed Phase 1 setup (100% complete)
- Set up ESLint and Prettier configurations
- Established folder structure for main, renderer, and shared code
- Created database connection service
- Added basic IPC communication
- Set up Zustand state management
- Set up TanStack Router
- Created UI component structure
- Added type definitions
- Installed better-sqlite3 and set up database initialization

## Current Challenges

- Fixing TypeScript issues with better-sqlite3 (installed @types/better-sqlite3)
- Potential issues with electron-store typing
- Need to begin implementing the database schema (Phase 2)

## Next Steps

- Define database schema
- Implement database initialization and connection
- Implement basic CRUD helpers for database operations
- Set up migrations for future schema changes

## Recent Technical Implementations

### History Page UI Implementation
- **Component**: Implemented a comprehensive History page UI in `src/renderer/pages/History.tsx`
- **Data Fetching**: Used React Query to fetch history data via `history:get` IPC handler with proper typing
- **UI Features**:
  - Tab-based filtering (All, Started, Completed)
  - Responsive grid layout with different breakpoints
  - Loading state with skeleton UI
  - Empty state messaging based on filter context
- **Technical Issues Resolved**:
  - Fixed casing inconsistency with Button component import path
  - Implemented a custom toast hook since shadcn/ui doesn't provide a toast function
  - Added proper typing for IPC responses using TypeScript generics
  - Replaced missing UI components (Skeleton, Tabs) with custom implementations
  - Updated Window API references to match the preload script definition
- **Key Learnings**:
  - Maintaining consistent casing in imports is crucial on case-sensitive filesystems
  - Custom hooks can efficiently replace missing functionality
  - Proper typing of async data improves development experience and reduces errors

*This document represents the current active development context and priorities.*

# Active Implementation Context

## Current Development Phase
We are currently working on **Phase 3: Core Infrastructure Setup** after completing Phase 2: Database Setup.

## Project Structure Overview

### Main Process (src/main)
- **index.ts**: Main entry point, creates window and initializes application
- **database/**: Database configuration and CRUD operations
  - **index.ts**: Database initialization and connection management
  - **schema.sql**: Complete database schema definition
  - **sqlite-adapter.ts**: Adapter for sqlite3 to provide better-sqlite3 compatible interface
  - **queries.ts**: Central export for all database query functions
  - **playlistQueries.ts**: CRUD operations for playlists
  - **videoQueries.ts**: CRUD operations for videos
  - **playlistVideoQueries.ts**: Operations for playlist-video relationships
  - **historyQueries.ts**: Operations for playback history
- **services/**: Service modules
  - **logService.ts**: Winston-based logging system
- **ipc/**: IPC handlers
  - **appHandlers.ts**: General application handlers
- **preload.ts**: Preload script for electron contextBridge

### Renderer Process (src/renderer)
- **index.tsx**: Renderer entry point, initializes React app
- **App.tsx**: Main React component
- **components/**: React components
- **hooks/**: Custom React hooks
- **router/**: TanStack router configuration
- **store/**: Zustand state management
- **styles/**: CSS styling
  - **globals.css**: Global styles and Tailwind directives
- **utils/**: Utility functions

### Shared (src/shared)
- **constants/**: Shared constants
- **types/**: TypeScript type definitions

## Database Schema

The database schema has been fully implemented with the following tables:

1. **app_meta**: Stores application metadata including database version
2. **playlists**: Stores playlist information (name, description, source, etc.)
3. **videos**: Stores video information (title, description, author, etc.)
4. **playlist_videos**: Join table that maps videos to playlists with ordering
5. **history**: Tracks video playback history and play positions
6. **downloads**: Tracks download status and information for videos
7. **tags**: Provides tagging functionality for playlists
8. **playlist_tags**: Join table for playlist-tag relationships

## Database Queries

We've implemented comprehensive query functions for all main entities:

### Playlist Operations
- createPlaylist
- getPlaylistById
- getAllPlaylists
- updatePlaylist
- deletePlaylist
- updatePlaylistStats

### Video Operations
- createOrUpdateVideo
- getVideoById
- getVideoByExternalId
- getAllVideos
- updateVideoDownloadInfo
- deleteVideo
- searchVideos

### PlaylistVideo Operations
- addVideoToPlaylist
- getPlaylistVideos
- removeVideoFromPlaylist
- updateVideoPosition
- videoExistsInPlaylist

### History Operations
- recordVideoPlay
- updatePlaybackPosition
- getRecentHistory
- getVideoHistory
- getMostRecentPlay
- deleteVideoHistory
- clearAllHistory
- getMostWatchedVideos

## Current Challenges

1. **Better-SQLite3 Build Issues**: We've implemented a SQLite3 adapter as a temporary workaround for better-sqlite3 native module build issues.
2. **IPC Communication**: We need to expose database operations to the renderer process via secure IPC handlers.
3. **Error Handling**: Need to implement comprehensive error handling and logging for database operations.

## Next Implementation Tasks

1. Implement secure IPC bridge via the preload script
2. Create IPC handlers for database operations
3. Implement settings management with electron-store
4. Set up comprehensive logging with Winston
5. Begin work on UI components for playlist management

## Technical Decisions Made

1. **Database Schema**: Using SQLite for local data storage with a comprehensive schema that supports all key features.
2. **Database Interface**: Created a clean interface for database operations with type-safe functions.
3. **Migration System**: Implemented a basic migration system for future schema updates.
4. **Transaction Support**: Using transactions for operations that affect multiple tables.
5. **Adapter Pattern**: Created an adapter for sqlite3 to provide a better-sqlite3 compatible interface as a temporary solution.

## Current Focus

The main focus is now on creating a secure bridge between the main and renderer processes to expose database operations to the UI, and implementing the settings management system.

## Current Focus: Video Download Implementation

### Completed Components
We've completed the backend components of the video download implementation:

1. **Download Service**: 
   - Implemented in `src/main/services/downloadService.ts`
   - Handles queue management, download execution, and status tracking
   - Uses yt-dlp for downloading videos with format selection

2. **Download IPC Handlers**:
   - Implemented in `src/main/ipc/downloadHandlers.ts`
   - Exposes download functionality to the renderer process
   - Includes handlers for formats, video downloads, playlist downloads

3. **Database Support**:
   - Added download queries in `src/main/database/downloadQueries.ts`
   - Updated schema to support the download tracking system

### Next Steps
1. Fix TypeScript/linter errors in the download service implementation
2. Implement the frontend download state management (5.3)
3. Create the download button and options UI (5.4)
4. Implement the Downloads page UI (5.5)

### Current Issues
There are several TypeScript/linter errors that need to be addressed:
- Import issues for `YtDlpWrap`, `logger`, and `db` references
- Type issues with error handling
- Need to ensure database functions are correctly implemented 
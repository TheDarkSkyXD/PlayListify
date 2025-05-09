# Playlistify Development Workflow Checklist

This document provides a comprehensive checklist for developing the Playlistify application, an Electron-based YouTube playlist manager and downloader that uses yt-dlp. Follow each phase and check off items as you complete them.

## Getting Started

### Create Project
Copy and paste these commands or follow the checklist to create a new Electron project with TypeScript and Webpack:

- [ ] Initialize a new Electron Forge project with TypeScript + Webpack template:
```bash
npx create-electron-app@latest . --template=webpack --force
npm install --save-dev typescript @types/react @types/react-dom ts-loader
```

- [ ] Create necessary directories for our application structure:
```bash
# Create frontend directories
mkdir -p src/frontend/components
mkdir -p src/frontend/features
mkdir -p src/frontend/pages
mkdir -p src/frontend/stores
mkdir -p src/frontend/utils
mkdir -p src/frontend/styles

# Create backend process directories
mkdir -p src/backend/services
mkdir -p src/backend/utils
mkdir -p src/backend/ipc

# Create shared directories
mkdir -p src/shared/types
mkdir -p src/shared/constants

# Create asset directories
mkdir -p assets/icons
mkdir -p assets/images
mkdir -p public

# Create test directories
mkdir -p tests/backend/services
mkdir -p tests/frontend/features
mkdir -p tests/frontend/stores

# Create documentation directory
mkdir -p docs
```

### Completed Setup Tasks
- [ ] Project initialization with Electron Forge
- [ ] TypeScript configuration
- [ ] Webpack configuration for backend and frontend processes
- [ ] PostCSS and Tailwind CSS setup
- [ ] Basic project structure creation
- [ ] TypeScript declarations for webpack entries
- [ ] License update to AGPL-3.0
- [ ] Settings management with electron-store
- [ ] File system utilities implementation with fs-extra
- [ ] IPC communication channels setup
- [ ] Type-safe API for frontend process
- [ ] Secure preload script configuration

### Current Progress
1. **Project Structure**
   - [ ] Basic directory structure
   - [ ] Configuration files setup
   - [ ] Build system configuration

2. **Development Environment**
   - [ ] TypeScript configuration
   - [ ] Webpack setup
   - [ ] PostCSS and Tailwind CSS integration
   - [ ] Development server configuration

3. **Core Setup**
   - [ ] Main process entry point
   - [ ] Renderer process setup
   - [ ] Preload script configuration
   - [ ] IPC communication foundation
   - [ ] Settings management with electron-store
   - [ ] File system utilities with fs-extra
   - [ ] Secure IPC communication channels

### Next Steps
1. **UI Development (Phase 2.1)**
   - [ ] Implement base layout components
   - [ ] Create playlist management UI
   - [ ] Build playlist creation form
   - [ ] Implement responsive grid layout for playlists

2. **Core Features (Phase 2)**
   - [ ] Implement playlist creation and management (Phase 2.1)
   - [ ] Develop YouTube playlist import with yt-dlp (Phase 2.2)
   - [ ] Create local storage and state management (Phase 2.3)
   - [ ] Build playlist display and filtering features (Phase 2.4)
   - [ ] Implement rate limiting for API calls (Phase 2.5)

### Install Required Packages

Copy and paste these commands to install all required packages:

```bash
# Core dependencies
npm install electron @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip @electron-forge/maker-deb @electron-forge/maker-rpm typescript @types/node electron-store fs-extra @types/fs-extra electron-updater electron-squirrel-startup better-sqlite3

# UI dependencies
npm install react react-dom @types/react @types/react-dom tailwindcss postcss autoprefixer @shadcn/ui @tanstack/react-router @tanstack/react-query

# Media & Download dependencies
npm install yt-dlp-wrap fluent-ffmpeg p-queue react-player winston

# Integration dependencies
npm install better-auth googleapis axios zustand

# Development dependencies
npm install --save-dev jest @types/jest ts-jest @testing-library/react @electron-forge/plugin-auto-unpack-natives @electron-forge/plugin-fuses @electron-forge/plugin-webpack @electron/fuses @vercel/webpack-asset-relocator-loader cross-env css-loader electron-rebuild eslint node-loader prettier prettier-plugin-sort-imports prettier-plugin-tailwindcss purgecss style-loader @types/lodash
```

## Required Packages

### Core
- [ ] electron
- [ ] @electron-forge/cli
- [ ] @electron-forge/maker-squirrel
- [ ] @electron-forge/maker-zip
- [ ] @electron-forge/maker-deb
- [ ] @electron-forge/maker-rpm
- [ ] typescript
- [ ] @types/node
- [ ] electron-store
- [ ] fs-extra
- [ ] @types/fs-extra
- [ ] electron-updater
- [ ] electron-squirrel-startup
- [ ] better-sqlite3

### UI
- [ ] react
- [ ] react-dom
- [ ] @types/react
- [ ] @types/react-dom
- [ ] tailwindcss
- [ ] postcss
- [ ] autoprefixer
- [ ] @shadcn/ui
- [ ] @tanstack/react-router
- [ ] @tanstack/react-query

### Media & Downloads
- [ ] yt-dlp-wrap
- [ ] fluent-ffmpeg
- [ ] p-queue
- [ ] react-player
- [ ] winston

### Integration
- [ ] better-auth
- [ ] googleapis
- [ ] axios
- [ ] zustand

### Testing & Development
- [ ] jest
- [ ] @types/jest
- [ ] ts-jest
- [ ] @testing-library/react
- [ ] @electron-forge/plugin-auto-unpack-natives
- [ ] @electron-forge/plugin-fuses
- [ ] @electron-forge/plugin-webpack
- [ ] @electron/fuses
- [ ] @vercel/webpack-asset-relocator-loader
- [ ] cross-env
- [ ] css-loader
- [ ] electron-rebuild
- [ ] eslint
- [ ] node-loader
- [ ] prettier
- [ ] prettier-plugin-sort-imports
- [ ] prettier-plugin-tailwindcss
- [ ] purgecss
- [ ] style-loader
- [ ] @types/lodash

## Phase 1: Project Setup & Core Infrastructure

### Phase 1.0: Base Setup

**Tasks:**
- [x] Create base Electron project with TypeScript
- [x] Set up basic window configuration

**Files Created:**
- [x] `package.json` (~50 lines)
  - Base dependencies for Electron Forge
  - Scripts for development and building
  - Configuration for Electron Forge plugins
- [x] `tsconfig.json` (~30 lines)
  - TypeScript configuration
  - Path aliases for imports
- [x] `src/backend/backend.ts` (~100 lines)
  - Main process entry point
  - Window creation and basic configuration
  - IPC backend process setup
- [x] `electron-forge.config.js` (~50 lines)
  - Packaging configuration
  - Build paths and output formats

### Phase 1.1: Initialize Electron Project
**Tasks:**
- [x] Create base Electron project with TypeScript
- [x] Set up basic window configuration

**Files Created:**
- [x] `package.json` (~50 lines)
  - Project configuration, dependencies, scripts
- [x] `tsconfig.json` (~30 lines)
  - TypeScript configuration with strict type checking
- [x] `src/backend/backend.ts` (~100 lines)
  - Main Electron process entry point
  - Window creation and management
- [x] `electron-forge.config.js` (~50 lines)
  - Electron Forge build configuration

**Sample Code for `src/backend/backend.ts`:**
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadURL('http://localhost:3000'); // Dev server URL
  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => mainWindow === null && createWindow());
```

### Phase 1.2: Core Dependency Setup (yt-dlp & ffmpeg)
**Tasks:**
- [x] Ensure `scripts/start.js` checks for `yt-dlp` and prompts for install if needed.
- [x] Ensure `scripts/start.js` downloads `yt-dlp` to a managed location (`APP_DATA_DIR/bin`).
- [x] Ensure `scripts/start.js` checks for `ffmpeg` and prompts for install if needed.
- [x] Ensure `scripts/start.js` downloads `ffmpeg` to a managed location (`APP_DATA_DIR/bin/ffmpeg`).
- [x] Create utility functions (`src/backend/utils/pathUtils.ts`) for backend services to retrieve binary paths based on environment variable set by `start.js`.
- [ ] Integrate discovered paths into `ytDlpManager.ts` (when created/modified).
- [ ] Integrate discovered paths into `ffmpegService.ts` (when created/modified).

**Files Created/Updated:**
- [x] `scripts/start.js` (updated with prompts and install logic)
- [x] `src/backend/utils/pathUtils.ts` (new utility for path retrieval)
- [x] `ytdlp/` directory (created at root, though `start.js` uses `APP_DATA_DIR`)
- [x] `ffmpeg/` directory (created at root, though `start.js` uses `APP_DATA_DIR`)

**Implementation Details:**
- Dependency checking and installation is now handled by the `scripts/start.js` wrapper script before the Electron app launches.
- The script uses a dedicated directory within the user's application data folder (`APP_DATA_DIR`) for binaries.
- The main application retrieves binary paths using `pathUtils.ts`, which reads an environment variable set by `start.js`.
- IPC communication for dependency status is no longer needed as `start.js` handles failures before launch.

### Phase 1.3: Set Up React and UI Libraries

**Tasks:**
- [x] Integrate React for the frontend process
- [x] Set up TailwindCSS and Shadcn UI for styling
- [x] Configure TanStack Router for navigation
- [x] Implement dark/light theme support
- [x] Create Sidenavbar component for page navigation
- [x] Create TopNavbar component for app title and user avatar

**Files Created:**
- [x] `src/frontend/index.tsx` (~50 lines)
  - Renderer entry point
  - Root React rendering
- [x] `src/frontend/App.tsx` (~15 lines)
  - Main React component
  - Router integration
- [x] `postcss.config.js` (~10 lines)
  - PostCSS configuration for Tailwind
- [x] `tailwind.config.js` (~25 lines)
  - Tailwind CSS configuration
  - Custom YouTube-inspired color scheme
- [x] `src/frontend/styles/globals.css` (~85 lines)
  - Global styles and Tailwind directives
  - Custom component classes
  - Dark/light mode variables
  - Custom scrollbar styles
- [x] `src/frontend/router/index.tsx` (~45 lines)
  - TanStack Router configuration
  - Route definitions for Dashboard, Settings, and Playlist pages
- [x] `src/frontend/pages/Dashboard/Dashboard.tsx` (~25 lines)
  - Dashboard page component with responsive layout
- [x] `src/frontend/pages/Settings/Settings.tsx` (~30 lines)
  - Settings page component
- [x] `src/frontend/pages/MyPlaylists/MyPlaylists.tsx` (~30 lines)
  - Individual playlist viewing page
- [x] `src/frontend/pages/Downloads/Downloads.tsx` (~30 lines)
  - Downloads page with progress tracking and management
- [x] `src/frontend/pages/History/History.tsx` (~30 lines)
  - History page for tracking watched and downloaded content
- [x] `src/frontend/components/Layout/AppLayout.tsx` (~40 lines)
  - Main application layout shell containing Sidenavbar, TopNavbar, and Outlet for page content. Does not contain theme logic.
- [x] `src/frontend/components/Layout/Sidenavbar/Sidenavbar.tsx` (~45 lines)
  - Sidenavbar with navigation links (Dashboard, Playlists, Downloads, History, Settings).
- [x] `src/frontend/components/Layout/TopNavbar/TopNavbar.tsx` (~65 lines)
  - TopNavbar displaying application title, user avatar placeholder, and theme (dark/light mode) toggle button.

**Notes:**
- Implemented TanStack Router for navigation between Dashboard, Settings, and Playlist views
- Created responsive layouts with Tailwind's utility classes
- Set up YouTube-inspired theme with CSS variables for color tokens
- Added support for both light and dark modes (toggle located in TopNavbar)
- Added reusable component classes in global.css (.btn, .input, .select)
- Set up custom scrollbar styling consistent with the application theme
- Organized pages using folder structure with index.tsx files for better organization and code splitting

### Phase 1.4: Configure Routing and Data Fetching

**Tasks:**
- [x] Set up routing with TanStack Router
- [x] Configure React Query for data management

**Files Created/Updated:**
- [x] `src/frontend/App.tsx`
  - Added QueryClientProvider with configuration
  - Set up stale time and refetch options
  - Implemented theme detection and management
- [x] `src/shared/types/index.ts` (~85 lines)
  - Created comprehensive TypeScript interfaces for playlists, videos, settings, etc.
  - Defined type-safe structures for core application entities
  - Added error handling types
- [x] `src/frontend/router/index.tsx` (~45 lines)
  - Implemented TanStack Router with route definitions
  - Set up route structure with dashboard, settings, and playlist views
  - Added catch-all route for redirects
  - Provided type safety through declarations
- [x] `src/frontend/hooks/usePlaylistQueries.ts` (~140 lines)
  - Created React Query hooks for data operations
  - Implemented query caching and invalidation strategies
  - Added store synchronization with query results
  - Set up mutation hooks for create, update, and delete operations
- [x] `src/backend/services/playlistService.ts` (~135 lines)
  - Implemented playlist data service
  - Created CRUD operations for playlists
  - Added YouTube playlist import functionality
- [x] `src/frontend/pages/Dashboard/Dashboard.tsx` (~85 lines)
  - Implemented dashboard UI with responsive layout
  - Connected to playlist store for data display
  - Added error handling for data loading
- [x] `src/frontend/components/PlaylistList/PlaylistList.tsx` (~75 lines)
  - Implemented React Query for fetching playlists
  - Added loading, error, and empty states
  - Created responsive grid layout for playlist display
- [x] `src/frontend/store/playlistStore.ts` (~100 lines)
  - Implemented Zustand store for client-side state management
  - Added actions for managing playlist and video data
  - Created loading and error state management

**Notes:**
- React Query is already configured in the App.tsx file with sensible defaults (5 minute stale time, no refetch on window focus)
- The codebase uses a well-structured query hook system in usePlaylistQueries.ts
- TypeScript interfaces are defined in shared/types/index.ts ensuring type safety across the application
- Zustand store is implemented in store/playlistStore.ts for client-side state management
- The app correctly implements loading, error, and empty states for data fetching
- The backend process has playlistService.ts for server-side operations
- Proper IPC communication is set up between frontend and backend processes

### Phase 1.5: Persistent Storage and File System

**Tasks:**
- [x] Implement settings management with electron-store
- [x] Create file system utilities with fs-extra

**Files Created:**
- [x] `src/backend/services/settingsService.ts` (~150 lines)
  - Settings storage and retrieval with TypeScript type safety
  - Default configuration management
  - Directory initialization
  - Account management functions
- [x] `src/backend/utils/fileUtils.ts` (~230 lines)
  - File system operations for playlists and videos
  - Directory and file management utilities
  - Playlist metadata handling
  - File validation functions
- [x] `src/backend/ipc/fileHandlers.ts` (~150 lines)
  - IPC communication between backend and frontend processes
  - Settings IPC handlers
  - File system operation handlers
  - Path validation handlers
- [x] `src/backend/ipc/settingsHandlers.ts` (~50 lines)
  - IPC handlers for settings management
  - Type-safe getters and setters for application settings

**Notes:**
- Used electron-store for persistent settings with strict TypeScript typing
- Implemented comprehensive file system utilities for playlist and video management
- Created structured directory organization for downloads and playlists
- Added proper error handling and logging throughout the file operations
- Set up IPC handlers for all file system and settings operations
- Implemented file validation and sanitization for security

### Phase 1.6: IPC Communication

**Tasks:**
- [x] Set up IPC communication channels
- [x] Implement type-safe API for frontend process

**Files Created:**
- [x] `src/backend/ipc/appHandlers.ts` (~100 lines)
  - IPC handlers for backend process
- [x] `src/backend/ipc/downloadHandlers.ts` (~125 lines)
  - IPC handlers for download operations
- [x] `src/backend/ipc/fileHandlers.ts` (~150 lines)
  - IPC handlers for file operations
- [x] `src/backend/ipc/playlistHandlers.ts` (~100 lines)
  - IPC handlers for playlist operations
- [x] `src/backend/ipc/settingsHandlers.ts` (~50 lines)
  - IPC handlers for settings management
- [x] `src/backend/ipc/thumbnailHandlers.ts` (~100 lines)
  - IPC handlers for thumbnail operations

**Implementation Details:**
- Set up IPC communication channels for backend process to frontend process
- Implemented type-safe API for frontend process
- Created separate IPC handlers for different types of operations
- Added proper error handling and logging for IPC communication

### Phase 1.7: Secure Preload Script

**Tasks:**
- [x] Configure secure preload script
- [x] Implement type-safe API for frontend process

**Files Created:**
- [x] `src/backend/preload.ts` (~100 lines)
  - Secure preload script
  - Type-safe API for frontend process

**Implementation Details:**
- Configured secure preload script to isolate frontend process from backend process
- Implemented type-safe API for frontend process using contextBridge
- Added proper error handling
- Structured IPC communication through a safe interface

## Phase 2: Playlist Management & Local Storage

### Phase 2.1: Playlist Creation UI

**Tasks:**
- [ ] Build UI components for playlist management
- [ ] Create playlist creation form within `AddNewPlaylistDialog.tsx`

**Files Created/Updated:**
- [ ] `src/frontend/components/PlaylistGrid/PlaylistGrid.tsx` (~200 lines)
  - Implemented responsive playlist grid layout
  - Added loading, error, and empty states
- [ ] `src/frontend/components/Modals/AddNewPlaylistDialog/AddNewPlaylistDialog.tsx` (~300 lines, renamed from `CreatePlaylistModal.tsx`)
  - Dialog titled "Add New Playlist" with an "Add Playlist" button.
  - Features two tabs:
    - **"From YouTube" Tab**: For importing playlists by pasting a YouTube URL. Includes form validation for URLs.
    - **"Custom Playlist" Tab**: For creating a new local playlist with fields for Title and Description.
  - Advanced options section with expandable UI (can be common to both tabs or specific).
  - Loading states during form submission.
  - Error handling.
- [ ] `src/frontend/components/Modals/ConfirmDeleteDialog/ConfirmDeleteDialog.tsx` (~80 lines)
  - Reusable confirmation dialog for destructive actions
  - Customizable title, message and button text
  - Integrates with shadcn/ui Dialog component
- [ ] `src/frontend/components/Modals/EditPlaylistDetailsDialog/EditPlaylistDetailsDialog.tsx` (~150 lines)
    - Dialog for editing the Title and Description of an existing custom or imported playlist.

**Additional Components Created:**
- [ ] `src/frontend/features/playlists/components/PlaylistCard/PlaylistCard.tsx` (~150 lines)
  - Individual playlist card with thumbnail and metadata
  - Hover effects.
  - Utilizes `PlaylistActionsDropdown.tsx` to display playlist actions.
  - Dynamic styling based on playlist status
- [ ] `src/frontend/features/playlists/components/PlaylistActionsDropdown/PlaylistActionsDropdown.tsx` (~180 lines)
    - Reusable dropdown menu component containing actions for a single playlist (Refresh, Delete, Duplicate, Download, Open in YouTube, Edit, Play).
    - Handles conditional display logic (e.g., 'Open in YouTube').
    - Integrates with UI library (e.g., Shadcn DropdownMenu).

**Implementation Details:**
- Used hooks for data fetching with proper loading/error states
- Implemented store integration for local state management  
- Created responsive grid layout that adapts to different screen sizes
- Added sorting capabilities for better playlist organization
- Implemented proper form validation with user feedback
- Created consistent styling using Tailwind CSS utility classes
- Used UI components for elements (Dialog, Select, Button, etc.)
- Added proper error handling and user feedback
- Enhanced playlist management with improved modal interfaces
- Integrated with the existing application structure and navigation

### Phase 2.2: Import Playlists with yt-dlp

**Completed Tasks:**
- [ ] Implement yt-dlp integration for fetching playlist metadata
- [ ] Create wrapper functions for yt-dlp commands
- [ ] Fixed CSP issues for loading YouTube thumbnails
- [ ] Implemented fallback mechanism for image loading
- [ ] Added development asset handling for static files

**Files Created/Updated:**
- [ ] `src/backend/services/ytDlpManager.ts`
  - Wrapper for yt-dlp commands
  - Playlist metadata extraction functions
- [ ] `src/backend/backend.ts`
  - Added CSP configuration to allow YouTube image domains
  - Implemented development asset management function
- [ ] `src/frontend/components/CachedImage.tsx`
  - Enhanced with robust image fallback mechanism
  - Added hardcoded placeholder for when all else fails

**Implementation Notes:**
- Fixed Content Security Policy to properly allow loading external images from YouTube
- Created a function to ensure development assets are copied to the correct locations
- Enhanced CachedImage component with multiple fallback levels and error handling
- Added base64 encoded placeholder image as final fallback option

**Sample Code for `src/backend/services/ytDlpManager.ts`:**
```
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeMetadata } from '../utils/fileUtils';
const execAsync = promisify(exec);

export async function getPlaylistMetadata(playlistUrl: string): Promise<any> {
  const command = `yt-dlp --dump-json "${playlistUrl}"`;
  const { stdout, stderr } = await execAsync(command);
  if (stderr) throw new Error(`yt-dlp error: ${stderr}`);
  const metadata = JSON.parse(stdout);
  return metadata;
}

export async function importPlaylist(playlistUrl: string, playlistName: string): Promise<void> {
  const metadata = await getPlaylistMetadata(playlistUrl);
  const videos = metadata.entries.map((entry: any) => ({
    id: entry.id,
    title: entry.title,
    url: entry.webpage_url,
  }));
  await writeMetadata(playlistName, { name: playlistName, videos });
}
```

### Phase 2.3: Playlist State Management

**Tasks:**
- [ ] Implement state management with Zustand
- [ ] Create playlist store structure
- [ ] Implement data persistence strategies (using `better-sqlite3` for local database)
- [ ] Add playlist filtering and sorting capabilities
- [ ] Create actions for CRUD operations
- [ ] Implement error handling and loading states

**Files Created/Updated:**
- [ ] `src/frontend/store/playlistStore.ts` (~150 lines)
  - Enhanced store with TypeScript interfaces
  - Actions for creating, updating, and deleting playlists
  - Synchronization with localStorage for persistence
  - Video status tracking capabilities
  - Integration with data fetching hooks
- [ ] `src/shared/constants/appConstants.ts` (~50 lines)
  - Application-wide constants and defaults
  - Rate limit configurations
  - UI constants for consistent layout
  - File path constants and naming conventions

**Implementation Notes:**
- Used Zustand for state management due to its minimal API and easy integration with React
- Implemented custom selectors for optimized component renders
- Created type-safe actions with proper TypeScript interfaces for all operations
- Added middleware for persistent storage using localStorage
- Implemented automatic state synchronization with backend process data
- Added derived state for filtering and sorting playlists by various criteria
- Created a unified error handling strategy for failed operations
- Used React Query for data fetching with Zustand for UI state
- Implemented optimistic updates for improved UX during mutations
- Added debounced search functionality for playlist filtering
- Created middleware for logging state changes during development

### Phase 2.4: Display Playlists

**Tasks:**
- [ ] Create UI components for playlist display
- [ ] Implement responsive grid layout using `PlaylistGrid.tsx`
- [ ] Add search and filtering capabilities to `PlaylistActionsBar.tsx`
- [ ] Create skeleton loading states
- [ ] Implement empty and error states
- [ ] Add sorting and filtering functionality
- [ ] Implement view toggle (Grid/List) on the 'My Playlists' page, with the toggle button and state managed by `MyPlaylists.tsx`.

**Files Created/Updated:**
- [ ] `src/frontend/components/PlaylistGrid/PlaylistGrid.tsx` (~200 lines, renamed from PlaylistList.tsx)
  - Enhanced component for displaying playlist grid, utilizing `PlaylistCard.tsx` for items.
  - Integration with playlist store for data
  - Responsive grid layout with various breakpoints
  - Filtering and search implementation
  - Loading, empty, and error states
- [ ] `src/frontend/components/PlaylistGrid/PlaylistActionsBar/PlaylistActionsBar.tsx` (~150 lines)
  - Search input with debounce
  - Dropdown filters for playlist attributes
  - Sort order selection (newest, oldest, alphabetical)
  - Tag filtering system.
- [ ] `src/frontend/components/ui/Skeleton/Skeleton.tsx` (~80 lines)
  - Skeleton loading state for playlists
  - Animated pulse effect
  - Responsive design matching the actual content
- [ ] `src/frontend/pages/MyPlaylists/MyPlaylists.tsx` (updates from Phase 1.3)
  - Manages the state for grid/list view toggle.
  - Renders the Grid/List toggle button (using Lucide Icons).
  - Conditionally renders `PlaylistGrid.tsx` or `PlaylistListView.tsx`.
- [ ] `src/frontend/components/PlaylistListView/PlaylistListView/PlaylistListView.tsx` (~180 lines)
  - Component to display playlists in a list format (e.g., rows).
- [ ] `src/frontend/components/PlaylistListView/PlaylistItemRow/PlaylistItemRow.tsx` (~120 lines)
  - Component for rendering a single playlist as a row in the list view.
  - Utilizes `PlaylistActionsDropdown.tsx` to display playlist actions.

**Implementation Notes:**
- React Query is already configured in the App.tsx file with sensible defaults (5 minute stale time, no refetch on window focus)
- The codebase uses a well-structured query hook system in usePlaylistQueries.ts
- TypeScript interfaces are defined in shared/types/index.ts ensuring type safety across the application
- Zustand store is implemented in store/playlistStore.ts for client-side state management
- The app correctly implements loading, error, and empty states for data fetching
- The backend process has playlistService.ts for server-side operations
- Proper IPC communication is set up between frontend and backend processes
- Implemented search functionality with debouncing to reduce unnecessary renders
- Used skeleton loading states to improve perceived performance
- Added empty state with helpful onboarding messages for new users
- Implemented error states with retry functionality
- Created consistent card design with hover and focus states for better UX
- Added async filtering with properly typed filter functions
- Used CSS Grid with auto-fit and minmax for truly responsive layouts
- Implemented tag-based filtering with multi-select capability
- Created a sticky filter bar that remains accessible while scrolling
- Added keyboard navigation support for grid items
- Implemented virtual scrolling for performance with large playlist collections
- Used intersection observer for lazy loading images
- Added subtle animations for card interactions
- Added view toggle functionality on the 'My Playlists' page

## Phase 3: Video Downloading & Playback

### Phase 3.1: Download Logic

**Tasks:**
- [ ] Implement video download functionality with yt-dlp
- [ ] Create download queue management with p-queue
- [ ] Implement download status tracking
- [ ] Create IPC handlers for download operations
- [ ] Add lazy initialization to prevent startup errors

**Files Created:**
- [ ] `src/backend/services/downloadManager.ts` (~530 lines)
  - Download queue management with p-queue
  - Download status tracking
  - Pause, resume, and cancel functionality
  - Integration with existing yt-dlp manager
  - Lazy initialization to prevent startup errors
- [ ] `src/backend/ipc/downloadHandlers.ts` (~125 lines)
  - IPC handlers for download operations
  - Error handling and logging

**Implementation Details:**
- Used the existing logger service for download-related events
- Implemented a download queue with configurable concurrency
- Added download status tracking (pending, downloading, paused, completed, failed, canceled)
- Created methods for adding, pausing, resuming, and canceling downloads
- Added progress tracking and status updates
- Implemented IPC handlers for all download operations
- Added TypeScript interfaces for download items and options
- Integrated with the existing yt-dlp manager for video downloads
- Added lazy initialization to prevent startup errors
- Implemented proper error handling throughout the download process

**Key Features:**
```typescript
// Download manager class with queue management
export class DownloadManager {
  private queue: PQueue | null = null;
  private downloads: Map<string, DownloadItem> = new Map();
  private activeDownloads: Set<string> = new Set();
  private mainWindow?: BrowserWindow;
  private initialized: boolean = false;

  // Check if the download manager is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Initialize the download manager
  public initialize(): void {
    if (this.initialized) return;

    try {
      // Initialize the queue with concurrency from settings
      const concurrentDownloads = getSetting('concurrentDownloads', 3);
      this.queue = new PQueue({ concurrency: concurrentDownloads });

      // Log initialization
      logToFile('INFO', c.section('ðŸš€', 'Download Manager initialized'));
      logToFile('INFO', `Concurrent downloads: ${concurrentDownloads}`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize download manager:', error);
    }
  }

  // Add a video to the download queue
  public async addToQueue(
    videoUrl: string,
    videoId: string,
    title: string,
    outputDir: string,
    options: DownloadOptions = {},
    playlistId?: string,
    thumbnail?: string
  ): Promise<string> {
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }

    // Generate a unique download ID
    const downloadId = uuidv4();

    // Create download item
    const downloadItem: DownloadItem = {
      id: downloadId,
      videoId,
      playlistId,
      url: videoUrl,
      title,
      outputDir,
      status: 'pending',
      progress: 0,
      format: options.format || getSetting('downloadFormat', 'mp4'),
      quality: options.quality || getSetting('maxQuality', '1080p'),
      addedAt: new Date().toISOString(),
      thumbnail
    };

    // Add to downloads map
    this.downloads.set(downloadId, downloadItem);

    // Add to queue
    if (this.queue) {
      this.queue.add(async () => {
        return this.processDownload(downloadId);
      });
    }

    return downloadId;
  }
}
```

### Phase 3.2: Format Conversion

**Tasks:**
- [ ] Add format conversion capabilities with fluent-ffmpeg
- [ ] Implement quality selection options
- [ ] Create UI components for format selection
- [ ] Add IPC handlers for format conversion
- [ ] Create demo component for format conversion

**Files Created:**
- [ ] `src/backend/services/formatConverter.ts` (~500 lines)
  - Format conversion utilities with fluent-ffmpeg
  - Support for multiple output formats (mp4, webm, mp3, etc.)
  - Quality selection and resolution control
  - Progress tracking during conversion
  - Error handling and logging
- [ ] `src/backend/ipc/formatConverterHandlers.ts` (~200 lines)
  - IPC handlers for format conversion operations
  - Progress tracking and reporting
  - Error handling
- [ ] `src/frontend/features/downloads/components/FormatSelector.tsx` (~200 lines)
  - UI for selecting download formats and quality
  - Support for video and audio formats
  - Advanced options for bitrate control
- [ ] `src/frontend/features/downloads/components/FormatConverterDemo.tsx` (~200 lines)
  - Demo component for format conversion
  - Progress tracking and display
  - Result display with file information

**Implementation Details:**
- Added support for multiple output formats (mp4, webm, mp3, aac, flac, opus, m4a)
- Implemented quality selection for video formats (360p to 4K)
- Added bitrate control for audio formats
- Created a tabbed interface for selecting between video and audio formats
- Implemented progress tracking during conversion
- Added error handling and logging
- Created IPC handlers for all format conversion operations
- Added TypeScript interfaces for conversion options and results

**Key Features:**
```typescript
// Format conversion with progress tracking
export async function convertFile(
  inputPath: string,
  options: ConversionOptions,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  // Ensure FFmpeg is initialized
  await initFFmpeg();

  // Determine output path based on input path and format
  const parsedPath = path.parse(inputPath);
  const outputPath = path.join(
    parsedPath.dir,
    `${parsedPath.name}.${options.format}`
  );

  // Create FFmpeg command
  const command = ffmpeg(inputPath);

  // Set output format
  command.toFormat(options.format);

  // Apply video options if not converting to audio-only format
  if (!['mp3', 'aac', 'flac', 'opus', 'm4a'].includes(options.format)) {
    // Set video codec based on format
    if (options.format === 'mp4') {
      command.videoCodec('libx264');
    } else if (options.format === 'webm') {
      command.videoCodec('libvpx-vp9');
    }

    // Set resolution based on quality
    if (options.quality) {
      switch (options.quality) {
        case '360p':
          command.size('640x360');
          break;
        case '480p':
          command.size('854x480');
          break;
        case '720p':
          command.size('1280x720');
          break;
        case '1080p':
          command.size('1920x1080');
          break;
        // Additional resolutions...
      }
    }
  }

  // Set progress handler
  if (progressCallback) {
    command.on('progress', (progress) => {
      progressCallback({
        percent: Math.min(Math.round(progress.percent || 0), 100),
        fps: progress.frames ? progress.frames / ((progress.timemark.split(':').reduce((acc, time) => (60 * acc) + +time, 0)) || 1) : undefined,
        kbps: progress.currentKbps,
        targetSize: progress.targetSize,
        currentSize: progress.currentSize,
        timemark: progress.timemark,
        eta: progress.timemark
      });
    });
  }

  // Execute the conversion
  return new Promise((resolve, reject) => {
    command.on('end', async () => {
      // Return result with file information
      resolve({
        success: true,
        outputPath,
        duration: await getVideoDuration(outputPath),
        format: options.format,
        size: (await fs.stat(outputPath)).size
      });
    }).on('error', (err) => {
      reject({
        success: false,
        outputPath: '',
        duration: 0,
        format: options.format,
        size: 0,
        error: err.message
      });
    }).save(outputPath);
  });
}
```

### Phase 3.3: Playback

**Tasks:**
- [ ] Create video player component with react-player
- [ ] Implement playback controls
- [ ] Add player state management with Zustand
- [ ] Integrate player with playlist view
- [ ] Add keyboard shortcuts for playback control
- [ ] Implement fullscreen support
- [ ] Add error handling for missing files
- [ ] Add download options dialog for playlist downloads
- [ ] Use YouTube's default controls for YouTube videos
- [ ] Update Content Security Policy for YouTube integration
- [ ] Add conditional UI based on video source (local vs. YouTube)
- [ ] Implement playlist navigation for YouTube videos

**Files Created:**
- [ ] `src/frontend/features/player/components/VideoPlayer.tsx` (~300 lines)
  - Video playback component with ReactPlayer
  - Custom controls UI with play/pause, volume, seek, fullscreen
  - Error handling for missing files
  - Keyboard shortcuts for playback control
- [ ] `src/frontend/features/player/stores/playerStore.ts` (~150 lines)
  - Zustand store for player state management
  - Actions for play, pause, next, previous
  - Playlist navigation support
- [ ] `src/frontend/features/player/utils/playerUtils.ts` (~100 lines)
  - Utility functions for file path resolution
  - YouTube URL handling
  - Time formatting
- [ ] `src/frontend/features/downloads/components/DownloadOptionsDialog.tsx` (~200 lines)
  - Dialog for selecting download options
  - Options for download location and video quality/format
  - Integration with FormatSelector component
- [ ] `tests/frontend/features/player/VideoPlayer.test.tsx` (~150 lines)
  - Tests for player rendering and controls
  - Mock implementation for ReactPlayer

**Implementation Details:**
- Used ReactPlayer for video playback with support for both local files and streaming
- Created custom controls UI with play/pause, volume, seek, fullscreen buttons for local videos
- Used YouTube's native controls for YouTube videos for better compatibility
- Implemented keyboard shortcuts for common playback actions
- Added error handling for missing files with user-friendly error messages
- Created a Zustand store for player state management
- Integrated player with playlist view for seamless playback
- Added support for playlist navigation (next/previous)
- Implemented responsive design for different screen sizes
- Added fullscreen support with proper event handling
- Created a download options dialog for playlist downloads
- Added ability to select download location and video quality/format
- Implemented settings persistence for download preferences
- Updated Content Security Policy to allow YouTube video playback
- Added conditional UI that adapts based on video source (local vs. YouTube)
- Enhanced video path resolution to better handle YouTube URLs

**Sample Code for `src/frontend/features/player/components/VideoPlayer.tsx`:**
```typescript
import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../../../utils/formatting';
import { cn } from '../../../utils/cn';

interface VideoPlayerProps {
  videoId: string;
  playlistId: string;
  videoUrl?: string;
  title?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playlistId,
  videoUrl,
  title,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the video file exists and get its path
  useEffect(() => {
    const checkVideoFile = async () => {
      setLoading(true);
      setError(null);

      try {
        // If we have a direct URL, use it first
        if (videoUrl) {
          // For YouTube videos, we want to use the URL directly
          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            console.log('Using YouTube URL:', videoUrl);
            setVideoPath(videoUrl);
            setLoading(false);
            return;
          }

          // For other URLs, we'll still use them directly
          setVideoPath(videoUrl);
          setLoading(false);
          return;
        }

        // Otherwise try to get the local file
        const playlist = await window.api.playlists.getById(playlistId);

        if (!playlist) {
          throw new Error('Playlist not found');
        }

        // Check if the video exists locally
        const downloadLocation = await window.api.settings.get('downloadLocation');
        if (!downloadLocation) {
          throw new Error('Download location not set');
        }

        const videoExists = await window.api.fs.videoExists(
          playlistId,
          playlist.name,
          videoId,
          'mp4'
        );

        if (videoExists) {
          // Construct the file path
          const filePath = `file://${downloadLocation}/${playlist.name}/${videoId}.mp4`;
          setVideoPath(filePath);
        } else {
          // Try to find the video in the playlist and get its URL
          const video = playlist.videos.find((v: { id: string }) => v.id === videoId);
          if (video && video.url) {
            console.log('Video not found locally, using URL:', video.url);
            setVideoPath(video.url);
          } else {
            throw new Error('Video not found locally and no URL provided');
          }
        }
      } catch (err) {
        console.error('Error checking video file:', err);
        if (videoUrl) {
          setVideoPath(videoUrl);
        } else {
          setError('Failed to load video. It may not be downloaded yet.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkVideoFile();
  }, [videoId, playlistId, videoUrl]);

  return (
    <div className="relative overflow-hidden bg-black rounded-md w-full aspect-video">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-center mb-4">{error}</p>

          {/* Retry button */}
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setLoading(true);
              // Force reload the player
              if (videoPath) {
                const currentPath = videoPath;
                setVideoPath(null);
                setTimeout(() => setVideoPath(currentPath), 100);
              }
              setLoading(false);
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          {videoPath && (
            <ReactPlayer
              url={videoPath}
              playing={playing}
              volume={volume}
              muted={muted}
              width="100%"
              height="100%"
              onProgress={handleProgress}
              onDuration={handleDuration}
              onError={(e) => {
                console.error('Player error:', e);
                setError('Failed to play video. The file may be corrupted or in an unsupported format.');
              }}
              config={{
                youtube: {
                  playerVars: {
                    origin: window.location.origin,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    controls: 1,
                    iv_load_policy: 3,  // Disable annotations
                    fs: 1,              // Enable fullscreen button
                    playsinline: 1,     // Play inline on mobile devices
                    disablekb: 0,       // Enable keyboard controls
                    enablejsapi: 1,     // Enable JavaScript API
                    autoplay: playing ? 1 : 0  // Respect the playing state
                  },
                  embedOptions: {},
                  onUnstarted: () => console.log('Video unstarted')
                },
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                  },
                },
              }}
            />
          )}

          {/* Video title */}
          {title && (
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium truncate">{title}</h3>
            </div>
          )}

          {/* Controls overlay - only show for non-YouTube videos */}
          {videoPath && !videoPath.includes('youtube.com') && (hasNext || hasPrevious) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              {/* Progress bar */}
              <div className="mb-2">
                <Slider
                  value={[played]}
                  min={0}
                  max={1}
                  step={0.001}
                  onValueChange={handleSeekChange}
                  onValueCommit={handleSeekMouseUp}
                  onMouseDown={handleSeekMouseDown}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Play/Pause button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Simple playlist navigation for YouTube videos */}
          {videoPath && videoPath.includes('youtube.com') && (hasNext || hasPrevious) && (
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              {hasPrevious && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <SkipBack className="h-4 w-4" />
                  <span className="ml-1">Previous</span>
                </Button>
              )}

              {hasNext && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onNext}
                  disabled={!onNext}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <span className="mr-1">Next</span>
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
```

### Phase 3.4: Download Quality Selection

**Tasks:**
- [ ] Improve video quality selection for downloads
- [ ] Ensure downloads use the best available quality up to the requested maximum
- [ ] Add better logging for quality selection
- [ ] Add unit tests for quality selection
- [ ] Add support for 8K (4320p) video quality
- [ ] Add 'best' quality option to always select the highest available quality

**Files Modified:**
- [ ] `src/backend/services/ytDlp/video/formatSelection.ts` (~20 lines)
  - Enhanced format string to better handle quality selection
  - Improved fallback strategy for when requested quality isn't available
  - Added support for 'best' quality option
- [ ] `src/backend/services/ytDlp/video/download.ts` (~15 lines)
  - Added better logging for quality selection
  - Improved user feedback about available quality
  - Added support for 'best' quality option
- [ ] `src/backend/services/ytDlp/video/fallbackStrategies.ts` (~30 lines)
  - Enhanced fallback strategy to select the best available quality
  - Added more detailed logging for quality selection
  - Added special handling for 'best' quality option
- [ ] `src/shared/constants/appConstants.ts` (~1 line)
  - Added 8K (4320p) and 'best' to VIDEO_QUALITIES constant
- [ ] `src/shared/types/appTypes.ts` (~1 line)
  - Updated DownloadOptions interface to include 4320p and 'best' quality options
- [ ] `src/frontend/features/downloads/components/FormatSelector.tsx` (~10 lines)
  - Updated UI to show 8K and 'Best Available' quality options
- [ ] `src/frontend/pages/Settings/SettingsPage.tsx` (~10 lines)
  - Updated settings page to include 8K and 'Best Available' quality options
- [ ] `src/backend/services/formatConverter.ts` (~10 lines)
  - Updated to handle 8K and 'best' quality options
- [ ] `tests/backend/services/ytDlp/formatSelection.test.ts` (~50 lines)
  - Added unit tests for quality selection
  - Tests for when requested quality is available
  - Tests for when requested quality is not available

**Implementation Details:**
- Modified the format string to better handle quality selection with proper fallbacks
- Added logic to select the best available quality when the requested quality isn't available
- Added support for 8K (4320p) video quality
- Added 'best' quality option that always selects the highest available quality
- Improved logging to show what quality is actually being downloaded
- Updated UI components to show the new quality options
- Added unit tests to verify the behavior

### Phase 3.5: Download Status

**Tasks:**
- [ ] Implement download status tracking
- [ ] Create UI for displaying download progress

**Files Created:**
- [ ] `src/frontend/stores/downloadStore.ts` (~150 lines)
  - Zustand store for download state management
  - Persistent storage with localStorage
  - IPC communication with main process
  - Filtering and statistics functions
- [ ] `src/frontend/features/downloads/components/DownloadStatus.tsx` (~70 lines)
  - Main download status component
  - Integration with download store
  - Empty state handling
- [ ] `src/frontend/features/downloads/components/DownloadList.tsx` (~150 lines)
  - Tabbed interface for filtering downloads by status
  - Integration with download store and IPC API
  - Actions for pause, resume, cancel, and remove
- [ ] `src/frontend/features/downloads/components/DownloadItem.tsx` (~200 lines)
  - Individual download item display
  - Progress bar with status-based styling
  - Action buttons based on download status
  - Tooltips for better UX
- [ ] `src/frontend/utils/formatUtils.ts` (~100 lines)
  - Utility functions for formatting file sizes, durations, and dates

**Implementation Details:**
- Created a Zustand store for managing download state with persistence
- Implemented real-time updates from the main process via IPC
- Added filtering by download status (all, active, paused, completed, failed)
- Created a tabbed interface for easy navigation between download states
- Added progress bars with status-based styling
- Implemented action buttons that change based on download status
- Added tooltips for better user experience
- Integrated with existing download manager in the backend

### Phase 3.6: Single Video Management

**Tasks:**
- [ ] Implement management of individual video entries (e.g., adding to local playlists, metadata editing, tracking downloaded files). (Direct URL downloads handled by DownloadContentDialog in Phase 3.6.5)
- [x] Create UI for adding individual videos to playlists
- [x] Develop video search and import features
- [x] Add video metadata editing capabilities

**Files Created:**
- [x] `src/backend/services/singleVideoManager.ts` (~200 lines)
  - Functions for URL validation, metadata extraction for single videos, and supporting individual video management within the app (e.g., before adding to a playlist or for pre-download checks within `DownloadContentDialog`).
  - Error handling for invalid URLs

- [x] `src/frontend/features/videos/components/AddVideoForm.tsx` (~250 lines)
  - Form for adding individual videos to playlists
  - Video URL validation
  - Video preview with metadata
  - YouTube search integration

- [x] `src/frontend/features/videos/components/VideoSearch.tsx` (~200 lines)
  - Search for YouTube videos
  - Video results display with thumbnails
  - Selection and add to playlist functionality

- [x] `src/frontend/features/videos/components/VideoCard.tsx` (~150 lines)
  - Individual video display component
  - Video preview with thumbnail
  - Action buttons for download, play, and remove

- [x] `src/frontend/features/playlists/components/VideoList.tsx` (~200 lines)
  - List of videos in a playlist
  - Drag and drop reordering
  - Batch actions (download, remove)

- [x] `src/backend/ipc/videoHandlers.ts` (~150 lines)
  - IPC handlers for video-specific operations (e.g., metadata extraction, adding to playlists, managing local video files).

**Implementation Details:**
- **Single Video Management**: Focus on managing video entities within the app. Direct URL downloads for new content are handled by `DownloadContentDialog.tsx` (Phase 3.6.5).
- **Video Adding**: Created UI for adding individual videos to existing playlists, including:
  - Form for pasting YouTube URLs
  - Video preview with metadata (title, duration, thumbnail)
  - Validation to ensure valid YouTube video URLs
- **Video Search**: Integrated YouTube search to find and add videos by searching instead of pasting URLs
- **Video Management**: Added the ability to:
  - Edit video metadata (title, description)
  - Reorder videos within a playlist with drag and drop
  - Execute batch download/remove operations
- **Optimization**: Implemented caching for video metadata to reduce API calls
- **Error Handling**: Added comprehensive error handling for common issues like:
  - Invalid URLs
  - Unavailable videos
  - Network failures
  - Permission problems
- **UI Integration**: Created seamless integration with the existing UI design

### Phase 3.6.5: Advanced Download Quality Management

**Tasks:**
- [ ] Implement adaptive quality selection for videos (MP4 priority).
- [ ] Create quality detection service using `yt-dlp -F` to find all available formats/qualities for individual videos and playlists.
- [ ] Develop dynamic quality option display and directory selection in `DownloadContentDialog.tsx` (for single videos and playlists via URL).
- [ ] Develop dynamic quality option display and directory selection in `DownloadPlaylistDialog.tsx` (for already imported playlists).
- [ ] Ensure robust thumbnail embedding into all downloaded MP4 videos:
    1.  Download the thumbnail image file separately using `yt-dlp` (e.g., `yt-dlp --write-thumbnail --skip-download URL_HERE -o path/to/thumbnail.%(ext)s`).
    2.  Convert the downloaded thumbnail (e.g., WEBP, PNG) to a standard format like JPG using `fluent-ffmpeg`.
    3.  Embed the converted thumbnail file into the MP4 video using `fluent-ffmpeg`.
- [ ] Implement fallback strategy: if selected quality is unavailable, download the highest available quality for that video.
- [ ] Add quality metadata tracking for downloaded videos (store what quality was actually downloaded).
- [ ] Update UI to display actual downloaded quality.
- [ ] Ensure `yt-dlp` is configured with `--ffmpeg-location` for robust video/audio stream merging.

**Files Created/Updated:**
- [ ] `src/backend/services/ytDlp/video/qualityDetector.ts` (~200 lines)
  - Functions to parse `yt-dlp -F` output.
  - Logic to determine available MP4 qualities (144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p/4K, 4320p/8K, etc., including FPS).
  - Caching mechanism for quality information.
  - Methods to determine max quality for playlists (highest common or highest individual).
- [ ] `src/frontend/components/Modals/DownloadContentDialog.tsx` (~350 lines, new or refactored)
  - Unified dialog to handle downloads for single YouTube videos or playlists *directly via URL* (content not yet imported).
  - Input field for YouTube URL.
  - Dynamic quality selection options based on detected video/playlist qualities.
  - UI to display only available MP4 quality options.
  - Directory selection component.
  - Intelligent default selection for quality and directory.
  - Clear indication of max available quality for the content.
- [ ] `src/frontend/components/Modals/DownloadPlaylistDialog.tsx` (~300 lines, updated or new for this specific purpose)
  - Dialog to handle downloads for *already imported playlists*.
  - Operates on an existing playlist ID from the application state.
  - Dynamic quality selection options based on detected video/playlist qualities.
  - UI to display only available MP4 quality options.
  - Directory selection component (can override default or playlist-specific download location).
  - Intelligent default selection for quality.
  - Clear indication of max available quality for the playlist or individual videos within.
- [ ] `src/backend/services/ytDlp/video/download.ts` (~250 lines, updated)
  - Enhanced format selection string for `yt-dlp` to prioritize MP4 and selected quality.
  - Logic to use the `qualityDetector.ts` service.
  - Ensure `yt-dlp` commands include `--ffmpeg-location` pointing to a valid `ffmpeg` binary for reliable stream merging.
  - Orchestration of: 
      1. Downloading thumbnail image file via `yt-dlp`.
      2. Calling `ffmpegService.ts` for thumbnail image conversion (e.g., WEBP/PNG to JPG).
      3. Calling `ffmpegService.ts` for embedding the converted thumbnail into the video file.
  - Fallback strategy implementation for video quality.
  - Addition of metadata tracking for downloaded video's actual quality.
  - Improved logging for quality selection process.
- [ ] `src/backend/services/ffmpegService.ts` (~150 lines, potentially new or updated)
  - Function to embed an image file (thumbnail) into an MP4 video file.
  - Function to convert common image formats (WEBP, PNG) to JPG for embedding.
- [ ] `src/backend/services/ytDlp/playlist/download.ts` (~200 lines, updated)
  - Batch quality selection with per-video adaptations using `qualityDetector.ts`.
  - Ensure `yt-dlp` commands include `--ffmpeg-location`.
  - Progress tracking to include actual quality information.
  - Orchestration for thumbnail download and embedding for each video in the playlist.
- [ ] `src/shared/types/download.ts` (~100 lines, updated)
  - Enhanced types for `VideoQuality` to potentially include resolution, FPS.
  - Interface updates for storing and displaying actual downloaded quality.
- [ ] `src/shared/constants/videoConstants.ts` (~30 lines, updated)
  - Updated list of `VIDEO_QUALITIES` to include more granular options and future-proofing.
  - Potentially a mapping of quality labels to `yt-dlp` format selection specifics if needed.

**Implementation Details:**
- **Dynamic Quality Detection**:
  - Before showing download options, `qualityDetector.ts` will use `yt-dlp -F <URL>` to get available formats.
  - Parse this to identify unique MP4 resolutions and frame rates.
  - For playlists, this might involve checking a sample of videos or the most popular ones to determine a representative set of available qualities.
- **Adaptive Quality Selection in UI**:
  - Download modals (`DownloadContentDialog`, `DownloadVideoDialog`) will populate their quality dropdowns based on the results from `qualityDetector.ts`.
  - The UI will clearly indicate the maximum quality available for the specific video or playlist.
- **Quality Fallback Strategy**:
  - When a download is initiated:
    1. The `download.ts` service will attempt to use the user's selected MP4 quality.
    2. If `yt-dlp` cannot find that specific quality, the service will automatically select the next highest *available* MP4 quality for that video.
    3. The actual quality downloaded will be logged and stored.
- **Thumbnail Embedding**:
  - The `yt-dlp` command in `download.ts` will include `--embed-thumbnail`.
- **Metadata**:
  - The database schema and shared types will be updated to store `actualDownloadedQuality` for each video.
  - The UI will display this information where relevant (e.g., video details, history).

**Sample Code for Dynamic Quality Detection (`qualityDetector.ts` concept):**
```typescript
import { execAsync } from '../utils/execUtils'; // Assuming a utility for promise-based exec

export type VideoQuality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best'; // Extend as needed

interface FormatDetail {
  format_id: string;
  ext: string;
  resolution: string; // e.g., "1920x1080"
  height?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
}

// Function to parse yt-dlp -F output
async function getAvailableFormats(videoUrl: string): Promise<FormatDetail[]> {
  // Sanitize URL
  const command = `yt-dlp -J --flat-playlist "${videoUrl}"`; // -J for JSON output
  try {
    const { stdout } = await execAsync(command);
    const videoInfo = JSON.parse(stdout);
    // yt-dlp with -J on a single video URL provides 'formats' array
    // For playlists with --flat-playlist, it lists entries. Need to pick one or iterate.
    // For simplicity, assuming a single video URL or handling the first video of a playlist for quality sampling.
    let formats = videoInfo.formats || (videoInfo.entries && videoInfo.entries[0] ? videoInfo.entries[0].formats : []);
    if (!formats && videoInfo.entries && videoInfo.entries.length > 0) {
      // If it's a playlist dump, we might need to fetch formats for an individual video
      // This is a simplification; real implementation would be more robust
      const firstVideoUrl = videoInfo.entries[0].url;
      const firstVideoCommand = `yt-dlp -J "${firstVideoUrl}"`;
      const { stdout: firstVideoStdout } = await execAsync(firstVideoCommand);
      formats = JSON.parse(firstVideoStdout).formats;
    }
    return formats || [];
  } catch (error) {
    console.error('Failed to get available formats:', error);
    return [];
  }
}

export async function getAvailableMp4Qualities(videoUrl: string): Promise<VideoQuality[]> {
  const formats = await getAvailableFormats(videoUrl);
  const qualities = new Set<VideoQuality>();

  formats.forEach(format => {
    if (format.ext === 'mp4' && format.vcodec && format.vcodec !== 'none' && format.height) {
      // Basic mapping, can be more sophisticated to include FPS
      if (format.height >= 4320) qualities.add('4320p');
      else if (format.height >= 2160) qualities.add('2160p');
      else if (format.height >= 1440) qualities.add('1440p');
      else if (format.height >= 1080) qualities.add('1080p');
      else if (format.height >= 720) qualities.add('720p');
      else if (format.height >= 480) qualities.add('480p');
      else if (format.height >= 360) qualities.add('360p');
      else if (format.height >= 240) qualities.add('240p');
      else if (format.height >= 144) qualities.add('144p');
    }
  });
  
  const sortedQualities = Array.from(qualities).sort((a, b) => {
    const qualityValue = (q: VideoQuality) => parseInt(q.replace('p','').replace('best','99999')); // Simple sort order
    return qualityValue(b) - qualityValue(a); // Sort descending
  });
  if (sortedQualities.length > 0) {
    sortedQualities.unshift('best'); // Always offer 'best'
  } else {
     // Fallback if no MP4 video formats found (e.g. audio only, or other video types)
     // Or if format parsing failed.
    return ['best'];
  }
  return sortedQualities;
}
```

**Sample Download Modal Update (conceptual for `DownloadContentDialog.tsx` or `DownloadPlaylistDialog.tsx`):**
```tsx
// Inside DownloadContentDialog.tsx or DownloadPlaylistDialog.tsx

const [detectedQualities, setDetectedQualities] = useState<VideoQuality[]>(['best', '1080p', '720p']); // Default before detection
const [isDetecting, setIsDetecting] = useState(false);

useEffect(() => {
  if (isOpen && videoOrPlaylistUrl) { // videoOrPlaylistUrl passed as prop
    setIsDetecting(true);
    // Call IPC to backend qualityDetector.ts
    window.api.ytDlp.getAvailableQualities(videoOrPlaylistUrl)
      .then(qualities => {
        if (qualities && qualities.length > 0) {
          setDetectedQualities(qualities);
          // Set default selected quality, e.g., user's preferred or highest available
          setSelectedQuality(qualities.includes(userPreferredQuality) ? userPreferredQuality : qualities[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsDetecting(false));
  }
}, [isOpen, videoOrPlaylistUrl, userPreferredQuality]);

// ... in the Select component for quality:
// <SelectContent>
//   {isDetecting ? <SelectItem value="loading" disabled>Detecting...</SelectItem> :
//     detectedQualities.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)
//   }
// </SelectContent>
```

## Phase 4: Google & YouTube Integration

### Phase 4.1: Google OAuth2 Authentication

**Tasks:**
- [ ] Implement Google OAuth2 authentication with PKCE flow
- [ ] Set up secure token storage
- [ ] Create a secure configuration system for production builds

**Files to Create:**
- [ ] `src/backend/services/authManager.ts` (~200 lines)
  - OAuth2 implementation with PKCE
  - Token management and refresh
- [ ] `src/backend/services/secureStorage.ts` (~150 lines)
  - Encrypted storage for user tokens

**Sample Code for secure configuration in production:**
```typescript
// src/backend/services/secureConfig.ts
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import * as crypto from 'crypto';
import Store from 'electron-store';

// Create an encrypted store for user tokens
const encryptionKey = getOrCreateEncryptionKey();

// Secure store for user tokens
const secureStore = new Store({
  name: 'secure-config',
  encryptionKey,
  clearInvalidConfig: true
});

// Get or generate a machine-specific encryption key
function getOrCreateEncryptionKey(): string {
  const keyFile = path.join(app.getPath('userData'), '.key');

  try {
    // Try to read existing key
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf8');
    }

    // Generate new key if none exists
    const newKey = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, newKey, { mode: 0o600 }); // Only user can read/write
    return newKey;
  } catch (error) {
    console.error('Error handling encryption key:', error);
    // Fallback to a derived key if file operations fail
    return crypto
      .createHash('sha256')
      .update(app.getPath('userData'))
      .digest('hex');
  }
}

// Built-in OAuth configuration values protected with obfuscation
// These will be obfuscated during the build process
export function getOAuthConfig(): { clientId: string, clientSecret: string } {
  // In development, load from .env file if present
  if (process.env.NODE_ENV === 'development') {
    try {
      const dotenv = require('dotenv');
      dotenv.config();

      const envClientId = process.env.GOOGLE_CLIENT_ID;
      const envClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (envClientId && envClientSecret) {
        return {
          clientId: envClientId,
          clientSecret: envClientSecret
        };
      }
    } catch (e) {
      console.log('dotenv not loaded');
    }
  }

  // For production builds, use obfuscated built-in credentials
  // These will be replaced during the build process
  return {
    clientId: deobfuscate('__OBFUSCATED_CLIENT_ID__'),
    clientSecret: deobfuscate('__OBFUSCATED_CLIENT_SECRET__')
  };
}

// Simple deobfuscation technique (this would be more complex in real implementation)
function deobfuscate(obfuscated: string): string {
  // In real implementation, this would be more sophisticated
  if (obfuscated === '__OBFUSCATED_CLIENT_ID__') {
    return ''; // Will be replaced during build
  }
  if (obfuscated === '__OBFUSCATED_CLIENT_SECRET__') {
    return ''; // Will be replaced during build
  }
  return obfuscated;
}

// Store tokens securely
export function storeToken(provider: string, token: string): void {
  secureStore.set(`tokens.${provider}`, token);
}

// Retrieve tokens securely
export function getToken(provider: string): string | null {
  return secureStore.get(`tokens.${provider}`, null);
}
```

**Sample Code for `src/backend/services/authManager.ts` with PKCE flow:**
```typescript
import { BrowserWindow } from 'electron';
import crypto from 'crypto';
import { getOAuthConfig, storeToken, getToken } from './secureConfig';
import axios from 'axios';

// Generate a code verifier and challenge for PKCE
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

export async function authenticate(): Promise<string> {
  // Get OAuth configuration
  const { clientId } = getOAuthConfig();

  // Generate PKCE values
  const { verifier, challenge } = generatePKCE();

  // Create the auth window
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Build the authorization URL with PKCE
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob'); // Desktop app flow
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('code_challenge', challenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/youtube.readonly');
  authUrl.searchParams.append('access_type', 'offline');

  // Load the auth URL
  authWindow.loadURL(authUrl.toString());

  // Wait for the redirect to the success page
  return new Promise((resolve, reject) => {
    authWindow.webContents.on('will-redirect', async (event, url) => {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');

      if (code) {
        authWindow.close();

        try {
          // Exchange the code for tokens using PKCE
          const { clientId, clientSecret } = getOAuthConfig();
          const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: clientId,
            client_secret: clientSecret, // Used only for token exchange
            code,
            code_verifier: verifier,
            grant_type: 'authorization_code',
            redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
          });

          const { access_token, refresh_token } = tokenResponse.data;

          // Store tokens securely
          storeToken('google', access_token);
          if (refresh_token) {
            storeToken('google_refresh', refresh_token);
          }

          resolve(access_token);
        } catch (error) {
          reject(error);
        }
      }
    });

    authWindow.on('closed', () => {
      reject(new Error('Authentication window was closed'));
    });
  });
}

export function getGoogleToken(): string | null {
  return getToken('google');
}

// For token refresh
export async function refreshToken(): Promise<string | null> {
  const refreshToken = getToken('google_refresh');

  if (!refreshToken) {
    return null;
  }

  try {
    const { clientId, clientSecret } = getOAuthConfig();
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const { access_token } = response.data;
    storeToken('google', access_token);
    return access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}
```

**Sample build script for credentials obfuscation:**
```javascript
// scripts/obfuscate-credentials.js
const fs = require('fs');
const path = require('path');

// Load credentials from .env or environment
require('dotenv').config();
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

// Simple obfuscation (would be more sophisticated in production)
function obfuscate(value) {
  // In real implementation, this would use a more secure method
  return Buffer.from(value).toString('base64');
}

// Read secureConfig.ts
const configPath = path.join(__dirname, '../src/backend/services/secureConfig.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace placeholders with obfuscated values
configContent = configContent.replace(
  '__OBFUSCATED_CLIENT_ID__',
  obfuscate(clientId)
);
configContent = configContent.replace(
  '__OBFUSCATED_CLIENT_SECRET__',
  obfuscate(clientSecret)
);

// Update the deobfuscate function to match our obfuscation method
configContent = configContent.replace(
  /function deobfuscate\(obfuscated: string\): string \{[\s\S]*?\}/,
  `function deobfuscate(obfuscated: string): string {
  try {
    return Buffer.from(obfuscated, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
}`
);

// Write the updated file
fs.writeFileSync(configPath, configContent);
console.log('Credentials obfuscated and injected into secureConfig.ts');
```

**Development Setup (only for app developer):**
```bash
# Create a .env file (only needed for development)
echo "GOOGLE_CLIENT_ID=your-client-id-here" > .env
echo "GOOGLE_CLIENT_SECRET=your-client-secret-here" >> .env

# Run the obfuscation script before packaging the app
node scripts/obfuscate-credentials.js
```

### Phase 4.2: Fetch YouTube Playlists

**Tasks:**
- [ ] Integrate YouTube API for fetching user playlists
- [ ] Add API service for YouTube operations

**Files to Create:**
- [ ] `src/backend/services/youtubeApi.ts` (~150 lines)
  - YouTube API client
  - Playlist fetching functions

**Sample Code for `src/backend/services/youtubeApi.ts`:**
```typescript
import { google } from 'googleapis';
import { getToken } from './authManager';

const youtube = google.youtube({ version: 'v3', auth: getToken() });

export async function fetchPlaylists(): Promise<any[]> {
  const response = await youtube.playlists.list({
    part: ['snippet', 'contentDetails'],
    mine: true,
    maxResults: 50,
  });
  return response.data.items || [];
}
```

### Phase 4.3: Private Playlist Downloads

**Tasks:**
- [ ] Extend yt-dlp manager for private playlist support
- [ ] Implement token-based authentication for downloads

**Files to Create:**
- [ ] `src/backend/services/privatePlaylistManager.ts` (~150 lines)
  - Functions specific to private playlist handling

**Sample Code for private playlist support (adding to `src/backend/services/ytDlpManager.ts`):**
```typescript
export async function downloadPrivatePlaylist(playlistUrl: string, playlistName: string, token: string): Promise<void> {
  const outputDir = await createPlaylistDir(playlistName);
  const command = `yt-dlp --oauth2 "${token}" --yes-playlist -f "bestvideo+bestaudio" -o "${outputDir}/%(title)s.%(ext)s" "${playlistUrl}"`;
  const { stderr } = await execAsync(command);
  if (stderr) throw new Error(`Private playlist download error: ${stderr}`);
}
```

### Phase 4.4: Account Management UI

**Tasks:**
- [ ] Create UI for managing Google accounts
- [ ] Implement account switching

**Files to Create:**
- [ ] `src/renderer/features/accounts/components/AccountManager.tsx` (~150 lines)
  - Account management UI
- [ ] `src/renderer/stores/accountStore.ts` (~100 lines)
  - Zustand store for account state

**Sample Code for `src/renderer/pages/Settings/SettingsPage.tsx`:**
```typescript
import React from 'react';
import { authenticate } from '../../../backend/services/authManager';
import { useStore } from '../../stores/accountStore';

const SettingsPage: React.FC = () => {
  const accounts = useStore((state) => state.accounts);
  const addAccount = useStore((state) => state.addAccount);

  const handleLogin = async () => {
    const token = await authenticate();
    addAccount('user@example.com', token); // Replace with actual email from token
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <button onClick={handleLogin} className="bg-green-500 text-white p-2 rounded mb-4">
        Add Google Account
      </button>
      <ul className="space-y-2">
        {accounts.map((acc) => (
          <li key={acc.email} className="p-2 bg-white rounded shadow">
            {acc.email} - Connected
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SettingsPage;
```

**Sample Code for `src/renderer/stores/accountStore.ts`:**
```typescript
import { create } from 'zustand';

interface Account {
  email: string;
  token: string;
}

interface AccountState {
  accounts: Account[];
  addAccount: (email: string, token: string) => void;
}

export const useStore = create<AccountState>((set) => ({
  accounts: [],
  addAccount: (email, token) => set((state) => ({
    accounts: [...state.accounts, { email, token }],
  })),
}));
```

## Phase 5: Video Status & Streaming

### Phase 5.1: Video Status Checking

**Tasks:**
- [ ] Implement video availability checking
- [ ] Create status indicators

**Files to Create:**
- [ ] `src/backend/services/videoStatusChecker.ts` (~150 lines)
  - Functions for checking video availability
- [ ] `src/frontend/features/videos/components/VideoStatusIndicator.tsx` (~100 lines)
  - Status indicator component

**Sample Code for video status checking (adding to `src/backend/services/ytDlpManager.ts`):**
```typescript
export async function checkVideoStatus(url: string): Promise<string> {
  const command = `yt-dlp --get-title "${url}"`;
  try {
    const { stdout } = await execAsync(command);
    return stdout ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
```

### Phase 5.2: Streaming Support

**Tasks:**
- [ ] Extend video player for streaming support
- [ ] Add fallback options between local and streaming content

**Files to Create:**
- [ ] `src/frontend/features/player/components/StreamSelector.tsx` (~150 lines)
  - UI for selecting between stream and local playback
- [ ] `src/frontend/utils/frontendUtils.ts` (~100 lines)
  - Utility functions for the frontend process

**Sample Code for adding streaming to VideoPlayer:**
```typescript
import React from 'react';
import ReactPlayer from 'react-player';
import fs from 'fs-extra';
import { getSetting } from '../../../../backend/services/settingsManager';

interface VideoPlayerProps {
  videoId: string;
  playlistName: string;
  url?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, playlistName, url }) => {
  const filePath = `${getSetting('downloadLocation', '~/Downloads/Videos')}/${playlistName}/${videoId}.mp4`;
  const playUrl = fs.existsSync(filePath) ? `file://${filePath}` : url;

  return (
    <div className="p-4">
      <ReactPlayer url={playUrl} controls width="100%" height="auto" />
    </div>
  );
};

export default VideoPlayer;
```

### Phase 5.3: Status UI

**Tasks:**
- [ ] Create playlist detail view with video status
- [ ] Implement thumbnail fetching

**Files to Create:**
- [ ] `src/frontend/features/playlists/components/PlaylistView.tsx` (~250 lines)
  - Detailed playlist view with video status
- [ ] `src/backend/services/thumbnailUtils.ts` (~150 lines)
  - Thumbnail fetching and caching

**Sample Code for `src/frontend/features/playlists/components/PlaylistView.tsx`:**
```typescript
import React, { useEffect, useState } from 'react';
import { useStore } from '../../../stores/playlistStore';
import { checkVideoStatus } from '../../../../backend/services/ytDlpManager';
import VideoPlayer from '../../player/components/VideoPlayer';

const PlaylistView: React.FC<{ playlistName: string }> = ({ playlistName }) => {
  const playlist = useStore((state) => state.playlists.find((p) => p.name === playlistName));
  const [statuses, setStatuses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    playlist?.videos.forEach(async (video) => {
      const status = await checkVideoStatus(video.url);
      setStatuses((prev) => ({ ...prev, [video.id]: status }));
    });
  }, [playlist]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">{playlistName}</h2>
      <ul className="space-y-2">
        {playlist?.videos.map((video) => (
          <li key={video.id} className="p-2 bg-white rounded shadow">
            {video.title} - {statuses[video.id] || 'checking'}
            <VideoPlayer videoId={video.id} playlistName={playlistName} url={video.url} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlaylistView;
```

## Phase 6: Advanced Features & Polish

### Phase 6.1: Tagging

**Tasks:**
- [ ] Implement playlist tagging system
- [ ] Add tag filtering UI

**Files to Create:**
- [ ] `src/frontend/features/tags/components/TagManager.tsx` (~150 lines)
  - Tag creation and management UI
- [ ] `src/frontend/features/tags/components/TagFilter.tsx` (~100 lines)
  - Tag-based filtering component

**Sample Code for adding tagging to playlistStore.ts:**
```typescript
interface Playlist {
  name: string;
  videos: { id: string; title: string; url: string }[];
  tags?: string[];
}

export const useStore = create<PlaylistState>((set) => ({
  playlists: [],
  addPlaylist: (name, videos) => {
    const newPlaylist = { name, videos };
    writeMetadata(name, newPlaylist);
    set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
  },
  addTag: (name: string, tag: string) => set((state) => {
    const updated = state.playlists.map((p) =>
      p.name === name ? { ...p, tags: [...(p.tags || []), tag] } : p
    );
    writeMetadata(name, updated.find((p) => p.name === name));
    return { playlists: updated };
  }),
}));
```

### Phase 6.2: Auto-Updates

**Tasks:**
- [ ] Create playlist auto-update functionality
- [ ] Implement scheduled refresh

**Files to Create:**
- [ ] `src/backend/services/playlistUpdater.ts` (~150 lines)
  - Automatic playlist refresh logic
  - Scheduling functions

**Sample Code for `src/backend/services/playlistUpdater.ts`:**
```typescript
import { getPlaylistMetadata, importPlaylist } from './ytDlpManager';
import { getSetting } from './settingsManager';

export function startAutoUpdate(): void {
  const interval = getSetting('refreshInterval', 30 * 60 * 1000); // 30 min default
  setInterval(async () => {
    const playlists = getSetting('playlists', []);
    for (const pl of playlists) {
      await importPlaylist(pl.url, pl.name);
    }
  }, interval);
}
```

### Phase 6.3: UI Polish

**Tasks:**
- [ ] Implement responsive design improvements for different screen sizes
- [ ] Add animations and transitions for UI interactions
- [ ] Create a comprehensive light/dark theme system
- [ ] Enhance accessibility features
- [ ] Implement UI consistency improvements
- [ ] Add micro-interactions and feedback elements
- [ ] Create selective glassmorphism components with proper contrast
- [ ] Implement advanced motion design patterns
- [ ] Add responsive typography scaling
- [ ] Create customizable user experience options

**Files to Create/Update:**

- [ ] `src/frontend/features/theme/components/ThemeToggle.tsx` (~100 lines)
  - Animated sun/moon toggle for theme switching
  - Smooth transition between themes with physical momentum
  - Keyboard controls and proper ARIA labels
  - User preference persistence

- [ ] `src/frontend/components/ui/toast.tsx` (~150 lines)
  - Toast notifications for feedback on actions
  - Support for different statuses (success, error, info, warning)
  - Progress bar for timed notifications
  - Interactive elements for dismissal or actions

- [ ] `src/frontend/components/ui/command.tsx` (~200 lines)
  - Command palette for advanced keyboard navigation
  - Fuzzy search for all application actions
  - Keyboard shortcuts display
  - Recently used commands tracking

- [ ] `src/frontend/components/Layout/AppShell.tsx` (~180 lines)
  - Responsive application shell with collapsible sidebar
  - Support for collapsed navigation on smaller screens
  - Implementation of responsive header with key actions
  - Contextual navigation based on current view

- [ ] `src/frontend/components/ui/hover-card.tsx` (~120 lines)
  - Hover cards for preview information
  - Video previews when hovering over items
  - Additional context without requiring clicks
  - Automatic positioning based on screen edges

- [ ] `src/frontend/styles/animations.css` (~100 lines)
  - Reusable animations for various UI elements
  - Subtle microinteractions (button press, hover states)
  - Loading state animations
  - Physics-based animation utilities

- [ ] `src/frontend/components/ui/scroll-area.tsx` (~80 lines)
  - Custom scrollable areas with themed scrollbars
  - Support for virtualized lists for performance
  - Consistent scrolling experience across platforms
  - Scroll-linked animations

- [ ] `src/frontend/components/ui/glassmorphic-card.tsx` (~150 lines)
  - Selectively applied glassmorphism for visual depth
  - Configurable blur and transparency levels
  - Automatic contrast management for accessibility
  - Fallback solid backgrounds for reduced motion settings

- [ ] `src/frontend/components/ui/dynamic-backgrounds.tsx` (~180 lines)
  - Subtle background patterns and gradients
  - Color scheme adaptation based on content
  - Reduced animation when battery optimization is enabled
  - Customizable intensity preferences

- [ ] `src/frontend/components/ui/accessibility-controls.tsx` (~140 lines)
  - User-adjustable contrast and transparency controls
  - Text size adjustment options
  - Reduced motion toggle
  - Screen reader optimized components

**Implementation Details:**
- Create a design tokens system in Tailwind for consistent UI
- Implement skeleton loading states with subtle animations
- Add context menus for common actions
- Create tooltips for interface elements to improve discoverability
- Implement keyboard shortcuts and display them in the UI
- Create consistent focus states and keyboard navigation
- Add subtle sound effects for important actions (optional, user-configurable)
- Enhance form validations with inline feedback
- Implement drag-and-drop for playlist reordering with visual feedback
- Add scroll animations when navigating between sections
- Ensure proper heading hierarchy for screen readers
- Add ARIA attributes to custom components
- Ensure sufficient color contrast in both themes
- Add focus indicators that work with keyboard navigation
- Include skip links for keyboard users
- Standardize spacing, typography, and color usage
- Implement consistent animation durations and easing functions
- Apply selective glassmorphism with high background blur for better readability
- Implement YouTube-inspired dynamic color accents based on video thumbnails
- Add physical motion characteristics to animations (spring physics, momentum)
- Create a cohesive component system with consistent border-radius and elevation
- Implement progressive reduction (simplify UI for returning users)
- Add content-aware backgrounds that adapt to playlist thumbnails
- Create user-adjustable transparency settings for glassmorphic elements
- Implement subtle parallax effects for depth perception
- Add haptic feedback for touch devices on important actions
- Create animated micro-illustrations for empty states and success screens

**Sample Code for selective glassmorphism with accessibility controls:**
```typescript
import React, { useState } from 'react';
import { cn } from "../../lib/utils";
import { useSettings } from "../../hooks/useSettings";

interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  blurStrength?: 'none' | 'light' | 'medium' | 'strong';
  transparencyLevel?: 'low' | 'medium' | 'high';
  hasText?: boolean;
}

export function GlassmorphicCard({
  children,
  blurStrength = 'medium',
  transparencyLevel = 'medium',
  hasText = true,
  className,
  ...props
}: GlassmorphicCardProps) {
  const { reducedTransparency, highContrast } = useSettings();

  // If user prefers reduced transparency or high contrast, avoid glassmorphism
  const shouldUseGlass = !reducedTransparency && !highContrast;

  // Map settings to actual CSS values
  const blurValues = {
    none: '0',
    light: '4px',
    medium: '8px',
    strong: '16px'
  };

  const transparencyValues = {
    low: '0.85',
    medium: '0.75',
    high: '0.65'
  };

  // Base styles that are always applied
  const baseStyles = "rounded-lg border border-border/30 p-4";

  // Apply glassmorphism conditionally
  const glassStyles = shouldUseGlass
    ? `backdrop-blur-[${blurValues[blurStrength]}] bg-background/[${transparencyValues[transparencyLevel]}] backdrop-saturate-150`
    : "bg-background"; // Solid background fallback

  // If there's text and we're using glass, ensure it has proper contrast
  const textContrastStyles = (shouldUseGlass && hasText)
    ? "text-foreground drop-shadow-sm"
    : "";

  return (
    <div
      className={cn(baseStyles, glassStyles, textContrastStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

**Sample Code for dynamic color extraction from video thumbnails:**
```typescript
import { useState, useEffect } from 'react';
import ColorThief from 'colorthief';

export function useDominantColor(imageUrl: string | null) {
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const colorThief = new ColorThief();

        // Get dominant color
        const dominantRgb = colorThief.getColor(img);
        const dominantHex = rgbToHex(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
        setDominantColor(dominantHex);

        // Get color palette (8 colors)
        const colorPalette = colorThief.getPalette(img, 8);
        const hexPalette = colorPalette.map(rgb =>
          rgbToHex(rgb[0], rgb[1], rgb[2])
        );
        setPalette(hexPalette);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error extracting colors'));
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  // Helper function to convert RGB to HEX
  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  return { dominantColor, palette, isLoading, error };
}
```

**Sample Code for micro-interactions with spring physics:**
```typescript
import { motion, useSpring, useTransform } from 'framer-motion';
import { MouseEvent, useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AnimatedButton({ children, ...props }: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Create a spring animation for the button scale
  const scaleSpring = useSpring(1, {
    stiffness: 700,
    damping: 30
  });

  // Transform the spring value to a slightly smaller scale when pressed
  const scale = useTransform(scaleSpring, [0, 1], [0.95, 1]);

  // Handle mouse events
  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    scaleSpring.set(0);

    // Optional: trigger subtle haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }

    if (props.onMouseDown) {
      props.onMouseDown(e);
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    scaleSpring.set(1);

    if (props.onMouseUp) {
      props.onMouseUp(e);
    }
  };

  return (
    <motion.button
      style={{ scale }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isPressed) {
          setIsPressed(false);
          scaleSpring.set(1);
        }
      }}
      whileHover={{
        backgroundColor: 'var(--hover-bg)',
        y: -2,
        transition: { type: 'spring', stiffness: 500 }
      }}
      className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

### Phase 6.4: Application Auto-Updates

**Tasks:**
- [ ] Implement application auto-update functionality with electron-updater
- [ ] Create update checking and notification system

**Files to Create:**
- [ ] `src/backend/services/appUpdater.ts` (~150 lines)
  - Application update checking and installation
  - Update notification management
- [ ] `src/frontend/features/updates/components/UpdateNotification.tsx` (~100 lines)
  - UI for displaying update availability and progress

**Sample Code for `src/backend/services/appUpdater.ts`:**
```typescript
import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import { getSetting } from './settingsManager';

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (getSetting('checkForUpdates', true)) {
    autoUpdater.checkForUpdatesAndNotify();

    // Check for updates periodically
    const checkInterval = getSetting('updateCheckInterval', 60 * 60 * 1000); // 1 hour default
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, checkInterval);
  }

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true);
}
```

## Phase 7: Testing & Deployment

### Phase 7.1: Unit Testing

**Tasks:**
- [ ] Create unit tests for core functionality
- [ ] Implement component tests

**Files to Create:**
- [ ] `tests/backend/services/downloadManager.test.ts` (~150 lines)
  - Tests for download manager
- [ ] `tests/backend/services/playlistManager.test.ts` (~150 lines)
  - Tests for playlist management
- [ ] `tests/frontend/features/playlists/components/PlaylistList.test.tsx` (~150 lines)
  - Tests for playlist list component
- [ ] `tests/frontend/features/player/components/VideoPlayer.test.tsx` (~150 lines)
  - Tests for video player component
- [ ] `tests/frontend/stores/settingsStore.test.tsx` (~100 lines)
  - Tests for settings store

### Phase 7.2: Packaging
**Branch**: `phase-7-2-packaging`

**Tasks:**
- [ ] Configure Electron Forge for packaging
- [ ] Set up build scripts for all platforms

**Files to Update:**
- [ ] `package.json` (update scripts section)
  - Add build and package scripts

### Phase 7.3: Documentation
**Branch**: `phase-7-3-documentation`

**Tasks:**
- [ ] Create user guides and documentation
- [ ] Write developer documentation

**Files to Create:**
- [ ] `docs/UserGuide.md` (~200 lines)
  - End-user documentation
- [ ] `docs/DEVELOPER.md` (~150 lines)
  - Developer documentation and contribution guidelines

## UI Design and Implementation

### UI Framework and Theme

- [ ] Setup Tailwind CSS with custom configuration:
```bash
npm install tailwindcss@latest postcss autoprefixer
npx tailwindcss init -p
```

- [ ] Configure inspired color palette:
  - Primary:  Red (#FF0000)
  - Dark mode:
    - Main Background: #181818 (deep gray)
    - Secondary Background: #212121 (dark gray)
    - Tertiary Background: #3d3d3d (medium-dark gray)
    - Primary Text: #FFFFFF (white)
    - Secondary Text: #AAAAAA (lighter gray)
    - Accent: #FF0000 (red)
  - Light mode:
    - Main Background: #FFFFFF (white)
    - Secondary Background: #EDEDED (light gray)
    - Primary Text: #212121 (dark gray)
    - Secondary Text: #808080 (medium gray)
    - Accent: #FF0000 (red)
  - Neutral: #AAAAAA (medium gray) for borders and secondary UI elements

- [ ] Create light/dark theme toggle functionality
- [ ] Ensure consistent styling across all components with the theme
- [ ] Implement responsive design with Tailwind's utility classes
- [ ] Utilize Lucide Icons for all application icons to ensure a consistent, modern, and visually appealing user interface.

### Component Development

- [ ] Create reusable UI components following YouTube design patterns:
  - [ ] Custom buttons with YouTube styling
  - [ ] Video cards with thumbnail preview
  - [ ] Playlist containers
  - [ ] Navigation sidebar
  - [ ] Search bar with YouTube-like appearance
  - [ ] Progress indicators for downloads
  - [ ] Video player with YouTube-inspired controls

## Complete File and Folder Structure

```
playlistify/
├── package.json
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
├── electron-forge.config.js
├── src/
│   ├── backend/
│   │   ├── index.ts
│   │   ├── preload.ts
│   │   ├── ipc/
│   │   │   ├── appHandlers.ts
│   │   │   ├── downloadHandlers.ts
│   │   │   ├── fileHandlers.ts
│   │   │   ├── playlistHandlers.ts
│   │   │   ├── settingsHandlers.ts
│   │   │   └── thumbnailHandlers.ts
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── schema.sql
│   │   │   ├── sqlite-adapter.ts
│   │   │   ├── queries.ts
│   │   │   ├── playlistQueries.ts
│   │   │   ├── playlistVideoQueries.ts
│   │   │   ├── videoQueries.ts
│   │   │   ├── downloadQueries.ts
│   │   │   └── historyQueries.ts
│   │   └── services/
│   │       ├── logService.ts
│   │       ├── settingsService.ts
│   │       ├── downloadService.ts
│   │       ├── ytdlpService.ts
│   │       ├── ffmpegService.ts
│   │       ├── playlistService.ts
│   │       ├── playlistVideoService.ts
│   │       ├── playlistImportExportService.ts
│   │       ├── thumbnailService.ts
│   │       ├── youtubePlaylistService.ts
│   │       ├── dependencyService.ts
│   │       └── updateService.ts
│   ├── frontend/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── index.html
│   │   ├── preload.js
│   │   ├── components/
│   │   │   ├── Modals/
│   │   │   │   ├── ConfirmDeleteDialog/
│   │   │   │   │   └── ConfirmDeleteDialog.tsx
│   │   │   │   ├── AddNewPlaylistDialog/
│   │   │   │   │   └── AddNewPlaylistDialog.tsx
│   │   │   │   ├── EditPlaylistDetailsDialog/
│   │   │   │   │   └── EditPlaylistDetailsDialog.tsx
│   │   │   │   ├── DownloadOptionsModal/
│   │   │   │   │   └── DownloadOptionsModal.tsx
│   │   │   │   ├── ImportJsonModal/
│   │   │   │   │   └── ImportJsonModal.tsx
│   │   │   │   ├── ImportPlaylistModal/
│   │   │   │   │   └── ImportPlaylistModal.tsx
│   │   │   │   └── RenamePlaylistModal/
│   │   │   │       └── RenamePlaylistModal.tsx
│   │   │   ├── PlaylistGrid/
│   │   │   │   ├── PlaylistGrid/
│   │   │   │   │   └── PlaylistGrid.tsx
│   │   │   │   └── PlaylistActionsBar/
│   │   │   │       └── PlaylistActionsBar.tsx
│   │   │   ├── PlaylistListView/
│   │   │   │   ├── PlaylistListView/
│   │   │   │   │   └── PlaylistListView.tsx
│   │   │   │   └── PlaylistItemRow/
│   │   │   │       └── PlaylistItemRow.tsx
│   │   │   ├── PlaylistView/
│   │   │   │   └── PlaylistView/
│   │   │   │       └── PlaylistView.tsx
│   │   │   ├── Settings/
│   │   │   │   └── DirectorySelector/
│   │   │   │       └── DirectorySelector.tsx
│   │   │   ├── Sidebar/
│   │   │   │   └── Sidebar/
│   │   │   │       └── Sidebar.tsx
│   │   │   ├── TopNavbar/
│   │   │   │   └── TopNavbar/
│   │   │   │       └── TopNavbar.tsx
│   │   │   └── ui/
│   │   │       ├── Button/
│   │   │       │   └── Button.tsx
│   │   │       ├── Toast/
│   │   │       │   └── Toast.tsx
│   │   │       └── [other UI components]
│   │   ├── hooks/
│   │   │   └── [custom hooks]
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MyPlaylists.tsx
│   │   │   ├── Downloads.tsx
│   │   │   ├── History.tsx
│   │   │   └── Settings.tsx
│   │   ├── router/
│   │   │   └── [router configuration]
│   │   ├── store/
│   │   │   ├── playlistStore.ts
│   │   │   ├── downloadStore.ts
│   │   │   └── appStore.ts
│   │   ├── styles/
│   │   │   └── [global styles and Tailwind configuration]
│   │   └── utils/
│   │       └── [frontend utility functions]
│   └── shared/
│       ├── types/
│       │   ├── electron.d.ts
│       │   └── [other type definitions]
│       └── constants/
│           └── [shared constants]
├── assets/
│   ├── icons/
│   │   └── [application icons]
│   └── images/
│       └── [default images and assets]
├── public/
│   └── [static files]
└── docs/
    └── [documentation files]
```


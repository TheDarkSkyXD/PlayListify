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
npm install yt-dlp-wrap @rse/ffmpeg p-queue react-player winston

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
- [ ] @rse/ffmpeg
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

- [ ] Create base Electron project with TypeScript
- [ ] Set up basic window configuration

**Files Created:**

- [ ] `package.json` (~50 lines)
  - Base dependencies for Electron Forge
  - Scripts for development and building
  - Configuration for Electron Forge plugins
- [ ] `tsconfig.json` (~30 lines)
  - TypeScript configuration
  - Path aliases for imports
- [ ] `src/backend/backend.ts` (~100 lines)
  - Main process entry point
  - Window creation and basic configuration
  - IPC backend process setup
- [ ] `electron-forge.config.js` (~50 lines)
  - Packaging configuration
  - Build paths and output formats

### Phase 1.1: Initialize Electron Project

**Tasks:**

- [ ] Create base Electron project with TypeScript
- [ ] Set up basic window configuration

**Files Created:**

- [ ] `package.json` (~50 lines)
  - Project configuration, dependencies, scripts
- [ ] `tsconfig.json` (~30 lines)
  - TypeScript configuration with strict type checking
- [ ] `src/backend/backend.ts` (~100 lines)
  - Main Electron process entry point
  - Window creation and management
- [ ] `electron-forge.config.js` (~50 lines)
  - Electron Forge build configuration

**Sample Code for `src/backend/backend.ts`:**

```typescript
import { app, BrowserWindow } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadURL("http://localhost:3000"); // Dev server URL
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
app.on("activate", () => mainWindow === null && createWindow());
```

### Phase 1.2: Core Dependency Setup (yt-dlp & ffmpeg)

**Tasks:**

- [ ] Ensure `scripts/start.js` checks for `yt-dlp` and prompts for install if needed.
- [ ] Ensure `scripts/start.js` downloads `yt-dlp` to a managed location (`APP_DATA_DIR/bin`).
- [ ] Ensure `scripts/start.js` checks for `ffmpeg` and prompts for install if needed.
- [ ] Ensure `scripts/start.js` downloads `ffmpeg` to a managed location (`APP_DATA_DIR/bin/ffmpeg`).
- [ ] Create utility functions (`src/backend/utils/pathUtils.ts`) for backend services to retrieve binary paths based on environment variable set by `start.js`.
- [ ] Integrate discovered paths into `ytDlpManager.ts` (when created/modified).
- [ ] Integrate discovered paths into `ffmpegService.ts` (when created/modified).

**Files Created/Updated:**

- [ ] `scripts/start.js` (updated with prompts and install logic)
- [ ] `src/backend/utils/pathUtils.ts` (new utility for path retrieval)
- [ ] `ytdlp/` directory (created at root, though `start.js` uses `APP_DATA_DIR`)
- [ ] `ffmpeg/` directory (created at root, though `start.js` uses `APP_DATA_DIR`)

**Implementation Details:**

- Dependency checking and installation is now handled by the `scripts/start.js` wrapper script before the Electron app launches.
- The script uses a dedicated directory within the user's application data folder (`APP_DATA_DIR`) for binaries.
- The main application retrieves binary paths using `pathUtils.ts`, which reads an environment variable set by `start.js`.
- IPC communication for dependency status is no longer needed as `start.js` handles failures before launch.

### Phase 1.3: Set Up React and UI Libraries

**Tasks:**

- [ ] Integrate React for the frontend process
- [ ] Set up TailwindCSS and Shadcn UI for styling
- [ ] Configure TanStack Router for navigation
- [ ] Implement dark/light theme support
- [ ] Create Sidenavbar component for page navigation
- [ ] Create TopNavbar component for app title and user avatar

**Files Created:**

- [ ] `src/frontend/index.tsx` (~50 lines)
  - Renderer entry point
  - Root React rendering
- [ ] `src/frontend/App.tsx` (~15 lines)
  - Main React component
  - Router integration
- [ ] `postcss.config.js` (~10 lines)
  - PostCSS configuration for Tailwind
- [ ] `tailwind.config.js` (~25 lines)
  - Tailwind CSS configuration
  - Custom YouTube-inspired color scheme
- [ ] `src/frontend/styles/globals.css` (~85 lines)
  - Global styles and Tailwind directives
  - Custom component classes
  - Dark/light mode variables
  - Custom scrollbar styles
- [ ] `src/frontend/router/index.tsx` (~45 lines)
  - TanStack Router configuration
  - Route definitions for Dashboard, Settings, and Playlist pages
- [ ] `src/frontend/pages/Dashboard/Dashboard.tsx` (~25 lines)
  - Dashboard page component with responsive layout
- [ ] `src/frontend/pages/Settings/Settings.tsx` (~30 lines)
  - Settings page component
- [ ] `src/frontend/pages/MyPlaylists/MyPlaylists.tsx` (~15 lines)
  - Layout component for the 'My Playlists' section, contains Outlet for child routes.
- [ ] `src/frontend/pages/MyPlaylists/UserPlaylistsPage.tsx` (~15 lines)
  - Page component that renders the list of user's playlists (e.g., by using PlaylistsIndex.tsx).
- [ ] `src/frontend/pages/MyPlaylists/PlaylistsIndex.tsx` (~284 lines)
  - Component responsible for fetching and displaying the grid/list of all user playlists.
- [ ] `src/frontend/pages/MyPlaylists/PlaylistDetails.tsx` (~111 lines)
  - Component for displaying the detailed view of a single playlist.
- [ ] `src/frontend/pages/Downloads/Downloads.tsx` (~30 lines)
  - Downloads page with progress tracking and management
- [ ] `src/frontend/pages/History/History.tsx` (~30 lines)
  - History page for tracking watched and downloaded content
- [ ] `src/frontend/components/Layout/AppLayout.tsx` (~40 lines)
  - Main application layout shell containing Sidenavbar, TopNavbar, and Outlet for page content. Does not contain theme logic.
- [ ] `src/frontend/components/Layout/Sidenavbar/Sidenavbar.tsx` (~45 lines)
  - Sidenavbar with navigation links (Dashboard, Playlists, Downloads, History, Settings).
- [ ] `src/frontend/components/Layout/TopNavbar/TopNavbar.tsx` (~65 lines)
  - TopNavbar displaying application title, user avatar placeholder, and theme (dark/light mode) toggle button.

**Notes:**

- Implemented TanStack Router for navigation between Dashboard, Settings, and Playlist views
- Created responsive layouts with Tailwind's utility classes
- Set up YouTube-inspired theme with CSS variables for color tokens
- Added support for both light and dark modes (toggle located in TopNavbar)
- Added reusable component classes in global.css (.btn, .input, .select)
- Set up custom scrollbar styling consistent with the application theme
- Organized pages using folder structure with index.tsx files for better organization and code splitting
- Theme context created in `src/frontend/context/ThemeContext.tsx`

### Phase 1.4: Configure Routing and Data Fetching

**Tasks:**

- [ ] Set up routing with TanStack Router
- [ ] Configure React Query for data management

**Files Created/Updated:**

- [ ] `src/frontend/App.tsx`
  - [ ] Set up stale time and refetch options
  - [ ] Added QueryClientProvider with configuration
  - [ ] Implemented theme detection and management
- [ ] `src/shared/types/index.ts` (~85 lines)
  - [ ] Created comprehensive TypeScript interfaces for playlists, videos, settings, etc.
  - [ ] Defined type-safe structures for core application entities
  - [ ] Added error handling types
- [ ] `src/frontend/router/index.tsx` (~45 lines)
  - Implemented TanStack Router with route definitions
  - Set up route structure with dashboard, settings, and playlist views
  - Added catch-all route for redirects
  - Provided type safety through declarations
- [ ] `src/frontend/hooks/usePlaylistQueries.ts` (~140 lines)
  - [ ] Created React Query hooks for data operations
  - [ ] Implemented query caching and invalidation strategies
  - [ ] Added store synchronization with query results
  - [ ] Set up mutation hooks for create, update, and delete operations
- [ ] `src/backend/services/playlistService.ts` (~135 lines)
  - [ ] Implemented playlist data service
  - [ ] Created CRUD operations for playlists
  - [ ] Added YouTube playlist import functionality

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

- [ ] Implement settings management with electron-store
- [ ] Create file system utilities with fs-extra

**Files Created:**

- [ ] `src/backend/services/settingsService.ts` (~150 lines)
  - [ ] Settings storage and retrieval with TypeScript type safety
  - [ ] Default configuration management
  - [ ] Directory initialization
  - [ ] Account management functions
- [ ] `src/backend/utils/fileUtils.ts` (~230 lines)
  - [ ] File system operations for playlists and videos
  - [ ] Directory and file management utilities
  - [ ] Playlist metadata handling
  - [ ] File validation functions
- [ ] `src/backend/ipc/file-handlers.ts` (~150 lines)
  - [ ] IPC communication between backend and frontend processes
  - [ ] Settings IPC handlers
  - [ ] File system operation handlers
  - [ ] Path validation handlers
- [ ] `src/backend/ipc/settings-handlers.ts` (~50 lines)
  - [ ] IPC handlers for settings management
  - [ ] Type-safe getters and setters for application settings

**Notes:**

- Used electron-store for persistent settings with strict TypeScript typing
- Implemented comprehensive file system utilities for playlist and video management
- Created structured directory organization for downloads and playlists
- Added proper error handling and logging throughout the file operations
- Set up IPC handlers for all file system and settings operations
- Implemented file validation and sanitization for security

### Phase 1.6: IPC Communication

**Tasks:**

- [ ] Set up IPC communication channels
- [ ] Implement type-safe API for frontend process

**Files Created:**

- [ ] `src/backend/ipc/app-handlers.ts` (~100 lines)
  - IPC handlers for general application information.
- [ ] `src/backend/ipc/download-handlers.ts` (~125 lines)
  - IPC handlers for download operations. Corresponding `download-manager.ts` service created with queue management and core download processing logic (further implementation ongoing).
- [ ] `src/backend/ipc/file-handlers.ts` (~150 lines)
  - IPC handlers for file system operations.
- [ ] `src/backend/ipc/playlist-handlers.ts` (~100 lines)
  - IPC handlers for playlist operations. Corresponding `playlist-manager.ts` service created with full CRUD operations for playlists and videos using `better-sqlite3`.
- [ ] `src/backend/ipc/settings-handlers.ts` (~50 lines)
  - IPC handlers for settings management.
- [ ] `src/backend/ipc/thumbnail-handlers.ts` (~100 lines)
  - IPC handlers for thumbnail operations. Corresponding `thumbnailService.ts` created with placeholder functions.

**Implementation Details:**

- Established all core IPC channels required for frontend-backend communication.
- Created dedicated handler files for each major domain (app, downloads, files, playlists, settings, thumbnails).
- Associated backend services for each set of handlers have been created:
  - `appService.ts` (implicitly, via `app-handlers.ts` directly using Electron `app` module for now).
  - `settingsService.ts` (fully implemented with `electron-store`).
  - `fileUtils.ts` (acting as the service for `file-handlers.ts`, fully implemented).
  - `download-manager.ts` (core logic implemented, queue setup, yt-dlp integration, ongoing).
  - `playlist-manager.ts` (fully implemented with `better-sqlite3` for all core CRUD operations).
  - `thumbnailService.ts` (placeholder, to be implemented).
- Ensured IPC handlers correctly invoke their respective service functions.
- Maintained type safety for arguments and return values through shared type definitions.
- All handlers are registered in the main `backend.ts` file.

### Phase 1.7: Secure Preload Script

- [ ] Configure secure preload script
- [ ] Implement type-safe API for frontend process
      **Files Created:**
- [ ] `src/backend/preload.ts` (~100 lines)
  - Secure preload script
  - Type-safe API for frontend process

**Implementation Details:**

- Configured secure preload script to isolate frontend process from backend process
- Implemented type-safe API for frontend process using contextBridge
- Added proper error handling
- Structured IPC communication through a safe interface

### Phase 1.8: Basic Logging and Console Output Management

**Objective:** Implement basic logging to a file and manage console output effectively for easier debugging and monitoring during development.

- [ ] **Implement Console Logging to File:**
  - [ ] Create a `Console Logs` directory if it doesn't exist.
  - [ ] Create a `terminallogs.txt` file within `Console Logs`. - [ ] Redirect `console.log`, `console.warn`, `console.error`, `console.info`, `console.debug` to write to `terminallogs.txt`. - [ ] Ensure each log entry is timestamped. - [ ] Ensure the application still outputs to the original console. - [ ] At the beginning of the main process, before any logging occurs, check if `terminallogs.txt` exists. - [ ] If it exists, delete it to ensure a fresh log for each session. - [ ] Handle potential errors during file deletion gracefully. - [ ] If creating the log directory or writing to the log file fails, fall back to the original console output without crashing the application. - [ ] Log any errors related to the logging mechanism itself to the original console.
        **Files Modified:**
- [ ] `src/backend/backend.ts` (~50-70 new lines)
- [ ] `Console Logs/terminallogs.txt` (log file)
- [ ] `Console Logs/ConsoleLogs.txt` (log file)
  - Added logic to create `Console Logs` directory and `terminallogs.txt`.
  - Implemented redirection of console methods to write to the log file.
  - Added timestamping for log entries.
  - Added logic to clear `terminallogs.txt` on startup.
  - Included error handling for log directory creation and file writing/clearing.

**Key Learnings:**

- Overriding console methods in Node.js.
- Synchronous file system operations (`fs.existsSync`, `fs.mkdirSync`, `fs.appendFileSync`, `fs.unlinkSync`).
- Importance of error handling for I/O operations, especially during application startup.
- Using `process.cwd()` for development paths and considering `app.getPath('userData')` for production.

**Next Steps:**

- Proceed to Phase 1.6 for UI foundational elements or Phase 2.1 for core UI development.
- Ensure logging remains functional as new features are added.
- Consider more advanced logging libraries (e.g., Winston) if requirements grow more complex (e.g., log levels, different transports, log rotation).

## Phase 2: Playlist Management & Local Storage

### Phase 2.1: Playlist Creation UI

**Tasks:**

- [ ] Build UI components for playlist management
- [ ] Create playlist creation form within `AddNewPlaylistDialog.tsx`

**Files Created/Updated:**

- [ ] `src/frontend/components/PlaylistGrid/PlaylistGrid/PlaylistGrid.tsx` (~200 lines)
  - Implemented responsive playlist grid layout
  - Added loading, error, and empty states
- [ ] `src/frontend/components/Modals/AddNewPlaylistDialog/AddNewPlaylistDialog.tsx` (~300 lines, renamed from `CreatePlaylistModal.tsx`)
  - Dialog titled "Add New Playlist" with an "Add Playlist" button.
  - Features two tabs:
    - **"From YouTube" Tab**: For importing playlists by pasting a YouTube URL. Includes form validation for URLs.
    - **"Custom Playlist" Tab**: For creating a new local playlist with fields for Title and Description (with character limits and counters).
  - Loading states during form submission.
  - Error handling.
- [ ] `src/frontend/components/Modals/ConfirmDeleteDialog/ConfirmDeleteDialog.tsx` (~80 lines)
  - Reusable confirmation dialog for destructive actions
  - Customizable title, message and button text
  - Integrates with shadcn/ui Dialog component
- [ ] `src/frontend/components/Modals/EditPlaylistDetailsDialog/EditPlaylistDetailsDialog.tsx` (~150 lines)
  - Dialog for editing the Title and Description of an existing custom or imported playlist (with character limits and counters).

**Additional Components Created:**

- [ ] `src/frontend/features/playlists/components/PlaylistCard/PlaylistCard.tsx` (~150 lines)
  - Individual playlist card with thumbnail and metadata (fallback icon changed to PlayCircle).
  - Hover effects.
  - Utilizes `PlaylistActionsDropdown.tsx` to display playlist actions.
  - Dynamic styling based on playlist status
- [ ] `src/frontend/features/playlists/components/PlaylistActionsDropdown/PlaylistActionsDropdown.tsx` (~180 lines)
  - Reusable dropdown menu component containing actions for a single playlist (Refresh, Delete, Duplicate, Download, Open in YouTube, Edit, Play).
  - Handles conditional display logic (e.g., 'Open in YouTube').
  - Integrates with UI library (e.g., Shadcn DropdownMenu).
  - Styling updated to match user-provided image, including hover effects and tooltips.

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

**Tasks:**

- **Backend (`ytDlpManager.ts` & `logger.ts`):**
  - [ ] Initialize `yt-dlp-wrap` and handle yt-dlp binary path in [`src/backend/services/ytDlpManager.ts`](src/backend/services/ytDlpManager.ts).
  - [ ] Implement wrapper function in `ytDlpManager.ts` to fetch raw playlist metadata using `yt-dlp-wrap`.
  - [ ] Implement function in `ytDlpManager.ts` to parse raw metadata and transform it into the application's `Playlist` type.
  - [ ] Implement function in `ytDlpManager.ts` to save the imported playlist data (e.g., to JSON, or integrate with `playlistService.ts`/`playlist-manager.ts` if it uses a database).
  - [ ] Create basic [`logger.ts`](src/backend/utils/logger.ts) in `src/backend/utils/` for use by `ytDlpManager.ts` and other services.
  - [ ] Integrate logging from `logger.ts` into `ytDlpManager.ts` for key operations and errors.

- **Backend (`backend.ts` - CSP & Assets):**
  - [ ] Update [`src/backend/backend.ts`](src/backend/backend.ts) to configure Content Security Policy (CSP) to allow YouTube image domains (e.g., `i.ytimg.com`, `img.youtube.com`).
  - [ ] (Optional/Verify) Add placeholder or implement development asset handling in `src/backend/backend.ts` if required for this phase.

- **Frontend (`CachedImage.tsx` - Thumbnail Handling):**
  - [ ] Create [`src/frontend/components/CachedImage.tsx`](src/frontend/components/CachedImage.tsx) component.
  - [ ] Implement robust image loading in `CachedImage.tsx` with a primary `src`.
  - [ ] Implement a `fallbackSrc` prop and mechanism in `CachedImage.tsx`.
  - [ ] Implement a hardcoded default placeholder image in `CachedImage.tsx` if both `src` and `fallbackSrc` fail.
  - [ ] Add specific placeholder icons (e.g., using Lucide icons) in `CachedImage.tsx` for 'private' and 'deleted' video statuses, potentially triggered by props or metadata.

- **Integration & UI:**
  - [ ] Integrate the playlist import functionality into the UI (e.g., in [`src/frontend/components/Modals/AddNewPlaylistDialog/AddNewPlaylistDialog.tsx`](src/frontend/components/Modals/AddNewPlaylistDialog/AddNewPlaylistDialog.tsx) "From YouTube" tab).
  - [ ] Ensure the frontend can display thumbnails fetched via `yt-dlp` metadata, using `CachedImage.tsx`.
  - [ ] Handle loading states and error feedback in the UI during playlist import.

**Files Created/Updated:**

- [ ] `src/backend/services/ytDlpManager.ts`
  - Wrapper for yt-dlp commands using `yt-dlp-wrap`
  - Playlist metadata extraction functions
  - Playlist import function saving to JSON (aligned with `Playlist` type)
  - Handles yt-dlp binary path and initialization
- [ ] `src/backend/utils/logger.ts` (New file)
  - Basic logger utility created for use by services like `ytDlpManager`.
- [ ] `src/backend/backend.ts` (Updated)
  - Added CSP configuration to allow YouTube image domains (`i.ytimg.com`, `img.youtube.com`)
  - Added placeholder function for development asset handling.
- [ ] `src/frontend/components/CachedImage.tsx` (New file)
  - Component with robust image fallback mechanism (primary src -> fallbackSrc -> hardcoded default).
  - Includes specific placeholders (using Lucide icons) for 'private' and 'deleted' video statuses.

**Implementation Notes:**

- Fixed Content Security Policy in `backend.ts` to allow external images from YouTube.
- `ytDlpManager.ts` created to manage `yt-dlp` interactions, including metadata fetching and playlist import.
- `CachedImage.tsx` component implemented with multi-level fallbacks and status-specific placeholders.
- Basic `logger.ts` utility created in `src/backend/utils`.
- Placeholder for development asset handling added to `backend.ts`.

### Phase 2.3: Playlist State Management

**Tasks:**

- [ ] Implement state management with Zustand for frontend UI state if needed beyond React Query.
- [ ] Create playlist store structure (if Zustand is adopted for complex UI states).
- [ ] Implement data persistence strategies (backend uses `better-sqlite3`; frontend relies on React Query caching and backend persistence).
- [ ] Add playlist filtering and sorting capabilities (currently in `MyPlaylists.tsx` using React Query data).
- [ ] Create actions for CRUD operations (handled by React Query mutation hooks calling backend IPC).
- [ ] Implement error handling and loading states (handled by React Query).

**Files Created/Updated:**

- [ ] `src/frontend/store/playlistStore.ts` (~150 lines) // Marked as not yet implemented
  - Enhanced store with TypeScript interfaces
  - Actions for creating, updating, and deleting playlists
  - Synchronization with localStorage for persistence
  - Video status tracking capabilities
  - Integration with data fetching hooks
- [ ] `src/shared/constants/appConstants.ts` (~50 lines) // This file might exist, but its role in a dedicated playlist Zustand store is not yet defined.
  - Application-wide constants and defaults
  - Rate limit configurations
  - UI constants for consistent layout
  - File path constants and naming conventions

**Implementation Notes:**

- Current frontend state for playlists (data, loading, errors) is primarily managed by **React Query** via hooks in `usePlaylistQueries.ts`.
- Filtering and sorting logic is currently implemented within `MyPlaylists.tsx` using `useMemo` on data fetched by React Query.
- Backend persistence is handled by `playlist-manager.ts` using `better-sqlite3`.
- A dedicated frontend Zustand store (`playlistStore.ts`) for more complex UI-specific state or optimistic updates beyond React Query's capabilities has **not yet been implemented**.
- If Zustand is introduced for playlists, it would likely focus on client-side UI state that doesn't directly map to server state, or for more intricate optimistic update scenarios.

### Phase 2.4: Display Playlists

**Tasks:**

- [ ] Create UI components for playlist display
- [ ] Implement responsive grid layout using `PlaylistGrid.tsx`
- [ ] Add search and filtering capabilities to `PlaylistActionsBar.tsx`
- [ ] Create skeleton loading states
- [ ] Implement empty and error states
- [ ] Add sorting and filtering functionality
- [ ] Implement view toggle (Grid/List) on the 'My Playlists' page, with the toggle button and state managed by `MyPlaylists.tsx` (tooltip added).

**Files Created/Updated:**

- [ ] `src/frontend/components/PlaylistGrid/PlaylistGrid/PlaylistGrid.tsx` (~200 lines, renamed from PlaylistList.tsx)
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
- [ ] `src/frontend/components/ui/Skeleton/Skeleton.tsx` (~80 lines) // Marked as not explicitly done recently
  - Skeleton loading state for playlists
  - Animated pulse effect
  - Responsive design matching the actual content
- [ ] `src/frontend/pages/MyPlaylists/MyPlaylists.tsx` (updates from Phase 1.3)
  - Manages the state for grid/list view toggle.
  - Renders the Grid/List toggle button (using Lucide Icons).
  - Conditionally renders `PlaylistGrid.tsx` or `PlaylistListView.tsx`.
  - Placeholders removed, tooltips added to action buttons.
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
      const concurrentDownloads = getSetting("concurrentDownloads", 3);
      this.queue = new PQueue({ concurrency: concurrentDownloads });

      // Log initialization
      logToFile("INFO", c.section("ðŸš€", "Download Manager initialized"));
      logToFile("INFO", `Concurrent downloads: ${concurrentDownloads}`);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize download manager:", error);
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
      status: "pending",
      progress: 0,
      format: options.format || getSetting("downloadFormat", "mp4"),
      quality: options.quality || getSetting("maxQuality", "1080p"),
      addedAt: new Date().toISOString(),
      thumbnail,
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
  if (!["mp3", "aac", "flac", "opus", "m4a"].includes(options.format)) {
    // Set video codec based on format
    if (options.format === "mp4") {
      command.videoCodec("libx264");
    } else if (options.format === "webm") {
      command.videoCodec("libvpx-vp9");
    }

    // Set resolution based on quality
    if (options.quality) {
      switch (options.quality) {
        case "360p":
          command.size("640x360");
          break;
        case "480p":
          command.size("854x480");
          break;
        case "720p":
          command.size("1280x720");
          break;
        case "1080p":
          command.size("1920x1080");
          break;
        // Additional resolutions...
      }
    }
  }

  // Set progress handler
  if (progressCallback) {
    command.on("progress", (progress) => {
      progressCallback({
        percent: Math.min(Math.round(progress.percent || 0), 100),
        fps: progress.frames
          ? progress.frames /
            (progress.timemark
              .split(":")
              .reduce((acc, time) => 60 * acc + +time, 0) || 1)
          : undefined,
        kbps: progress.currentKbps,
        targetSize: progress.targetSize,
        currentSize: progress.currentSize,
        timemark: progress.timemark,
        eta: progress.timemark,
      });
    });
  }

  // Execute the conversion
  return new Promise((resolve, reject) => {
    command
      .on("end", async () => {
        // Return result with file information
        resolve({
          success: true,
          outputPath,
          duration: await getVideoDuration(outputPath),
          format: options.format,
          size: (await fs.stat(outputPath)).size,
        });
      })
      .on("error", (err) => {
        reject({
          success: false,
          outputPath: "",
          duration: 0,
          format: options.format,
          size: 0,
          error: err.message,
        });
      })
      .save(outputPath);
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
- [] Create UI for adding individual videos to playlists
- [] Develop video search and import features
- [] Add video metadata editing capabilities

**Files Created:**

- [] `src/backend/services/singleVideoManager.ts` (~200 lines)
  - Functions for URL validation, metadata extraction for single videos, and supporting individual video management within the app (e.g., before adding to a playlist or for pre-download checks within `DownloadContentDialog`).
  - Error handling for invalid URLs

- [] `src/frontend/features/videos/components/AddVideoForm.tsx` (~250 lines)
  - Form for adding individual videos to playlists
  - Video URL validation
  - Video preview with metadata
  - YouTube search integration

- [] `src/frontend/features/videos/components/VideoSearch.tsx` (~200 lines)
  - Search for YouTube videos
  - Video results display with thumbnails
  - Selection and add to playlist functionality

- [] `src/frontend/features/videos/components/VideoCard.tsx` (~150 lines)
  - Individual video display component
  - Video preview with thumbnail
  - Action buttons for download, play, and remove

- [] `src/frontend/features/playlists/components/VideoList.tsx` (~200 lines)
  - List of videos in a playlist
  - Drag and drop reordering
  - Batch actions (download, remove)

- [] `src/backend/ipc/videoHandlers.ts` (~150 lines)
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
  - Unified dialog to handle downloads for single YouTube videos or playlists _directly via URL_ (content not yet imported).
  - Input field for YouTube URL.
  - Dynamic quality selection options based on detected video/playlist qualities.
  - UI to display only available MP4 quality options.
  - Directory selection component.
  - Intelligent default selection for quality and directory.
  - Clear indication of max available quality for the content.
- [ ] `src/frontend/components/Modals/DownloadPlaylistDialog.tsx` (~300 lines, updated or new for this specific purpose)
  - Dialog to handle downloads for _already imported playlists_.
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
    2. If `yt-dlp` cannot find that specific quality, the service will automatically select the next highest _available_ MP4 quality for that video.
    3. The actual quality downloaded will be logged and stored.
- **Thumbnail Embedding**:
  - The `yt-dlp` command in `download.ts` will include `--embed-thumbnail`.
- **Metadata**:
  - The database schema and shared types will be updated to store `actualDownloadedQuality` for each video.
  - The UI will display this information where relevant (e.g., video details, history).

**Sample Code for Dynamic Quality Detection (`qualityDetector.ts` concept):**

```typescript
import { execAsync } from "../utils/execUtils"; // Assuming a utility for promise-based exec

export type VideoQuality =
  | "144p"
  | "240p"
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "1440p"
  | "2160p"
  | "4320p"
  | "best"; // Extend as needed

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
    let formats =
      videoInfo.formats ||
      (videoInfo.entries && videoInfo.entries[0]
        ? videoInfo.entries[0].formats
        : []);
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
    console.error("Failed to get available formats:", error);
    return [];
  }
}

export async function getAvailableMp4Qualities(
  videoUrl: string
): Promise<VideoQuality[]> {
  const formats = await getAvailableFormats(videoUrl);
  const qualities = new Set<VideoQuality>();

  formats.forEach((format) => {
    if (
      format.ext === "mp4" &&
      format.vcodec &&
      format.vcodec !== "none" &&
      format.height
    ) {
      // Basic mapping, can be more sophisticated to include FPS
      if (format.height >= 4320) qualities.add("4320p");
      else if (format.height >= 2160) qualities.add("2160p");
      else if (format.height >= 1440) qualities.add("1440p");
      else if (format.height >= 1080) qualities.add("1080p");
      else if (format.height >= 720) qualities.add("720p");
      else if (format.height >= 480) qualities.add("480p");
      else if (format.height >= 360) qualities.add("360p");
      else if (format.height >= 240) qualities.add("240p");
      else if (format.height >= 144) qualities.add("144p");
    }
  });

  const sortedQualities = Array.from(qualities).sort((a, b) => {
    const qualityValue = (q: VideoQuality) =>
      parseInt(q.replace("p", "").replace("best", "99999")); // Simple sort order
    return qualityValue(b) - qualityValue(a); // Sort descending
  });
  if (sortedQualities.length > 0) {
    sortedQualities.unshift("best"); // Always offer 'best'
  } else {
    // Fallback if no MP4 video formats found (e.g. audio only, or other video types)
    // Or if format parsing failed.
    return ["best"];
  }
  return sortedQualities;
}
```

**Sample Download Modal Update (conceptual for `DownloadContentDialog.tsx` or `DownloadPlaylistDialog.tsx`):**

```tsx
// Inside DownloadContentDialog.tsx or DownloadPlaylistDialog.tsx

const [detectedQualities, setDetectedQualities] = useState<VideoQuality[]>([
  "best",
  "1080p",
  "720p",
]); // Default before detection
const [isDetecting, setIsDetecting] = useState(false);

useEffect(() => {
  if (isOpen && videoOrPlaylistUrl) {
    // videoOrPlaylistUrl passed as prop
    setIsDetecting(true);
    // Call IPC to backend qualityDetector.ts
    window.api.ytDlp
      .getAvailableQualities(videoOrPlaylistUrl)
      .then((qualities) => {
        if (qualities && qualities.length > 0) {
          setDetectedQualities(qualities);
          // Set default selected quality, e.g., user's preferred or highest available
          setSelectedQuality(
            qualities.includes(userPreferredQuality)
              ? userPreferredQuality
              : qualities[0]
          );
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
import path from "path";
import fs from "fs-extra";
import { app } from "electron";
import * as crypto from "crypto";
import Store from "electron-store";

// Create an encrypted store for user tokens
const encryptionKey = getOrCreateEncryptionKey();

// Secure store for user tokens
const secureStore = new Store({
  name: "secure-config",
  encryptionKey,
  clearInvalidConfig: true,
});

// Get or generate a machine-specific encryption key
function getOrCreateEncryptionKey(): string {
  const keyFile = path.join(app.getPath("userData"), ".key");

  try {
    // Try to read existing key
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, "utf8");
    }

    // Generate new key if none exists
    const newKey = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(keyFile, newKey, { mode: 0o600 }); // Only user can read/write
    return newKey;
  } catch (error) {
    console.error("Error handling encryption key:", error);
    // Fallback to a derived key if file operations fail
    return crypto
      .createHash("sha256")
      .update(app.getPath("userData"))
      .digest("hex");
  }
}

// Built-in OAuth configuration values protected with obfuscation
// These will be obfuscated during the build process
export function getOAuthConfig(): { clientId: string; clientSecret: string } {
  // In development, load from .env file if present
  if (process.env.NODE_ENV === "development") {
    try {
      const dotenv = require("dotenv");
      dotenv.config();

      const envClientId = process.env.GOOGLE_CLIENT_ID;
      const envClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (envClientId && envClientSecret) {
        return {
          clientId: envClientId,
          clientSecret: envClientSecret,
        };
      }
    } catch (e) {
      console.log("dotenv not loaded");
    }
  }

  // For production builds, use obfuscated built-in credentials
  // These will be replaced during the build process
  return {
    clientId: deobfuscate("__OBFUSCATED_CLIENT_ID__"),
    clientSecret: deobfuscate("__OBFUSCATED_CLIENT_SECRET__"),
  };
}

// Simple deobfuscation technique (this would be more complex in real implementation)
function deobfuscate(obfuscated: string): string {
  // In real implementation, this would be more sophisticated
  if (obfuscated === "__OBFUSCATED_CLIENT_ID__") {
    return ""; // Will be replaced during build
  }
  if (obfuscated === "__OBFUSCATED_CLIENT_SECRET__") {
    return ""; // Will be replaced during build
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
import { BrowserWindow } from "electron";
import crypto from "crypto";
import { getOAuthConfig, storeToken, getToken } from "./secureConfig";
import axios from "axios";

// Generate a code verifier and challenge for PKCE
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

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
      contextIsolation: true,
    },
  });

  // Build the authorization URL with PKCE
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", "urn:ietf:wg:oauth:2.0:oob"); // Desktop app flow
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("code_challenge", challenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  authUrl.searchParams.append(
    "scope",
    "https://www.googleapis.com/auth/youtube.readonly"
  );
  authUrl.searchParams.append("access_type", "offline");

  // Load the auth URL
  authWindow.loadURL(authUrl.toString());

  // Wait for the redirect to the success page
  return new Promise((resolve, reject) => {
    authWindow.webContents.on("will-redirect", async (event, url) => {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get("code");

      if (code) {
        authWindow.close();

        try {
          // Exchange the code for tokens using PKCE
          const { clientId, clientSecret } = getOAuthConfig();
          const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
              client_id: clientId,
              client_secret: clientSecret, // Used only for token exchange
              code,
              code_verifier: verifier,
              grant_type: "authorization_code",
              redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            }
          );

          const { access_token, refresh_token } = tokenResponse.data;

          // Store tokens securely
          storeToken("google", access_token);
          if (refresh_token) {
            storeToken("google_refresh", refresh_token);
          }

          resolve(access_token);
        } catch (error) {
          reject(error);
        }
      }
    });

    authWindow.on("closed", () => {
      reject(new Error("Authentication window was closed"));
    });
  });
}

export function getGoogleToken(): string | null {
  return getToken("google");
}

// For token refresh
export async function refreshToken(): Promise<string | null> {
  const refreshToken = getToken("google_refresh");

  if (!refreshToken) {
    return null;
  }

  try {
    const { clientId, clientSecret } = getOAuthConfig();
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const { access_token } = response.data;
    storeToken("google", access_token);
    return access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}
```

**Sample build script for credentials obfuscation:**

```javascript
// scripts/obfuscate-credentials.js
const fs = require("fs");
const path = require("path");

// Load credentials from .env or environment
require("dotenv").config();
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
  );
  process.exit(1);
}

// Simple obfuscation (would be more sophisticated in production)
function obfuscate(value) {
  // In real implementation, this would use a more secure method
  return Buffer.from(value).toString("base64");
}

// Read secureConfig.ts
const configPath = path.join(
  __dirname,
  "../src/backend/services/secureConfig.ts"
);
let configContent = fs.readFileSync(configPath, "utf8");

// Replace placeholders with obfuscated values
configContent = configContent.replace(
  "__OBFUSCATED_CLIENT_ID__",
  obfuscate(clientId)
);
configContent = configContent.replace(
  "__OBFUSCATED_CLIENT_SECRET__",
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
console.log("Credentials obfuscated and injected into secureConfig.ts");
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
import { google } from "googleapis";
import { getToken } from "./authManager";

const youtube = google.youtube({ version: "v3", auth: getToken() });

export async function fetchPlaylists(): Promise<any[]> {
  const response = await youtube.playlists.list({
    part: ["snippet", "contentDetails"],
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
export async function downloadPrivatePlaylist(
  playlistUrl: string,
  playlistName: string,
  token: string
): Promise<void> {
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

- [ ] `src/frontend/features/accounts/components/AccountManager.tsx` (~150 lines)
  - Account management UI
- [ ] `src/frontend/stores/accountStore.ts` (~100 lines)
  - Zustand store for account state

**Sample Code for `src/frontend/pages/Settings/SettingsPage.tsx`:**

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

**Sample Code for `src/frontend/stores/accountStore.ts`:**

```typescript
import { create } from "zustand";

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
  addAccount: (email, token) =>
    set((state) => ({
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
    return stdout ? "available" : "unavailable";
  } catch {
    return "unavailable";
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
  addTag: (name: string, tag: string) =>
    set((state) => {
      const updated = state.playlists.map((p) =>
        p.name === name ? { ...p, tags: [...(p.tags || []), tag] } : p
      );
      writeMetadata(
        name,
        updated.find((p) => p.name === name)
      );
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
import { getPlaylistMetadata, importPlaylist } from "./ytDlpManager";
import { getSetting } from "./settingsManager";

export function startAutoUpdate(): void {
  const interval = getSetting("refreshInterval", 30 * 60 * 1000); // 30 min default
  setInterval(async () => {
    const playlists = getSetting("playlists", []);
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
import { useState, useEffect } from "react";
import ColorThief from "colorthief";

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
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const colorThief = new ColorThief();

        // Get dominant color
        const dominantRgb = colorThief.getColor(img);
        const dominantHex = rgbToHex(
          dominantRgb[0],
          dominantRgb[1],
          dominantRgb[2]
        );
        setDominantColor(dominantHex);

        // Get color palette (8 colors)
        const colorPalette = colorThief.getPalette(img, 8);
        const hexPalette = colorPalette.map((rgb) =>
          rgbToHex(rgb[0], rgb[1], rgb[2])
        );
        setPalette(hexPalette);

        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Error extracting colors")
        );
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      setError(new Error("Failed to load image"));
      setIsLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  // Helper function to convert RGB to HEX
  function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
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
import { autoUpdater } from "electron-updater";
import { app, BrowserWindow } from "electron";
import { getSetting } from "./settingsManager";

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (getSetting("checkForUpdates", true)) {
    autoUpdater.checkForUpdatesAndNotify();

    // Check for updates periodically
    const checkInterval = getSetting("updateCheckInterval", 60 * 60 * 1000); // 1 hour default
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, checkInterval);
  }

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update-available", info);
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("update-downloaded", info);
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
  - Primary: Red (#FF0000)
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
│   │   │   ├── UserPlaylistsPage.tsx
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

# PlayListify Dependency Management

PlayListify requires two key dependencies to function correctly:

1. **yt-dlp**: Used for downloading YouTube videos and playlists
2. **FFmpeg**: Used for video processing and format conversion

## Local Project Dependencies

Unlike typical applications that require system-wide installation of these dependencies, PlayListify includes a dependency management system that **downloads and manages these tools locally within the project directory**. This provides several benefits:

- No need for users to install anything manually
- Consistent versions across all platforms
- No conflicts with existing system installations
- Dependencies are removed when the app is uninstalled

## Directory Structure

The dependencies are stored in dedicated directories within the project:

```
PlayListify/
├── ytdlp/
│   └── bin/
│       └── yt-dlp (or yt-dlp.exe on Windows)
│
├── ffmpeg/
│   └── bin/
│       ├── ffmpeg (or ffmpeg.exe on Windows)
│       ├── ffprobe (or ffprobe.exe on Windows)
│       └── ffplay (or ffplay.exe on Windows)
```

## Setup Scripts

The application includes platform-specific automated setup scripts that handle downloading and installing these dependencies:

### OS-Specific Scripts

Each platform has dedicated installation and uninstallation scripts:

```
scripts/
├── windows/
│   ├── install.js - Windows-specific installation
│   └── uninstall.js - Windows-specific uninstallation
├── macos/
│   ├── install.js - macOS-specific installation
│   └── uninstall.js - macOS-specific uninstallation
└── linux/
    ├── install.js - Linux-specific installation
    └── uninstall.js - Linux-specific uninstallation
```

### For Developers

You can manually run these scripts during development:

```bash
# Install dependencies automatically for current platform
npm run setup:deps

# Platform-specific installation
npm run setup:windows  # Windows only
npm run setup:macos    # macOS only
npm run setup:linux    # Linux only

# Uninstall dependencies for current platform
npm run uninstall:deps

# Platform-specific uninstallation
npm run uninstall:windows  # Windows only
npm run uninstall:macos    # macOS only
npm run uninstall:linux    # Linux only
```

### For Users

Users don't need to run these scripts manually. When the application starts for the first time via `npm start` or when running the packaged application, the startup script will automatically check for and install the required dependencies.

## Platform Support

The dependency management system supports all major platforms and architectures:

- **Windows**: Downloads and installs x86/x64 binaries
- **macOS**: Downloads and installs x64/ARM64 binaries
- **Linux**: Downloads and installs x64/x86/ARM64/ARM binaries

## Uninstallation

When uninstalling the application, the uninstall script will remove all downloaded dependencies:

```bash
npm run uninstall:deps
```

This script will:

1. Detect your platform and run the appropriate uninstaller
2. Remove the yt-dlp directory
3. Remove the FFmpeg directory
4. Optionally remove application data (with user confirmation)

## Troubleshooting

If you encounter issues with the dependencies:

1. Try running the setup scripts manually:

   ```bash
   npm run setup:deps
   ```

2. Check that the binaries are executable (on Unix-based systems):

   ```bash
   chmod +x ytdlp/bin/yt-dlp
   chmod +x ffmpeg/bin/ffmpeg
   chmod +x ffmpeg/bin/ffprobe
   ```

3. Verify that the binaries are in the correct location by checking the project directory structure

4. For SQLite issues on Windows, the application includes a fix script:
   ```bash
   node fix-sqlite-path.js
   ```

### **Epic 1: Project Foundation & Playlist Viewing**

**Goal:** Establish the core application shell and enable users to import, view, and search within public YouTube playlists.

---

#### **Story 1.1: Main Application Layout**

**As a user,** I want to see the main application window with the sidebar and top navigation bar so that I can understand the layout and see the main sections of the app.

- **Acceptance Criteria:**
  - The application opens to a primary window.
  - A persistent sidebar is visible on the left.
  - A persistent top navigation bar is visible at the top.
- **Subtasks:**
  - `[ ]` Create a `MainLayout.tsx` component that defines the primary application structure (e.g., sidebar and main content areas).
  - `[ ]` Create a `Sidebar.tsx` component with navigation links for Dashboard, Playlists, History, Downloads, and Settings, each with an appropriate icon.
  - `[ ]` Create a `TopNavbar.tsx` component with placeholders for the `+ Add` button and user avatar.
  - `[ ]` Integrate the Sidebar and TopNavbar components into the `MainLayout.tsx`.
  - `[ ]` Configure the application's router to use this `MainLayout` for all primary views.

---

#### **Story 1.2: Build Dashboard UI Structure**

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

- **Acceptance Criteria:**
  - A "Dashboard" screen must be created with clearly defined sections for "Recent Playlists" and "Continue Watching".
  - These sections must initially display an appropriate empty state (e.g., "Your recent playlists will appear here").
  - The structure must be ready to receive and display real data as soon as the corresponding features (playlist viewing, history tracking) are completed in later stories.
- **Subtasks:**
  - `[ ]` Create the `Dashboard.tsx` page component.
  - `[ ]` Implement the layout for the dashboard to define widget areas.
  - `[ ]` Create a `RecentPlaylistsWidget.tsx` component with a title and "View all" link.
  - `[ ]` Implement the empty state UI for the `RecentPlaylistsWidget`.
  - `[ ]` Create a `ContinueWatchingWidget.tsx` component with a title and "View history" link.
  - `[ ]` Implement the empty state UI for the `ContinueWatchingWidget`.
  - `[ ]` Integrate both widget components into the `Dashboard.tsx` page.

---

#### **Story 1.3: Import Public Playlist**

**As a user,** I want to use the `+ Add` menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

- **Acceptance Criteria:**
  - The `+ Add` menu must contain an option labeled "Add Playlist".
  - Clicking this option must open a dialog box for the user to paste a YouTube playlist URL.
  - The URL input field must include an 'x' button that appears when text is present, allowing the user to clear the input with a single click.
  - After a valid URL is entered, the dialog must automatically fetch and display a preview of the playlist (Thumbnail, Title, Video Count, etc.).
  - When the user clicks the final "Import" button in the dialog, the dialog must close immediately, and the import task must instantly appear in the Activity Center.
  - The user must be able to freely navigate the application while the background task is running.
  - Once the background task is complete, the new playlist must appear in the sidebar, and a success notification should be displayed.
- **Subtasks:**
  - `[ ]` Add the "Add Playlist" item to the `+ Add` dropdown menu, which opens the unified `AddPlaylistDialog`.
  - `[ ]` Implement the URL input field UI, including the clear ('x') button on the "Add from YouTube" tab.
  - `[ ]` Create an IPC handler (`playlist:get-preview`) to fetch preview metadata from a URL.
  - `[ ]` Call the preview IPC handler from the dialog and display the returned preview data.
  - `[ ]` Implement the "Import" button to call the main `playlist:import` IPC handler and pass the task to the Activity Center.

---

#### **Story 1.4: View Playlist Details**

**As a user,** I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

- **Acceptance Criteria:**
  - Clicking a playlist in the sidebar must display its contents in the main view.
  - The view must show the playlist's header (title, video count, etc.) and a "Last checked" timestamp.
  - Each video in the list must display its Thumbnail, Title, Channel Name, Duration, View Count, Upload Date, a colored status dot, and its downloaded quality (if applicable).
  - A loading state must be shown while data is being fetched.
- **Subtasks:**
  - `[ ]` Create a `PlaylistDetailsView.tsx` component for the main content area.
  - `[ ]` Implement the logic for the component to receive a playlist ID when a playlist is selected.
  - `[ ]` Use a `useQuery` hook to call the `playlist:get-details` IPC handler with the ID.
  - `[ ]` Implement the UI for the playlist header.
  - `[ ]` Create a `VideoListItem.tsx` component to display a single video's information.
  - `[ ]` Map over the fetched data in `PlaylistDetailsView.tsx` and render the `VideoListItem` components.
  - `[ ]` Implement loading and empty state UIs.

---

#### **Story 1.5: Search within Playlist**

**As a user,** I want to search for a specific video by title within a selected playlist so that I can find content quickly.

- **Acceptance Criteria:**
  - A search input field must be present on the playlist detail view.
  - As the user types in the search field, the visible list of videos must filter in real-time to show only videos whose titles match the search query.
- **Subtasks:**
  - `[ ]` Add a search input field UI component to `PlaylistDetailsView.tsx`.
  - `[ ]` Create a local state to hold the search query text.
  - `[ ]` Implement client-side logic to filter the video list based on the search query.
  - `[ ]` Add a debounce to the search input to improve performance.

---

#### **Story 1.6: Infinite Scroll for Video Lists**

**As a user Browse a large playlist,** I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

- **Acceptance Criteria:**
  - For playlists with a large number of videos (e.g., >100), the UI must not hang or become slow.
  - Only the currently visible video items should be rendered in the DOM.
  - Scrolling must be smooth and performant.
- **Subtasks:**
  - `[ ]` Choose and install a library for list virtualization (e.g., `@tanstack/react-virtual`).
  - `[ ]` Refactor the video list rendering logic in `PlaylistDetailsView.tsx` to use the chosen virtualization library.
  - `[ ]` Test the implementation with a large dataset (e.g., 1000+ items) to ensure performance.
  ### **Epic 2: Custom Playlist Management**

**Goal:** Empower users to create, populate, and manage their own local playlists from scratch.

---

#### **Story 2.1: Add New Playlist (Custom or from YouTube)**

**As a user,** I want to select 'Add Playlist' from the main menu and then choose whether to create a new custom playlist or import one from a YouTube URL within a single dialog.

- **Acceptance Criteria:**
  - The `+ Add` dropdown menu must contain a single option: "Add Playlist".
  - Clicking this opens a dialog titled "Add Playlist" with two tabs: "Custom Playlist" and "Add from YouTube".
  - The "Custom Playlist" tab must have fields for Title and Description and a "Create Playlist" button.
  - The Title field must enforce a 100-character limit and the Description field must enforce a 512-character limit. Both should display a character counter (e.g., `25/100`).
  - If a user tries to create a playlist with a title that already exists, an error message must be displayed, and the playlist will not be created.
  - The "Add from YouTube" tab must contain the full preview-and-import flow defined in Epic 1.
- **Subtasks:**
  - `[ ]` Update the `+ Add` dropdown menu to have a single "Add Playlist" item.
  - `[ ]` Create the main `AddPlaylistDialog.tsx` component with a tabbed interface.
  - `[ ]` Build the form for the "Custom Playlist" tab, ensuring the button is labeled "Create Playlist" and character counters are implemented.
  - `[ ]` Implement the logic for the "Create Playlist" button on this tab to call the appropriate IPC handler, including the check for duplicate titles.
  - `[ ]` Build the UI and logic for the "Add from YouTube" tab, reusing the components and logic from Epic 1.

---

#### **Story 2.2: Add Videos to a Custom Playlist**

**As a user,** I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

- **Acceptance Criteria:**
  - A context menu on any video item must provide an "Add to Playlist" option.
  - This option must open a submenu or dialog listing all the user's custom playlists.
  - If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry will be created. A brief, non-blocking notification (e.g., "Video is already in this playlist") should be shown.
  - Selecting a playlist correctly adds the video to it and provides a success notification (e.g., "Video added to 'My Favorites'").
- **Subtasks:**
  - `[ ]` Implement the "Add to Playlist" option in the video context menu.
  - `[ ]` Create the UI to display the list of available custom playlists.
  - `[ ]` Implement the backend logic to add the video-to-playlist association, including the check to prevent duplicates.
  - `[ ]` Implement the success notification toast.

---

#### **Story 2.3: Remove Videos from a Custom Playlist**

**As a user,** I want to remove a video from one of my custom playlists to keep it organized and relevant.

- **Acceptance Criteria:**
  - A context menu on any video item _within a custom playlist_ must provide a "Remove from Playlist" option.
  - A confirmation dialog must be displayed before removing the video.
  - The confirmation dialog must clearly state that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists. (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library.")
- **Subtasks:**
  - `[ ]` Implement the "Remove from Playlist" option in the video context menu.
  - `[ ]` Create the confirmation dialog component with the specified clarifying text.
  - `[ ]` On confirmation, implement the backend logic to remove the video-to-playlist association in the database.

---

#### **Story 2.4: Edit Custom Playlist Details**

**As a user,** I want to be able to change the title and description of my custom playlists after I've created them.

- **Acceptance Criteria:**
  - A context menu on any custom playlist must provide an "Edit Details" option.
  - This opens a dialog pre-filled with the current title and description.
  - The system must prevent renaming a playlist to a title that already exists, showing an error if attempted.
- **Subtasks:**
  - `[ ]` Implement the "Edit Details" option in the custom playlist context menu.
  - `[ ]` Create a dialog for editing, pre-populating the fields with existing data.
  - `[ ]` On save, implement the backend logic to update the playlist's details in the database, including the check for duplicate titles.

---

#### **Story 2.5: Delete a Custom Playlist**

**As a user,** I want to delete an entire custom playlist that I no longer need.

- **Acceptance Criteria:**
  - A context menu on any custom playlist must provide a "Delete Playlist" option.
  - A confirmation dialog must be displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
  - If a video from the playlist is currently playing, confirming the deletion must first stop the video playback before deleting the playlist.
- **Subtasks:**
  - `[ ]` Implement the "Delete Playlist" option in the custom playlist context menu.
  - `[ ]` Create the confirmation dialog with the specified warning text.
  - `[ ]` On confirmation, implement the backend logic to remove the playlist and all its video associations from the database, including the check to stop active playback.
  ### **Epic 3: Core Downloading & Offline Playback**

**Goal:** Implement a robust and intelligent archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

#### **Story 3.1: Implement Intelligent Quality Detection Service**

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

- **Acceptance Criteria:**
  - The service must use `yt-dlp` to fetch a list of all available formats for a given URL.
  - The service must parse this list and return a clean set of available qualities (e.g., '720p', '1080p', '4K').
  - The service must be exposed via an IPC handler that the frontend can call.
- **Subtasks:**
  - `[ ]` Create a backend service that uses `yt-dlp` to fetch available formats.
  - `[ ]` Implement logic to parse and clean the format list into a user-friendly set of qualities.
  - `[ ]` Create the IPC handler for the frontend to request these quality options.

---

#### **Story 3.2: Download a Single Video**

**As a user,** I want to download a single video from a playlist or URL with full control over the options, so I can save specific content to my library.

- **Acceptance Criteria:**
  - The "Download" option in a video's context menu or the "Download Video" option in the `+ Add` menu will open the "Download Video" dialog.
  - The dialog must allow format selection (MP4/MP3) and dynamically populate the quality dropdown based on the available qualities for that specific video.
  - All downloaded videos must be converted to a standard MP4 (H.264/AAC) format to ensure playback compatibility.
  - All downloaded video files must have their YouTube thumbnail embedded.
  - Video titles must be sanitized to remove characters that are invalid for filenames.
  - The dialog must display the default download path and provide a button for the user to select a different location.
  - Before the download starts, the system must check for sufficient disk space and show an error if there is not enough.
- **Subtasks:**
  - `[ ]` Create the `DownloadVideoDialog.tsx` component.
  - `[ ]` Update the dialog to call the quality detection service and populate the quality options dynamically.
  - `[ ]` Implement the "Select Location" UI and logic.
  - `[ ]` Implement the backend logic for thumbnail embedding, filename sanitization, and the pre-download disk space check.
  - `[ ]` Ensure the configured download task is sent to the Activity Center.

---

#### **Story 3.3: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, and for any video that doesn't have my selected quality, I want the app to automatically download the best available quality instead.

- **Acceptance Criteria:**
  - A "Download Playlist" button on the playlist details view will open the download dialog.
  - The dialog will allow the user to select format, quality, and save location for the entire batch.
  - If a specific video is not available in the user's chosen quality, the system must automatically download the next highest quality available for that video (smart quality fallback).
  - Each successfully downloaded video must have its thumbnail embedded and its filename sanitized.
- **Subtasks:**
  - `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
  - `[ ]` Implement the smart quality fallback logic in the backend download service.
  - `[ ]` Ensure the backend service saves all videos from the batch into a subfolder named after the playlist within the selected location.
  - `[ ]` Ensure thumbnail embedding and filename sanitization work for batch downloads.

---

#### **Story 3.4: View Downloads Page**

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status and retry failed downloads.

- **Acceptance Criteria:**
  - The page must display a list of all downloads with their title, status (e.g., Queued, Downloading, Completed, Failed), and a progress bar.
  - Downloads marked as "Failed" must have a "Retry" button that re-queues the download from the beginning.
- **Subtasks:**
  - `[ ]` Create the `Downloads.tsx` page component.
  - `[ ]` The page should get real-time download status information from the backend task management service.
  - `[ ]` Implement the UI to display the list of downloads with their status and progress.
  - `[ ]` Implement the "Retry" button functionality for failed downloads.

---

#### **Story 3.5: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application so I don't need an external player.

- **Acceptance Criteria:**
  - When a downloaded video is clicked, the app must first verify that the local file still exists. If not, it will show a "File not found" message.
  - The player must correctly load and play the local MP4 video file.
  - The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
  - The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.
- **Subtasks:**
  _ `[ ]` Create a `VideoPlayer.tsx` component.
  _ `[ ]` Implement the pre-playback check for file existence.
  _ `[ ]` Implement the core playback logic for local files.
  _ `[ ]` Implement the full set of basic UI controls (play/pause, volume, seek/buffer bar, loop, subtitle menu). \* `[ ]` Add logic to detect and load any associated subtitle files for the video.
  Of course. Here is the complete and detailed plan for Epic 3, incorporating all the solutions and refinements from our conversation to make it robust and user-friendly.

### **Epic 3: Core Downloading & Offline Playback**

**Goal:** Implement a robust and intelligent archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

#### **Story 3.1: Implement Intelligent Quality Detection Service**

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

- **Acceptance Criteria:**
  - The service must use `yt-dlp` to fetch the list of all available formats for a given URL.
  - The service must parse this list and return a clean, ordered set of available qualities (e.g., '720p', '1080p', '4K', '8K').
- **Subtasks:**
  - `[ ]` Create a backend service that uses `yt-dlp` to fetch format lists.
  - `[ ]` Implement logic to parse and clean the format list into a user-friendly set of quality options.
  - `[ ]` Create an IPC handler that the frontend can call to get these quality options for a given URL.

---

#### **Story 3.2: Download a Single Video via URL**

**As a user,** I want to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.

- **Acceptance Criteria:**
  - The `+ Add` menu will have a "Download Video" option that opens the "Download Video" dialog.
  - When a valid URL is pasted, the dialog must automatically fetch and display a video preview.
  - The dialog must display the default download path and provide a button for the user to change it.
  - The dialog must allow the user to select quality, format (MP4/MP3), and whether to "Include subtitles when available".
  - All downloads must be sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
  - The downloaded video file must have its YouTube thumbnail embedded.
  - Before starting, the system must check for sufficient disk space and show an error if there is not enough.
  - The "Add to Download Queue" button sends the configured download task to the Activity Center.
- **Subtasks:**
  - `[ ]` Add the "Download Video" option to the `+ Add` menu.
  - `[ ]` Create the `DownloadVideoDialog.tsx` component.
  - `[ ]` Implement the auto-fetch and preview functionality.
  - `[ ]` Add UI controls for quality, format, subtitles, and the "Select Location" button.
  - `[ ]` Pass the selected location and options to the backend download service.
  - `[ ]` Implement the disk space check in the backend.
  - `[ ]` Implement filename sanitization and thumbnail embedding.

---

#### **Story 3.3: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, choosing the format, quality, and save location for the batch.

- **Acceptance Criteria:**
  - A "Download Playlist" button will open a dialog with download options.
  - The dialog must display the default download path and provide a button for the user to change it.
  - The dialog must dynamically populate quality options based on the highest quality found within the playlist.
  - The system must use **smart quality fallback**: if a video is unavailable in the chosen quality, it must automatically download the next highest quality available for that specific video.
  - All successfully downloaded videos must have their thumbnails embedded.
- **Subtasks:**
  - `[ ]` Add a "Download Playlist" button to the playlist details view.
  - `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
  - `[ ]` Add a "Select Location" UI element to the dialog.
  - `[ ]` Implement the smart quality fallback logic in the backend download service.
  - `[ ]` Ensure the backend service saves all videos into the selected folder.

---

#### **Story 3.4: View Downloads Page**

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status.

- **Acceptance Criteria:**
  - The page must display a list of all downloads with their title, status, and progress bar.
  - Failed downloads must have a "Retry" button that restarts the download from the beginning.
- **Subtasks:**
  - `[ ]` Create the `Downloads.tsx` page component.
  - `[ ]` The page should get real-time download status information from the backend Task Management service.
  - `[ ]` Implement the UI to display the download list.
  - `[ ]` Implement the "Retry" button functionality for failed items.

---

#### **Story 3.5: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application with a full set of basic controls.

- **Acceptance Criteria:**
  - When clicking a downloaded video, the player must first verify the local file exists. If not, it will show a "File not found" message.
  - The player must correctly load and play the local video file.
  - The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
  - The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.
- **Subtasks:**
  - `[ ]` Create a `VideoPlayer.tsx` component.
  - `[ ]` Implement the check to verify the file exists before attempting playback.
  - `[ ]` Implement the core playback logic for local files.
  - `[ ]` Implement the full set of basic UI controls (play/pause, volume, seek/buffer bar, loop, subtitle menu).
  - `[ ]` Add logic to detect and load any associated subtitle files for the video.
  ### **Epic 4: Background Tasks & Activity Center**

**Goal:** Implement a robust and optimized system for handling long-running tasks in the background and provide a UI for users to monitor the status of imports and downloads.

---

#### **Story 4.1: Persistent Backend Task Management Service**

**As a developer,** I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

- **Acceptance Criteria:**
  - A `background_tasks` table must be created in the SQLite database to store task information.
  - All new tasks (imports, downloads) must be saved as a record in this table.
  - The service must support parent/child task relationships (for playlist downloads) to handle partial failures gracefully.
  - On application startup, the service must read this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed.
- **Subtasks:**
  - `[ ]` Add a `background_tasks` table to the `schema.sql` file.
  - `[ ]` Create a backend service that can add, update, and remove tasks from the database.
  - `[ ]` Implement logic for parent/child task relationships.
  - `[ ]` Create IPC handlers for the frontend to get the current list of tasks and receive real-time updates.

---

#### **Story 4.2: Integrate Core Services with Task Manager**

**As a developer,** I need the import and download services to report their status to the new Task Management service to handle partial failures gracefully.

- **Acceptance Criteria:**
  - Playlist imports and downloads must create a "parent" task. The parent task's progress should reflect the completion of its "child" video tasks.
  - If some videos in a playlist download fail, the parent task should be marked as "Completed with errors."
  - The download service must update the task's progress and final status in the database.
- **Subtasks:**
  - `[ ]` Modify the playlist import and download services to create parent/child tasks in the Task Manager.
  - `[ ]` Modify the download service to report progress and status updates (e.g., In Queue, Downloading, Completed, Failed) to the Task Manager.

---

#### **Story 4.3: Activity Center UI**

**As a user,** I want to see a persistent widget in the corner of the screen that shows me my active tasks, which I can cancel or clear at any time.

- **Acceptance Criteria:**
  - A persistent widget must be displayed in the bottom-right corner of the application.
  - The widget header must show an active task count (e.g., "Active (2)") and a minimize icon.
  - The widget must display a list of all `In Queue` and `In Progress` tasks.
  - Each task item must display its type (e.g., Import, Download), thumbnail, title, a progress bar, and a status tag (e.g., `In Queue`, `Downloading`).
  - Each active task in the widget must have a "Cancel" button that stops the corresponding backend task.
  - To keep the UI performant, progress updates from the backend must be throttled (updated no more than a few times per second).
  - When a task is completed (successfully or failed), it should remain visible with a final status, a timestamp (e.g., "Completed 2m ago"), and then automatically fade out after a short delay.
  - A "Clear All" (trash can icon) button must be present to manually remove all completed tasks from the view.
- **Subtasks:**
  - `[ ]` Create the `ActivityCenter.tsx` widget component.
  - `[ ]` Style it to be a persistent overlay in the bottom-right corner.
  - `[ ]` Implement the real-time connection to the backend Task Manager.
  - `[ ]` Create a `TaskItem.tsx` component with the specified detailed layout.
  - `[ ]` Implement the UI to display the list of tasks with progress bars and "Cancel" buttons.
  - `[ ]` Implement the "Clear All" and "Minimize" functionality.
  - `[ ]` Add the logic for the "fade out on completion" behavior.
  ### **Epic 5: Playlist Health & Status Sync**

**Goal:** Introduce a robust, automated status-checking system for imported playlists, with user-configurable settings, to keep users informed about video availability.

---

#### **Story 5.1: Backend Health Check Service**

**As a developer,** I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

- **Acceptance Criteria:**
  - The service must iterate through the videos of a given playlist.
  - For each video, it must use a lightweight `yt-dlp` command to verify its current status on YouTube.
  - It must update the `availability_status` (e.g., 'Live', 'Deleted', 'Private') for the video in the local database.
  - Crucially, the service must process videos in a **low-concurrency queue** (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.
- **Subtasks:**
  - `[ ]` Create a `HealthCheckService.ts` in the backend.
  - `[ ]` Implement the function that iterates through a playlist's videos.
  - `[ ]` Integrate `p-queue` or a similar library to process the checks in a low-concurrency queue.
  - `[ ]` Implement the logic to call `yt-dlp` for status verification.
  - `[ ]` Implement the database update logic.

---

#### **Story 5.2: Display Video Health Status in UI**

**As a user,** I want to see a colored dot next to each video in an imported playlist so I know if it's still available on YouTube and when that status was last checked.

- **Acceptance Criteria:**
  - In the video list item component, a colored dot must be displayed based on the video's `availability_status` from the database.
  - The colors will be: Green for 'Live', Yellow for 'Unlisted/Private', and Red for 'Deleted'.
  - A tooltip on the dot must explain the status on hover (e.g., "Status: Live").
  - To provide context, the playlist view header must display a "Status last checked: \[timestamp\]" (e.g., "3 hours ago") message.
- **Subtasks:**
  - `[ ]` In the `VideoListItem.tsx` component, add the colored status dot.
  - `[ ]` Implement the logic to map the database status to the correct color.
  - `[ ]` Implement the tooltip component for the status dot.
  - `[ ]` Add the "Last checked" text component to the `PlaylistDetailsView.tsx` header.

---

#### **Story 5.3: Implement Auto-Sync Settings UI**

**As a user,** I want to configure how often my playlists are automatically checked for status updates.

- **Acceptance Criteria:**
  - A dedicated "Auto-Sync Settings" section must be created on the Settings page.
  - The UI must provide controls (e.g., radio buttons) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
  - "Daily" will be the default setting.
  - A note explaining the resource usage trade-off must be present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").
- **Subtasks:**
  - `[ ]` Build the "Auto-Sync Settings" UI section on the `Settings.tsx` page.
  - `[ ]` Implement the UI controls for selecting the frequency.
  - `[ ]` Implement the logic to save the chosen setting using `electron-store`.

---

#### **Story 5.4: Scheduled Background Sync**

**As a developer,** I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

- **Acceptance Criteria:**
  - The scheduler must read the user's sync frequency from settings to determine its interval.
  - The scheduler must **pause** if a user-initiated task (like a new import or download) is active, to prioritize the user's actions. It will resume after the user's tasks are complete.
- **Subtasks:**
  - `[ ]` In the backend, create a scheduler using a reliable method (e.g., `setInterval` on app startup).
  - `[ ]` Implement the logic for the scheduler to read the user's setting.
  - `[ ]` Implement the check to pause/resume the scheduler based on the status of the main task queue.
  - `[ ]` At each interval, the scheduler should trigger the `HealthCheckService` for all relevant playlists.

---

#### **Story 5.5: Manual Playlist Refresh**

**As a user,** I want a button to manually trigger a health check on a specific playlist so I can get its up-to-the-minute status on demand.

- **Acceptance Criteria:**
  - The context menu for any imported YouTube playlist must have a "Refresh Status Now" button.
  - Clicking the button must trigger the `HealthCheckService` for that single playlist.
  - The UI should provide immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon next to the "Last checked" timestamp).
- **Subtasks:**
  - `[ ]` Add the "Refresh Status Now" button to the playlist context menu.
  - `[ ]` Implement the IPC handler to trigger a one-time health check for a specific playlist ID.
  - `[ ]` Implement the UI feedback to show that a manual refresh is in progress.
  ## **Product Requirements Document: Playlistify**

### **1. Introduction**

#### **1.1. Problem Statement**

For both diligent content archivists and casual users, managing and preserving YouTube playlists presents significant challenges. The native YouTube interface offers limited organizational tools, and users face the constant risk of videos becoming unavailable due to deletion or being set to private. This results in a loss of curated content and a lack of true ownership over one's collections. Playlistify aims to solve this by providing a powerful, desktop-based application that gives users ultimate control to manage, archive, and locally access their YouTube content, securely and conveniently.

#### **1.2. Vision**

To be the definitive tool for anyone who is serious about their YouTube collections, transforming the passive viewing experience into an actively managed, secure, and permanent personal library. Playlistify will empower users by giving them complete sovereignty over their content.

### **2. Target Audience**

- **The Digital Archivist:** A user who wants to create a secure, permanent, and locally-controlled archive of YouTube content to prevent loss from deletion or privatization.
- **The Convenience User:** A casual user who wants an easy way to download playlists and videos for offline access (e.g., for travel, commuting, or areas with poor internet).

### **3. Success Metrics (MVP)**

- Number of playlists created and imported per profile.
- Total number of videos successfully downloaded.
- Feature adoption rate for key functions (e.g., use of custom playlists vs. imports, use of the "Health Check" feature).

### **4. Key Features & Scope**

#### **4.1. Minimum Viable Product (MVP)**

The initial release will focus on delivering a stable, core experience without requiring a user to log into a Google account.

**Epic 1: Project Foundation & Playlist Viewing**

- **Goal:** Establish the core application shell and enable users to view and search within playlists.
- **Features:**
  - Main application layout with a persistent sidebar and top navigation bar.
  - Dashboard home screen displaying recently accessed playlists and viewing history.
  - Ability to view the contents of a playlist, including video thumbnails, titles, channel names, duration, view count, and upload date.
  - Search functionality within a selected playlist.
  - Infinite scrolling for seamlessly Browse large playlists.

**Epic 2: Custom Playlist Management**

- **Goal:** Empower users to create, populate, and manage their own local playlists.
- **Features:**
  - A unified "Add Playlist" dialog with tabs for creating a new custom playlist or importing an existing one from a YouTube URL.
  - Ability to add videos from any playlist to a custom playlist.
  - Ability to remove videos from a custom playlist.
  - Functionality to edit the title and description of custom playlists.
  - Ability to delete a custom playlist with a confirmation dialog.

**Epic 3: Core Downloading & Offline Playback**

- **Goal:** Implement the core archiving functionality, allowing users to download videos and watch them offline.
- **Features:**
  - Download a single video via URL with options for format (MP4/MP3), quality, subtitle inclusion, and save location.
  - Download an entire playlist with smart quality fallback (if the selected quality is unavailable, the best available quality is chosen).
  - A dedicated "Downloads" page to view and manage the status of all downloads.
  - An integrated video player for offline playback of downloaded files with controls for play/pause, volume, seek bar, loop toggle, and subtitle display.

**Epic 4: Background Tasks & Activity Center**

- **Goal:** Implement a system for handling long-running tasks in the background and provide a UI for users to monitor progress.
- **Features:**
  - A persistent task management service that tracks the progress of imports and downloads, even if the app is closed and reopened.
  - An "Activity Center" widget in the bottom-right corner displaying the status of all active and queued tasks.
  - The ability for users to cancel any in-progress tasks directly from the Activity Center.

**Epic 5: Playlist Health & Status Sync**

- **Goal:** Introduce automated status checking to keep users informed about video availability.
- **Features:**
  - A "Playlist Health Check" system that periodically checks the status of videos in imported playlists (Live, Deleted, Private) and displays a colored status dot.
  - A "Refresh Playlist" button for on-demand manual status checks.
  - A settings page to configure the frequency of the automatic health checks (e.g., Hourly, Daily, Weekly).

#### **4.2. Post-MVP Roadmap**

Future releases will focus on expanding functionality through account integration and power-user features.

- **Full Account Integration:**
  - Google OAuth2 login and multi-account support.
  - Access to private and unlisted YouTube playlists.
  - Integration of "Liked Videos" and "Watch Later" into the sidebar.
  - A detailed data synchronization center in the settings.
- **Enhanced Features:**
  - A "Trash Can" feature to restore accidentally deleted playlists and videos.
  - Multi-select for batch actions (delete, move, duplicate).
  - Playlist folders and a custom tagging system for advanced organization.
  - A full backup and restore system for the entire user library.
- **UI/UX Improvements:**
  - An "Active Downloads" section on the dashboard.
  - User-selectable accent colors for the UI.
  - Online streaming of videos without downloading.
  - Advanced video player controls like playback speed.

### **5. Technical Constraints & Preferences**

- **Platform:** Electron (for a cross-platform desktop app).
- **Boilerplate:** The project will be built upon the `electron-react-boilerplate` foundation.
- **Core Libraries:**
  - **Frontend:** React, TypeScript, TailwindCSS
  - **UI Components:** shadcn/ui, lucide-react
  - **State Management:** TanStack React Query & Zustand
  - **Backend:** Node.js
  - **Database:** better-sqlite3
  - **YouTube Interaction:** yt-dlp-wrap
  - **Settings Storage:** electron-store
  - **Validation:** Zod
- **Resource Management:** The application must be optimized for low CPU and memory usage, especially when idle. Destructive actions require user confirmation to prevent data loss. Filenames will be sanitized to prevent errors, and downloads will be managed in a queue to avoid system overload.

## Project Structure

```plaintext
playlistify-app/
├── release/              # Packaged application output (git-ignored)
├── assets/               # Static assets like icons for the app installer/builder
└── src/                  # Main source code directory
    ├── backend/          # Backend - Electron Main Process code (Node.js)
    │   ├── db/           # Database schema (schema.sql) and setup scripts
    │   ├── lib/          # Wrappers for external tools (yt-dlp, ffmpeg)
    │   ├── repositories/ # Data access layer (e.g., PlaylistRepository.ts)
    │   ├── services/     # Core backend services (Playlist, Download, HealthCheck)
    │   └── main.ts       # Entry point for the Main Process
    │
    ├── frontend/         # Frontend - Electron Renderer Process code (React)
    │   ├── components/   # Shared/reusable React components
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # Frontend-specific utilities
    │   ├── pages/        # Top-level page components (Dashboard, Settings, etc.)
    │   ├── store/        # Zustand state management store
    │   └── index.tsx     # Entry point for the Renderer Process
    │
    └── shared/             # Code shared between Backend and Frontend processes
        ├── ipc-contracts.ts # TypeScript types for IPC communication
        └── types.ts         # Other shared type definitions
```

### Key Directory Descriptions

- **`src/backend`**: Contains all backend logic. This code runs in Node.js and has access to the operating system, filesystem, and database.
- **`src/frontend`**: Contains all frontend UI code. This code runs in a sandboxed Chromium window and is responsible for everything the user sees and interacts with.
- **`src/shared`**: A crucial directory for holding TypeScript types and definitions that are used by _both_ the backend and frontend to ensure they communicate correctly.
  +++
  id = "styling-conventions-v1"
  title = "Project Styling Conventions: Tailwind CSS & Shadcn UI"
  version = 1.0
  status = "draft"
  effective_date = "2025-06-13"
  scope = "Frontend development, specifically the use of Tailwind CSS and Shadcn UI components within the PlayListify application."
  owner = "Frontend Team"
  template_schema_doc = ".ruru/templates/toml-md/14_standard_guideline.README.md"
  tags = ["styling", "tailwind", "shadcn", "frontend", "conventions", "ui", "css"]
  related_docs = [
  "docs/Frontend-Architecture.md",
  "tailwind.config.js",
  "components.json",
  "src/frontend/styles/globals.css"
  ]
  related_tasks = ["SUBTASK-WRITER-StylingDocs-20250613203947"]
  +++

# Project Styling Conventions: Tailwind CSS & Shadcn UI (v1.0)

**Status:** draft | **Effective Date:** 2025-06-13 | **Owner:** Frontend Team

## Purpose / Goal 🎯

- To establish clear, consistent, and maintainable styling practices for the PlayListify application, focusing on the use of Tailwind CSS and Shadcn UI.
- To ensure all frontend developers adhere to a common set of guidelines, improving code quality, readability, and ease of collaboration.
- To facilitate efficient development and onboarding of new team members by providing a central reference for styling decisions.

## Scope 🗺️

- This guideline applies to all frontend code involving styling within the PlayListify application.
- It covers the configuration and usage of Tailwind CSS utility classes and the integration and customization of Shadcn UI components.
- Project-specific configurations found in [`tailwind.config.js`](tailwind.config.js:0) and [`components.json`](components.json:0) are integral to these conventions.

## Standard / Guideline Details 📜

### Guideline 1: Tailwind CSS Usage

- **Description:** General principles for using Tailwind CSS to ensure consistency and maintainability.
- **Rationale:** Tailwind CSS offers great flexibility. These guidelines help harness that flexibility in a structured way.

- **Color Palette:**
  - Utilize the predefined color palette in [`tailwind.config.js`](tailwind.config.js:10) for all color-related styling.
  - **Primary Colors:** Use `primary` (e.g., `bg-primary`, `text-primary-500`) for main branding elements. The `primary` color is `FF0000` (YouTube Red) with various shades defined.
  - **Theme-based Colors:**
    - For dark mode, use the `dark` color set (e.g., `dark:bg-dark-background`, `dark:text-dark-text`). Key colors include `dark.background` (`#181818`), `dark.text` (`#FFFFFF`).
    - For light mode, use the `light` color set (e.g., `bg-light-background`, `text-light-text`). Key colors include `light.background` (`#FFFFFF`), `light.text` (`#212121`).
  - **Neutral Colors:** Use the `neutral` color scale (e.g., `border-neutral-400`) for borders, subtle backgrounds, and secondary text. The base neutral is `#AAAAAA` (`neutral-400`). Specific YouTube-themed neutrals like `yt-dark-main` are also available.
  - **Semantic Naming for Shadcn CSS Variables:** Tailwind CSS is configured to support Shadcn UI's CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`). Prefer these semantic names when working with Shadcn components or general layout theming, as they adapt to the current theme (light/dark). These are defined in [`tailwind.config.js`](tailwind.config.js:69) (e.g., `backgroundColor.background` maps to `hsl(var(--background))`).

- **Custom Utilities & `@apply`:**
  - **Do:** Favor direct utility class application in HTML/JSX for clarity and co-location of styles.
    ```html
    <button
      class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600"
    >
      Click Me
    </button>
    ```
  - **Consider (with caution):** Use `@apply` within CSS files (e.g., [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0)) for complex, reusable component-like styles that are not easily encapsulated by JavaScript components, or for abstracting very common patterns. However, overuse of `@apply` can reduce the benefits of utility-first CSS.
    ```css
    /* In globals.css or component-specific CSS */
    .custom-button-style {
      @apply bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600;
    }
    ```
  - **Don't:** Create overly broad or generic custom utility classes that replicate existing Tailwind utilities or significantly deviate from the utility-first paradigm without strong justification.

- **Responsive Design:**
  - **Do:** Use Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`) for creating adaptive layouts.
    ```html
    <div class="w-full md:w-1/2 lg:w-1/3">Content</div>
    ```

- **Plugins:**
  - The `tailwindcss-animate` plugin is included (as seen in [`tailwind.config.js`](tailwind.config.js:113)) and primarily used by Shadcn UI for animations like accordions. Be aware of its presence when working with animated components.

### Guideline 2: Shadcn UI Usage

- **Description:** Conventions for importing, using, and customizing Shadcn UI components.
- **Rationale:** Ensures consistent integration and leverage of Shadcn UI's capabilities.

- **Import Strategy:**
  - **Do:** Always import Shadcn UI components using the defined path alias `@{/frontend}/components/ui/...`. This alias is configured in [`components.json`](components.json:13) and [`tsconfig.json`](tsconfig.json).
    ```typescript jsx
    import { Button } from "@/frontend/components/ui/button";
    import { Card, CardContent } from "@/frontend/components/ui/card";
    // As seen in AppLayout.tsx and SettingsPanel.tsx
    ```
  - **Don't:** Use relative paths like `../../components/ui/button` for importing these shared UI components.

- **Component Customization:**
  - **Styling:** Primarily customize Shadcn components using Tailwind utility classes passed via the `className` prop.
    ```typescript jsx
    <Button variant="destructive" size="lg" className="mt-4 w-full">Delete</Button>
    ```
  - **Structure/Behavior:** If deeper customization is needed (beyond what props and utility classes allow), consider:
    1.  Wrapping the Shadcn component in your own custom component.
    2.  If absolutely necessary and the customization is broadly applicable, carefully consider modifying the component file directly within `src/frontend/components/ui/`. This should be a rare case and well-documented.
  - Refer to [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0) for base styles and CSS variables as configured in [`components.json`](components.json:8) which underpins Shadcn UI's theming.

- **Path Aliases for Utilities:**
  - Use the `@/frontend/lib/utils` alias (configured in [`components.json`](components.json:14) and [`tsconfig.json`](tsconfig.json)) for accessing shared utility functions, such as the `cn()` function often used with Shadcn UI for conditional class names.

- **RSC (React Server Components):**
  - Shadcn UI is configured with `rsc: false` in [`components.json`](components.json:4), meaning components are set up for client-side rendering by default.

### Guideline 3: General Styling Practices

- **File Organization:**
  - Global styles and Tailwind base/component/utility layers are primarily managed in [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0).
  - Component-specific styles, if minimal and not reusable, can be co-located with the component using Tailwind classes directly in JSX.
  - For more complex, component-specific styles that cannot be achieved with utilities alone, consider CSS Modules or styled-components if the need arises and is agreed upon by the team. (Currently, the project leans heavily on utility classes).

- **Clarity and Readability:**
  - Aim for readable JSX/HTML. If a long list of utility classes makes a component hard to read, consider breaking the component into smaller pieces or (judiciously) using `@apply` for a small set of highly repeated class combinations.

## Enforcement / Compliance (Optional) 👮

- Code reviews should check for adherence to these styling conventions.
- Linters (ESLint with Tailwind plugin) can help enforce some aspects.

## Exceptions (Optional) 🤷

- Deviations may be acceptable if a specific technical challenge cannot be reasonably solved within these guidelines.
- Exceptions must be discussed with the frontend lead and documented (e.g., in a comment near the code or in the relevant task/ADR).

## Revision History (Optional) ⏳

- **v1.0 (2025-06-13):** Initial draft based on recent Tailwind CSS and Shadcn UI integration.

### **Definitive Tech Stack Selections**

### **Technologies**

- Electron **v36.4.0** for cross-platform desktop application
- React **v19.1.0** with TypeScript **v5.5.3** for UI development
- Tailwind CSS v3.4.1 for styling
- yt-dlp-wrap v2.3.12 for YouTube video downloading
- Zustand v5.0.3 for state management
- TanStack React Query v5.71.10 for data fetching
- TanStack React Router **v1.120.16** for routing
- Electron Store v10.0.1 for persistent storage
- P-Queue v8.1.0 for task queuing
- Winston v3.17.0 for logging
- Fluent-FFmpeg v2.1.3 for media processing
- React Player v2.16.0 for video playback
- Better-SQLite3 **v11.10.0** for database management

### **Required Packages & Dependencies**

#### **Core Packages**

- electron **v36.4.0**
- @electron-forge/cli **v11.5.0**
- typescript **v5.5.3**
- electron-store v10.0.1
- fs-extra **v11.3.0**
- electron-updater v6.6.2
- better-sqlite3 **v11.10.0**
- sqlite3

#### **React & Core UI Packages**

- react **v19.1.0**
- react-dom **v19.1.0**
- react-hook-form v7.54.2

#### **Styling & CSS**

- tailwindcss v3.4.1
- postcss **v8.4.39**
- autoprefixer **v10.4.19**

#### **Routing & Data Fetching**

- @tanstack/react-router **v1.120.16**
- @tanstack/react-query v5.71.10
- react-router-dom v7.5.0
- date-fns v4.1.0

#### **UI Component Libraries**

- shadcn/ui v0.0.4 (primary UI component library)
- class-variance-authority v0.7.1
- clsx v2.1.1
- tailwind-merge v3.1.0
- lucide-react **v0.513.0**
- Note: Radix UI packages are indirect dependencies via shadcn/ui.

#### **Media & Downloads Packages**

- yt-dlp-wrap v2.3.12
- fluent-ffmpeg v2.1.3
- p-queue v8.1.0
- react-player v2.16.0
- winston v3.17.0
- mime-types v3.0.1

#### **Integration Packages**

- axios **v1.9.0**
- zustand v5.0.3
- uuid v11.1.0

#### **Build & Development Packages**

- @electron-forge/plugin-webpack v7.8.0
- @electron/rebuild v3.6.0
- css-loader v6.10.0
- style-loader v3.3.4
- ts-loader v9.5.1
- eslint v8.56.0
- prettier v3.2.5

#### **Testing Packages**

- jest **v30.0.0**
- @testing-library/react **v16.3.0**
- @testing-library/jest-dom **v6.6.3**

# Story 1.1: Main Application Layout

## Status: Completed

## Story

[cite_start]**As a user,** I want to see the main application window with the sidebar and top navigation bar so that I can understand the layout and see the main sections of the app. [cite: 1]

## Acceptance Criteria (ACs)

- [cite_start]AC1: The application opens to a primary window. [cite: 1]
- [cite_start]AC2: A persistent sidebar is visible on the left. [cite: 1]
- [cite_start]AC3: A persistent top navigation bar is visible at the top. [cite: 1]

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 2, 3):** Create the main layout component (`MainLayout.tsx`) that defines the primary application structure, including areas for the sidebar and main content.
- [ ] **Task 2 (AC: 2):** Create the `Sidebar.tsx` component.
  - [ ] Subtask 2.1: It should contain navigation links for Dashboard, Playlists, History, Downloads, and Settings.
  - [ ] Subtask 2.2: Each link should have an appropriate icon from the `lucide-react` library.
- [ ] **Task 3 (AC: 3):** Create the `TopNavbar.tsx` component.
  - [ ] Subtask 3.1: It should include placeholders for a `+ Add` button and a user avatar.
- [ ] **Task 4 (AC: 1, 2, 3):** Integrate the `Sidebar.tsx` and `TopNavbar.tsx` components into `MainLayout.tsx`.
- [cite_start][ ] **Task 5 (AC: 1):** Configure the application's router (`TanStack React Router`) to use the `MainLayout` for all primary views. [cite: 1, 1187]

## Dev Technical Guidance

- [cite_start]**Framework:** Use React with TypeScript. [cite: 1194, 1206]
- [cite_start]**Component Library:** Use `shadcn/ui` for UI components and `lucide-react` for icons. [cite: 1236, 1237]
- [cite_start]**Styling:** Use `TailwindCSS` for styling. [cite: 1238]
- **File Structure:**
  - Place all new components in the `src/frontend/components/` directory as per the Architecture Document's project structure. Specifically, layout components like the sidebar and navbar should be in `src/frontend/components/layout/`.
  - The main layout component should be at `src/frontend/components/layout/MainLayout.tsx`.
- **Routing:** The `TanStack React Router` should be configured to wrap the main application content area with the `MainLayout` component. This ensures the sidebar and navbar are persistent across different pages.
- **Architecture Reference:** This story establishes the foundational UI. The implementation must align with the "Component View" and "Project Structure" defined in the `ArchitectureDocument.md`.

# Story 1.2: Build Dashboard UI Structure

## Status: Completed

## Story

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

## Acceptance Criteria (ACs)

- AC1: A "Dashboard" screen must be created with clearly defined sections for "Recent Playlists" and "Continue Watching".
- AC2: These sections must initially display an appropriate empty state (e.g., "Your recent playlists will appear here").
- AC3: The structure must be ready to receive and display real data as soon as the corresponding features are completed in later stories.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1):** Create the `Dashboard.tsx` page component within the `src/frontend/pages/` directory.
- [ ] **Task 2 (AC: 1):** Implement the layout for the `Dashboard.tsx` page to define widget areas for "Recent Playlists" and "Continue Watching".
- [ ] **Task 3 (AC: 1, 2):** Create a reusable `RecentPlaylistsWidget.tsx` component.
  - [ ] Subtask 3.1: The widget must have a title "Recent Playlists" and a "View all" link.
  - [ ] Subtask 3.2: Implement the empty state UI for the widget, displaying a message like "Your recent playlists will appear here".
- [ ] **Task 4 (AC: 1, 2):** Create a reusable `ContinueWatchingWidget.tsx` component.
  - [ ] Subtask 4.1: The widget must have a title "Continue Watching" and a "View history" link.
  - [ ] Subtask 4.2: Implement the empty state UI for the widget.
- [ ] **Task 5 (AC: 1, 3):** Integrate both the `RecentPlaylistsWidget.tsx` and `ContinueWatchingWidget.tsx` components into the `Dashboard.tsx` page.
- [ ] **Task 6 (AC: 1):** Add the route for `/dashboard` in the router configuration, pointing to the `Dashboard.tsx` component.

## Dev Technical Guidance

- **File Structure:**
  - [cite_start]Page components like the Dashboard should be located at `src/frontend/pages/Dashboard.tsx`. [cite: 1156]
  - Reusable widget components should be located in `src/frontend/components/dashboard/` (e.g., `RecentPlaylistsWidget.tsx`). [cite_start]This aligns with creating feature-specific components. [cite: 1387]
- **State Management:** For this story, local state (`useState`) is sufficient for managing the empty states. [cite_start]The structure should be prepared to integrate `TanStack React Query` in the future for fetching actual data, as specified in the architecture. [cite: 1]
- [cite_start]**Component Library:** Continue using `shadcn/ui` for any necessary UI primitives (like Cards for the widgets) and `lucide-react` for icons. [cite: 1236, 1237]
- **PRD Reference:** The PRD specifies that the dashboard is the home screen displaying recently accessed playlists and viewing history. [cite_start]This story builds the static foundation for that feature. [cite: 2]
- [cite_start]**Architecture Reference:** The `Dashboard` is identified as a key UI Component in the system's "Component View". [cite: 1]

# Story 1.3: Import Public Playlist

## Status: In Progress

## Story

**As a user,** I want to use the `+ Add` menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

## Acceptance Criteria (ACs)

- AC1: The `+ Add` menu must contain an option labeled "Add Playlist".
- AC2: Clicking this option must open a dialog box for the user to paste a YouTube playlist URL.
- AC3: The URL input field must include an 'x' button that appears when text is present, allowing the user to clear the input with a single click.
- AC4: After a valid URL is entered, the dialog must automatically fetch and display a preview of the playlist (Thumbnail, Title, Video Count, etc.).
- AC5: When the user clicks the final "Import" button in the dialog, the dialog must close immediately, and the import task must instantly appear in the Activity Center.
- AC6: The user must be able to freely navigate the application while the background task is running.
- AC7: Once the background task is complete, the new playlist must appear in the sidebar, and a success notification should be displayed.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1, 2):** Create the `AddPlaylistDialog.tsx` component.
- [ ] **Task 2 (AC: 1):** Add the "Add Playlist" item to the `TopNavbar.tsx`'s `+ Add` dropdown menu to open the `AddPlaylistDialog`.
- [ ] **Task 3 (AC: 3):** Implement the URL input field UI within the dialog, including the clear ('x') button.
- [ ] **Task 4 (AC: 4):** Implement a `useQuery` hook (`TanStack React Query`) that calls the `playlist:get-preview` IPC handler when a valid URL is debounced from the input field.
- [ ] **Task 5 (AC: 4):** Implement the UI within the dialog to display the fetched playlist preview data (thumbnail, title, etc.).
- [ ] **Task 6 (AC: 5):** The "Import" button in the dialog should call the `playlist:import` IPC handler.

**Backend (`Main Process`)**

- [ ] **Task 7 (AC: 4):** Create the `playlist:get-preview` IPC handler. This handler will use the `yt-dlp-wrap` library to fetch metadata for the given URL and return a clean JSON object with preview data.
- [ ] **Task 8 (AC: 5, 6):** Create the `playlist:import` IPC handler. This handler should create a new task for the import process and hand it off to the background task management service.

## Dev Technical Guidance

- **IPC Communication:** This story is the first to implement the core IPC-driven communication pattern. [cite_start]The frontend is sandboxed and **must** communicate with the backend via the defined IPC channels. [cite: 1]
- [cite_start]**Backend YouTube Interaction:** All interactions with YouTube **must** be performed on the backend using the `yt-dlp-wrap` library, as specified in the architecture's "External Tool Wrappers". [cite: 1] [cite_start]The backend will expose the `playlist:get-preview` and `playlist:import` channels for the frontend to call. [cite: 1]
- **Background Tasks:** The actual import is a long-running task. [cite_start]The `playlist:import` handler's job is to queue this task in the background worker system (which will be implemented per Epic 4). [cite: 1] [cite_start]For this story, the handler should be structured to place the import job on the queue and immediately return, allowing the UI to remain responsive. [cite: 1]
- [cite_start]**Activity Center Dependency:** The Acceptance Criteria require the import task to appear in the "Activity Center"[cite: 1]. This component is defined in **Epic 4**. For this story, the developer should assume the backend task management service (from Epic 4) will correctly emit a `task:update` event, and the frontend should be prepared to listen for it, even if the Activity Center UI itself is not yet built.
- **UI Components:** Use `shadcn/ui` for the `Dialog`, `Input`, and `Button` components.
- **State Management:**
  - Server state (like the playlist preview) should be managed via `TanStack React Query`.
  - UI state (like the dialog's open/closed status) can be managed with local state (`useState`) or `Zustand` if it needs to be controlled from multiple places.

# Story 1.4: View Playlist Details

## Status: Completed

## Story

**As a user,** I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

## Acceptance Criteria (ACs)

- AC1: Clicking a playlist in the sidebar must display its contents in the main view.
- AC2: The view must show the playlist's header (title, video count, etc.) and a "Last checked" timestamp.
- AC3: Each video in the list must display its Thumbnail, Title, Channel Name, Duration, View Count, Upload Date, a colored status dot, and its downloaded quality (if applicable).
- AC4: A loading state must be shown while data is being fetched.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Create the `PlaylistDetailsView.tsx` component to be rendered in the main content area.
- [ ] **Task 2 (AC: 1):** Implement the logic for `PlaylistDetailsView.tsx` to receive a `playlistId` when a playlist is selected from the sidebar.
- [ ] **Task 3 (AC: 4):** Use a `useQuery` hook (from `TanStack React Query`) to call the `playlist:get-details` IPC handler with the `playlistId`. The hook will manage loading and error states.
- [ ] **Task 4 (AC: 2):** Implement the UI for the playlist header within `PlaylistDetailsView.tsx`, displaying metadata from the fetched data.
- [ ] **Task 5 (AC: 3):** Create a `VideoListItem.tsx` component to display all the required information for a single video.
- [ ] **Task 6 (AC: 3):** In `PlaylistDetailsView.tsx`, map over the video data returned from the `useQuery` hook and render a `VideoListItem.tsx` for each video.
- [ ] **Task 7 (AC: 4):** Implement the loading and empty state UIs based on the status provided by the `useQuery` hook.

**Backend (`Main Process`)**

- [ ] **Task 8 (AC: 1, 2, 3):** Create the `playlist:get-details` IPC handler.
  - [ ] Subtask 8.1: The handler will receive a `playlistId`.
  - [ ] Subtask 8.2: It will use the `PlaylistRepository` and `VideoRepository` to query the SQLite database and retrieve the playlist details and a list of all its associated videos.
  - [cite_start][ ] Subtask 8.3: It will return a single JSON object containing the playlist's metadata and an array of video objects, conforming to the `Playlist` and `Video` data models. [cite: 1]

## Dev Technical Guidance

- [cite_start]**Data Fetching:** This story must use `TanStack React Query` on the frontend to manage server state. [cite: 1] The `useQuery` hook is the correct tool for fetching the playlist details.
- [cite_start]**Backend Data Access:** The backend handler **must** use the Repository Pattern to interact with the database. [cite: 1] This abstracts the SQLite queries and keeps the business logic clean.
- **Data Models:** The data returned from the backend **must** align with the `Playlist` and `Video` interfaces defined in the `ArchitectureDocument.md` under "Data Models".
- **Status Dot Dependency:** The "colored status dot" (AC3) is related to the "Playlist Health & Status Sync" features of **Epic 5**. The developer should implement the UI element for the dot in the `VideoListItem.tsx` component. The dot's color will be determined by the `availabilityStatus` field on the `Video` model. For now, it can be implemented with a default "Unchecked" status until Epic 5 is complete.
- **File Structure:**
  - The `PlaylistDetailsView.tsx` component is a page-level view and should reside in `src/frontend/pages/` or a similar top-level view directory.
  - The `VideoListItem.tsx` is a reusable component and should be placed in `src/frontend/components/playlist/`.
  # Story 1.5: Search within Playlist

## Status: Draft

## Story

**As a user,** I want to search for a specific video by title within a selected playlist so that I can find content quickly.

## Acceptance Criteria (ACs)

- AC1: A search input field must be present on the playlist detail view.
- AC2: As the user types in the search field, the visible list of videos must filter in real-time to show only videos whose titles match the search query.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Add a search `Input` component (from `shadcn/ui`) to the `PlaylistDetailsView.tsx` component.
- [ ] **Task 2 (AC: 2):** Create a local component state (e.g., `const [searchQuery, setSearchQuery] = useState('');`) in `PlaylistDetailsView.tsx` to hold the search query text.
- [ ] **Task 3 (AC: 2):** Implement a debounced version of the search query state to prevent performance issues on large lists. This can be done with a custom hook or a library like `use-debounce`.
- [ ] **Task 4 (AC: 2):** Implement the client-side filtering logic. Before rendering the list of `VideoListItem.tsx` components, filter the array of video data (provided by the `useQuery` hook from Story 1.4) based on the debounced search query. The filter should be case-insensitive.
- [ ] **Task 5 (AC: 2):** If the filtered list is empty, display a "No results found" message to the user.

## Dev Technical Guidance

- [cite_start]**State Management:** The search query is transient UI state and should be managed locally within the `PlaylistDetailsView.tsx` component using the `useState` hook. [cite: 99] There is no need for `Zustand` or `TanStack React Query` for the search text itself.
- **Filtering Logic:** The filtering should happen entirely on the client-side. The data fetched by `TanStack React Query` in the parent component should be used as the source of truth, and a derived, filtered array should be passed to the rendering logic.
- **Performance:** To avoid re-rendering the entire list on every single keystroke, the search input must be debounced. A delay of 200-300ms is standard.
- **UI Components:** Use the `Input` component from `shadcn/ui` for the search field.

# Story 1.6: Infinite Scroll for Video Lists

## Status: Ready for Testing

## Story

**As a user Browse a large playlist,** I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

## Acceptance Criteria (ACs)

- AC1: For playlists with a large number of videos (e.g., >100), the UI must not hang or become slow.
- AC2: Only the currently visible video items should be rendered in the DOM.
- AC3: Scrolling must be smooth and performant.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1, 2, 3):** Research and choose a library for list virtualization. `@tanstack/react-virtual` is recommended for consistency with the existing tech stack. (Chosen: `@tanstack/react-virtual`)
- [ ] **Task 2 (AC: 1, 2, 3):** Install the chosen library as a project dependency.
- [ ] **Task 3 (AC: 1, 2, 3):** Refactor the video list rendering logic in `PlaylistDetailsView.tsx`.
  - [ ] Subtask 3.1: Replace the existing `.map()` function with the hooks and components provided by the virtualization library.
  - [ ] Subtask 3.2: Configure the library to correctly render the `VideoListItem.tsx` component for each item in the virtualized list.
- [ ] **Task 4 (AC: 1, 3):** Create a large mock dataset (e.g., an array of 1000+ video objects) for testing purposes. (Added `generateMockVideos` and `MOCK_PLAYLIST_LARGE_1000` in `PlaylistDetailsView.tsx`)
- [ ] **Task 5 (AC: 1, 3):** Thoroughly test the implementation using the mock data to ensure scrolling is smooth, memory usage is low, and the UI remains responsive. (Setup complete for manual testing using `MOCK_PLAYLIST_LARGE_1000`.)

## Dev Technical Guidance

- **Virtualization vs. Infinite Scroll:** While the story title uses the term "Infinite Scroll," the acceptance criteria and subtasks point to "List Virtualization." Virtualization is the correct technique here, as the goal is to improve performance by rendering only visible items from an already-loaded list, rather than fetching more data from a server on scroll.
- **Recommended Library:** The project already uses `TanStack` libraries (`React Query`, `React Router`). Using `@tanstack/react-virtual` is highly recommended to maintain consistency in the tech stack.
- **Implementation Focus:** The main work will be in `PlaylistDetailsView.tsx`. The developer will need to wrap the list container and the list items in the components/hooks provided by the chosen library. This involves calculating the total list size, the size of each item, and letting the library handle the rendering of only the visible items.
- **Testing:** It is critical to test this with a large dataset. The developer should create a simple utility function to generate an array of 1000 or more mock video objects to properly simulate a large playlist and verify that the DOM is not overloaded and scrolling performance meets the acceptance criteria.

# Story 2.1: Add New Playlist (Custom or from YouTube)

## Status: Draft

## Story

**As a user,** I want to select 'Add Playlist' from the main menu and then choose whether to create a new custom playlist or import one from a YouTube URL within a single dialog.

## Acceptance Criteria (ACs)

- AC1: The `+ Add` dropdown menu must contain a single option: "Add Playlist".
- AC2: Clicking this opens a dialog titled "Add Playlist" with two tabs: "Custom Playlist" and "Add from YouTube".
- AC3: The "Custom Playlist" tab must have fields for Title and Description and a "Create Playlist" button.
- AC4: The Title field must enforce a 100-character limit and the Description field must enforce a 512-character limit. Both should display a character counter (e.g., `25/100`).
- AC5: If a user tries to create a playlist with a title that already exists, an error message must be displayed, and the playlist will not be created.
- AC6: The "Add from YouTube" tab must contain the full preview-and-import flow defined in Epic 1.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Update the `TopNavbar.tsx` component's `+ Add` menu to have a single "Add Playlist" item.
- [ ] **Task 2 (AC: 2):** Refactor the `AddPlaylistDialog.tsx` component to use a tabbed interface. The `Tabs` component from `shadcn/ui` is recommended.
- [ ] **Task 3 (AC: 3, 4):** Build the form for the "Custom Playlist" tab, including `Input` (for Title), `Textarea` (for Description), and a "Create Playlist" `Button`. Implement the character counters for the input fields.
- [ ] **Task 4 (AC: 5):** When the "Create Playlist" button is clicked, call the `playlist:create-custom` IPC handler. Handle any errors returned (e.g., duplicate title) by displaying a message to the user.
- [ ] **Task 5 (AC: 6):** Integrate the existing YouTube import components and logic (from Story 1.3) into the "Add from YouTube" tab.

**Backend (`Main Process`)**
**Backend (`Main Process`)**

- [cite_start][ ] **Task 6 (AC: 5):** Create the `playlist:create-custom` IPC handler as defined in the Architecture Document. [cite: 1070]
  - [ ] Subtask 6.1: The handler should accept `{title: string, description: string}`.
  - [ ] Subtask 6.2: It must perform validation by querying the database to ensure no other playlist exists with the same title. If a duplicate is found, it should return an error.
  - [cite_start][ ] Subtask 6.3: If the title is unique, it will create a new record in the `playlists` table with `type: 'CUSTOM'` and the provided details. [cite: 1172, 1178]

## Dev Technical Guidance

- **UI Components:** Use the `Tabs`, `Input`, `Textarea`, and `Button` components from `shadcn/ui`.
- **Validation:** The check for duplicate playlist titles **must** be performed on the backend to ensure data integrity. The frontend can optimistically validate, but the backend is the source of truth.
- **Code Reuse:** The functionality for the "Add from YouTube" tab has largely been built in Story 1.3. The components and logic should be reused and placed within the new tab structure.
- **IPC API:** This story introduces a new endpoint on the internal IPC API: `playlist:create-custom`. This should be implemented following the established patterns.
- [cite_start]**Data Model:** When creating the new playlist, the `type` property in the `playlists` database table must be set to `'CUSTOM'`. [cite: 1172]

# Story 2.2: Add Videos to a Custom Playlist

## Status: Implemented

## Story

**As a user,** I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

## Acceptance Criteria (ACs)

- AC1: A context menu on any video item must provide an "Add to Playlist" option.
- AC2: This option must open a submenu or dialog listing all the user's custom playlists.
- AC3: If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry will be created. A brief, non-blocking notification (e.g., "Video is already in this playlist") should be shown.
- AC4: Selecting a playlist correctly adds the video to it and provides a success notification (e.g., "Video added to 'My Favorites'").

## Tasks / Subtasks

**Frontend (`Renderer Process`)**
**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1, 2):** In the `VideoListItem.tsx` component, implement a `ContextMenu` (from `shadcn/ui`) that shows an "Add to Playlist" option.
- [ ] **Task 2 (AC: 2):** The "Add to Playlist" option should trigger a submenu that displays a list of all available custom playlists. This list should be fetched via a new IPC handler: `playlists:get-custom-list`.
- [ ] **Task 3 (AC: 4):** When a user selects a custom playlist from the submenu, call the `playlist:add-video-to-custom` IPC handler with the `videoId` and the selected `playlistId`.
- [ ] **Task 4 (AC: 3, 4):** Implement a toast notification system (e.g., using `react-hot-toast` or the `Toast` component from `shadcn/ui`) to display the success or "already exists" message returned from the backend.

**Backend (`Main Process`)**

- [ ] **Task 5 (AC: 2):** Create a new `playlists:get-custom-list` IPC handler that queries the database and returns a list of all playlists where `type = 'CUSTOM'`.
- [ ] **Task 6 (AC: 3, 4):** Create the `playlist:add-video-to-custom` IPC handler.
  - [ ] Subtask 6.1: The handler will accept `{ videoId: string, playlistId: string }`.
  - [ ] Subtask 6.2: It must first query the `playlist_videos` junction table to check if the combination of `playlist_id` and `video_id` already exists.
  - [ ] Subtask 6.3: If the entry exists, return a status indicating the video is already in the playlist.
  - [ ] Subtask 6.4: If the entry does not exist, insert a new record into the `playlist_videos` table and return a success status.

## Dev Technical Guidance

- [cite_start]**Database Interaction:** This feature's core logic involves adding an entry to the `playlist_videos` junction table, which manages the many-to-many relationship between playlists and videos. [cite: 1083]
- **Duplicate Prevention:** The backend **must** handle the check for existing entries before attempting an `INSERT` to provide a clean user experience. While the database's primary key would prevent duplicates, the application logic should catch this first and return a user-friendly message.
- **UI Components:** Use the `ContextMenu` and `Toast` (or `useToast` hook) from `shadcn/ui`.
- **IPC API:** This story requires two new IPC handlers:
  1.  `playlists:get-custom-list`: A simple handler to fetch and display the names of custom playlists in the UI.
  2.  `playlist:add-video-to-custom`: The handler to perform the action of associating a video with a playlist.
- [cite_start]**Repositories:** The backend handlers should use the `PlaylistRepository` and/or `VideoRepository` to interact with the database, following the established Repository Pattern. [cite: 1004]

# Story 2.3: Remove Videos from a Custom Playlist

## Status: Implemented

## Story

**As a user,** I want to remove a video from one of my custom playlists to keep it organized and relevant.

## Acceptance Criteria (ACs)

- AC1: A context menu on any video item _within a custom playlist_ must provide a "Remove from Playlist" option.
- AC2: A confirmation dialog must be displayed before removing the video.
- AC3: The confirmation dialog must clearly state that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists. (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library.")

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** In the `VideoListItem.tsx` component's `ContextMenu`, add logic to conditionally display a "Remove from Playlist" option. This option should only be visible if the parent `PlaylistDetailsView` is displaying a playlist of `type: 'CUSTOM'`.
- [ ] **Task 2 (AC: 2, 3):** Create a confirmation dialog component (e.g., using `AlertDialog` from `shadcn/ui`). The dialog must display the specific warning text from AC3.
- [ ] **Task 3 (AC: 2):** Clicking the "Remove from Playlist" option should open this confirmation dialog.
- [ ] **Task 4 (AC: 2):** On confirmation, call the `playlist:remove-video-from-custom` IPC handler with the `videoId` and `playlistId`.
- [ ] **Task 5 (AC: 1):** After a successful removal, the UI should update to remove the video from the list. This can be achieved by refetching the playlist data using `TanStack React Query`'s `invalidateQueries`.

**Backend (`Main Process`)**

- [ ] **Task 6 (AC: 1):** Create the `playlist:remove-video-from-custom` IPC handler.
  - [ ] Subtask 6.1: The handler will accept `{ videoId: string, playlistId: string }`.
  - [ ] Subtask 6.2: It will use the `PlaylistRepository` to call a method that deletes the corresponding entry from the `playlist_videos` junction table.
  - [ ] Subtask 6.3: It will return a success status upon completion.

## Dev Technical Guidance

- **Conditional UI:** The key frontend challenge is displaying the "Remove from Playlist" option only when appropriate. The `PlaylistDetailsView` component, which fetches the playlist data, will need to pass down a prop like `isCustomPlaylist: boolean` to the `VideoListItem` components.
- **Database Interaction:** The backend logic is a straightforward `DELETE` operation on the `playlist_videos` junction table, targeting the row that matches both the `playlist_id` and `video_id`.
- **User Confirmation:** For destructive actions like this, a confirmation dialog is critical to prevent accidental data loss. Use a modal dialog like `AlertDialog` from `shadcn/ui` to implement this.
- **UI Updates:** After the backend confirms the removal, the frontend needs to reflect this change. The recommended approach with `TanStack React Query` is to invalidate the query associated with `playlist:get-details`. This will trigger a refetch, ensuring the UI displays the updated list of videos.

# Story 2.4: Edit Custom Playlist Details

## Status: Implemented

## Story

**As a user,** I want to be able to change the title and description of my custom playlists after I've created them.

## Acceptance Criteria (ACs)

- AC1: A context menu on any custom playlist must provide an "Edit Details" option.
- AC2: This opens a dialog pre-filled with the current title and description.
- AC3: The system must prevent renaming a playlist to a title that already exists, showing an error if attempted.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** In the `Sidebar.tsx` component (or wherever playlists are listed), implement a `ContextMenu` on each playlist item.
- [ ] **Task 2 (AC: 1):** The `ContextMenu` should conditionally show an "Edit Details" option only if the playlist's `type` is `CUSTOM`.
- [ ] **Task 3 (AC: 2):** Create an `EditPlaylistDialog.tsx` component. This dialog will contain a form with `Input` and `Textarea` fields for the title and description.
- [ ] **Task 4 (AC: 2):** When the "Edit Details" option is clicked, open the `EditPlaylistDialog` and pre-populate the form fields with the selected playlist's current data.
- [ ] **Task 5 (AC: 3):** On form submission, call the `playlist:edit-details` IPC handler. If an error is returned (e.g., duplicate title), display it to the user in the dialog.
- [ ] **Task 6 (AC: 1):** After a successful update, the UI in the sidebar should refresh to show the new playlist title.

**Backend (`Main Process`)**

- [ ] **Task 7 (AC: 3):** Create the `playlist:edit-details` IPC handler.
  - [ ] Subtask 7.1: The handler will accept `{ playlistId: string, title: string, description: string }`.
  - [ ] Subtask 7.2: It must perform validation to ensure the new `title` is not already used by another playlist. The query should exclude the current `playlistId` from the check.
  - [ ] Subtask 7.3: If validation fails, return an error.
  - [ ] Subtask 7.4: If validation passes, use the `PlaylistRepository` to update the corresponding record in the `playlists` table.

## Dev Technical Guidance

- **Conditional UI:** The `Sidebar` component will need access to the `type` property of each playlist to conditionally render the "Edit Details" option in the context menu.
- **Backend Validation:** The duplicate title check is a critical data integrity requirement and **must** be enforced on the backend before the `UPDATE` operation is executed.
- **UI Refresh:** After a successful edit, the frontend needs to show the updated information. Invalidating the `TanStack React Query` key used to fetch the list of playlists will trigger a refetch and update the UI automatically.
- **IPC API:** This story introduces a new `playlist:edit-details` IPC handler that performs an update operation.
- **Repositories:** The backend handler should use the `PlaylistRepository` to perform the `UPDATE` query on the `playlists` table.

# Story 2.5: Delete a Custom Playlist

## Status: Completed

## Story

**As a user,** I want to delete an entire custom playlist that I no longer need.

## Acceptance Criteria (ACs)

- AC1: A context menu on any custom playlist must provide a "Delete Playlist" option.
- AC2: A confirmation dialog must be displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
- AC3: If a video from the playlist is currently playing, confirming the deletion must first stop the video playback before deleting the playlist.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** In the `Sidebar.tsx` component, add a "Delete Playlist" item to the `ContextMenu`. This option must only be visible for playlists of `type: 'CUSTOM'`.
- [ ] **Task 2 (AC: 2):** Clicking "Delete Playlist" must open an `AlertDialog` (from `shadcn/ui`) that displays the specified confirmation message.
- [ ] **Task 3 (AC: 3):** Implement a global state slice using `Zustand` to manage the currently playing video's state (e.g., `{ videoId, playlistId }`).
- [ ] **Task 4 (AC: 3):** When the user confirms the deletion, the frontend must first check the global player state. If a video from the playlist being deleted is active, it must first dispatch an action to stop playback.
- [ ] **Task 5 (AC: 1):** After stopping playback (if necessary), call the `playlist:delete-custom` IPC handler with the `playlistId`.
- [ ] **Task 6 (AC: 1):** After a successful deletion, update the UI by invalidating the query that fetches the playlist list.

**Backend (`Main Process`)**

- [ ] **Task 7 (AC: 1):** Create the `playlist:delete-custom` IPC handler.
  - [ ] Subtask 7.1: The handler will accept a `playlistId`.
  - [ ] Subtask 7.2: It will use the `PlaylistRepository` to execute a `DELETE` operation on the `playlists` table for the given ID.

## Dev Technical Guidance

- **Destructive Action:** Deletion is permanent. The `AlertDialog` component from `shadcn/ui` is appropriate for this type of confirmation, as it requires an explicit user action to proceed.
- **Player State Management:** The requirement to stop playback (AC3) necessitates a global state manager. The architecture specifies `Zustand` for this purpose. A simple state slice should be created to track the currently playing video and its source playlist. The deletion logic on the frontend **must** consult this state before calling the backend.
- [cite_start]**Database Cascade:** The database schema for the `playlist_videos` table is defined with `ON DELETE CASCADE`. [cite: 1179] This means the backend only needs to delete the record from the `playlists` table; the database will automatically handle the removal of all associated video entries from the `playlist_videos` junction table. The developer should be aware of this behavior.
- **IPC API:** This story introduces a `playlist:delete-custom` IPC handler to perform the deletion.

# Story 3.1: Implement Intelligent Quality Detection Service

## Status: Implemented

## Story

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

## Acceptance Criteria (ACs)

- AC1: The service must use `yt-dlp` to fetch a list of all available formats for a given URL.
- AC2: The service must parse this list and return a clean set of available qualities (e.g., '720p', '1080p', '4K').
- AC3: The service must be exposed via an IPC handler that the frontend can call.

## Tasks / Subtasks

**Backend (`Main Process`)**

- [ ] **Task 1 (AC: 1):** In the `src/backend/services/` directory, create a new service, e.g., `QualityDetectionService.ts`.
- [ ] **Task 2 (AC: 1):** Within this service, create a function that uses the `yt-dlp-wrap` library to execute a command to fetch available video formats for a given URL (e.g., using the `--list-formats` flag).
- [ ] **Task 3 (AC: 2):** Implement logic to parse the raw output from `yt-dlp`. The logic should extract video-only formats, identify their resolution (e.g., 1080p), and create a clean, de-duplicated array of available quality strings (e.g., `['4K', '1080p', '720p']`).
- [ ] **Task 4 (AC: 3):** Create the IPC handler `download:get-quality-options` as defined in the `ArchitectureDocument.md`. This handler will call the new quality detection service and return the clean array of qualities to the frontend.

## Dev Technical Guidance

- **Backend Focus:** This is a pure backend story with no UI component. All work will be within the `Main Process` source code.
- **External Tool Wrapper:** The implementation must use the `yt-dlp-wrap` library for interacting with `yt-dlp`, as specified in the project's architecture.
- **IPC API:** The new service must be exposed to the frontend via the `download:get-quality-options` IPC channel. The handler should accept a URL string and return a promise that resolves to an array of quality strings (e.g., `Promise<string[]>`).
- **Parsing Logic:** The output of `yt-dlp --list-formats` can be verbose. The parsing logic needs to be robust enough to handle various formats and correctly identify unique video resolutions. It should filter out audio-only streams and formats with no resolution data.
- **Error Handling:** The service should gracefully handle cases where a URL is invalid or `yt-dlp` fails, returning an empty array or throwing an error that the IPC handler can catch and forward to the frontend.

# Story 3.2: Download a Single Video via URL

## Status: Draft

## Story

**As a user,** I want to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.

## Acceptance Criteria (ACs)

- AC1: The `+ Add` menu will have a "Download Video" option that opens the "Download Video" dialog.
- AC2: When a valid URL is pasted, the dialog must automatically fetch and display a video preview.
- AC3: The dialog must display the default download path and provide a button for the user to change it.
- AC4: The dialog must allow the user to select quality, format (MP4/MP3), and whether to "Include subtitles when available".
- AC5: All downloads must be sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
- AC6: The downloaded video file must have its YouTube thumbnail embedded.
- AC7: Before starting, the system must check for sufficient disk space and show an error if there is not enough.
- AC8: The "Add to Download Queue" button sends the configured download task to the Activity Center.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Add a "Download Video" item to the `+ Add` menu in `TopNavbar.tsx`.
- [ ] **Task 2 (AC: 1):** Create the `DownloadVideoDialog.tsx` component.
- [ ] **Task 3 (AC: 2):** Implement the auto-fetch and preview functionality by calling the `playlist:get-preview` IPC handler, reusing logic from Story 1.3.
- [ ] **Task 4 (AC: 4):** When a preview is loaded, call the `download:get-quality-options` IPC handler (from Story 3.1) and populate a quality selection dropdown.
- [ ] **Task 5 (AC: 3, 4):** Add UI controls for format (MP4/MP3), subtitles, and a "Select Location" button.
- [ ] **Task 6 (AC: 3):** The "Select Location" button must call a new IPC handler (e.g., `dialog:show-select-folder`) to open a native OS dialog.
- [ ] **Task 7 (AC: 8):** The "Add to Download Queue" button must gather all selected options and call the `download:start` IPC handler.

**Backend (`Main Process`)**

- [ ] **Task 8 (AC: 3):** Create the `dialog:show-select-folder` IPC handler that opens a native "select folder" dialog and returns the chosen path.
- [ ] **Task 9 (AC: 7):** Create a pre-download utility service to check for sufficient disk space at the selected path.
- [ ] **Task 10 (AC: 5, 6):** Create a download processing service that:
  - [ ] Sanitizes the video title to create a valid filename.
  - [ ] Uses `fluent-ffmpeg` to embed the thumbnail into the downloaded video file.
- [ ] **Task 11 (AC: 8):** Implement the `download:start` IPC handler.
  - [ ] Subtask 11.1: It receives the download options from the frontend.
  - [ ] Subtask 11.2: It performs the disk space check.
  - [ ] Subtask 11.3: It creates a new task in the background task manager (from Epic 4) and adds the download job to the `p-queue`. The job will use `yt-dlp-wrap` for downloading and the new processing service for sanitization and thumbnail embedding.

## Dev Technical Guidance

- **IPC for Native Dialogs:** Interacting with the native file system, like opening a "Save" or "Select Folder" dialog, is a privileged operation. It **must** be done via an IPC call from the sandboxed renderer process to the main process.
- **Background Task Lifecycle:** The `download:start` IPC handler should return immediately after queueing the task. The actual download process must run entirely in the background worker (`p-queue`) to keep the UI from freezing. The backend task manager (from Epic 4) is responsible for tracking progress and status.
- **Media Processing:** The architecture specifies `fluent-ffmpeg` for media processing. This should be used to embed the downloaded thumbnail into the final MP4 file's metadata.
- **Dependencies:** This story depends on the quality detection service from Story 3.1 and the background task management system from Epic 4.
- **Error Handling:** The backend must handle potential errors gracefully, such as invalid URLs, insufficient disk space, or `yt-dlp` failures, and update the task status accordingly.

# Story 3.3: Download an Entire Playlist

## Status: Draft

## Story

**As a user,** I want to download all videos from a playlist with a single action, and for any video that doesn't have my selected quality, I want the app to automatically download the best available quality instead.

## Acceptance Criteria (ACs)

- AC1: A "Download Playlist" button on the playlist details view will open the download dialog.
- AC2: The dialog will allow the user to select format, quality, and save location for the entire batch.
- AC3: If a specific video is not available in the user's chosen quality, the system must automatically download the next highest quality available for that video (smart quality fallback).
- AC4: Each successfully downloaded video must have its thumbnail embedded and its filename sanitized.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Add a "Download Playlist" `Button` to the `PlaylistDetailsView.tsx` component's header.
- [ ] **Task 2 (AC: 1, 2):** Create the `DownloadPlaylistDialog.tsx` component, which can be a variation of the `DownloadVideoDialog.tsx`. It should allow selecting format, quality, and save location.
- [ ] **Task 3 (AC: 2):** The dialog's "Add to Download Queue" button should call the `download:start` IPC handler, passing the playlist ID and the selected batch options.

**Backend (`Main Process`)**

- [ ] **Task 4 (AC: 2, 3):** Modify the `download:start` IPC handler to differentiate between single video and playlist downloads.
- [ ] **Task 5 (AC: 2, 3):** When a playlist download is initiated:
  - [ ] Subtask 5.1: Create a "parent" task for the entire playlist download in the `background_tasks` table. The `BackgroundTask` model supports parent/child relationships.
  - [ ] Subtask 5.2: Fetch the full list of videos for the given playlist.
  - [ ] Subtask 5.3: For each video in the playlist, create a "child" download task and add it to the `p-queue`. The parent task's progress will be an aggregate of its children.
- [ ] **Task 6 (AC: 3):** Implement the "smart quality fallback" logic in the backend download service. Before a child task is added to the queue, the service must:
  - [ ] Call the quality detection service (from Story 3.1) for that specific video.
  - [ ] Check if the user's desired quality is available.
  - [ ] If not, select the next-highest available quality.
- [ ] **Task 7 (AC: 2):** Ensure the download service saves all videos from the batch into a subfolder named after the playlist title, within the user-selected save location.

## Dev Technical Guidance

- **Parent/Child Tasks:** The architecture's `BackgroundTask` data model supports a `parentId`, which is crucial for this feature. A playlist download should be a single parent task that orchestrates many child tasks (one per video). This allows for granular progress tracking and handling of partial failures.
- **Smart Quality Fallback:** This is a key requirement. The logic for choosing the quality must run for _each individual video_ in the playlist, as format availability can vary from video to video. This reuses the service created in Story 3.1.
- **Code Reuse:** The core download logic for a single video (sanitization, thumbnail embedding, etc., from Story 3.2) should be encapsulated in a reusable function that can be called by each child task.
- **File Organization:** The backend service must create a new subfolder for the downloaded files. The folder should be named after the playlist's title (with sanitization for valid folder names).

# Story 3.4: View Downloads Page

## Status: Draft

## Story

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status and retry failed downloads.

## Acceptance Criteria (ACs)

- AC1: The page must display a list of all downloads with their title, status (e.g., Queued, Downloading, Completed, Failed), and a progress bar.
- AC2: Downloads marked as "Failed" must have a "Retry" button that re-queues the download from the beginning.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Create the `Downloads.tsx` page component and add it to the application's router.
- [ ] **Task 2 (AC: 1):** Implement the logic to listen for the `task:update` IPC event from the backend. This event will provide a real-time list of all download tasks. The component should store this list in its state.
- [ ] **Task 3 (AC: 1):** Create a `DownloadListItem.tsx` component to render a single download task's information, including its title, status, and a `Progress` bar component from `shadcn/ui`.
- [ ] **Task 4 (AC: 1):** In the `Downloads.tsx` page, map over the list of tasks and render a `DownloadListItem.tsx` for each one.
- [ ] **Task 5 (AC: 2):** In `DownloadListItem.tsx`, conditionally display a "Retry" `Button` if the task's status is `Failed`.
- [ ] **Task 6 (AC: 2):** Clicking the "Retry" button should call a new `download:retry` IPC handler, passing the ID of the failed task.

**Backend (`Main Process`)**

- [ ] **Task 7 (AC: 1):** Ensure the backend's task management service periodically pushes the list of all tasks to the frontend via the `task:update` IPC channel, as defined in the architecture.
- [ ] **Task 8 (AC: 2):** Create the `download:retry` IPC handler.
  - [ ] Subtask 8.1: The handler will accept a failed `taskId`.
  - [ ] Subtask 8.2: It will look up the original parameters of the failed task from the `background_tasks` table.
  - [ ] Subtask 8.3: It will use these parameters to queue a new download job with the background task manager, effectively retrying the download.

## Dev Technical Guidance

- **Real-Time Updates:** This page is not a "fetch-once" view. It must listen for the `task:update` push event from the backend to display real-time progress. The frontend should register its listener when the component mounts and unregister it on unmount.
- **Backend Data Source:** The backend is the single source of truth for all task statuses. The `background_tasks` table in the database is where this state is persisted.
- **Retry Logic:** The "Retry" button on the frontend simply tells the backend _which_ task to retry. The backend is responsible for all the logic of creating and queueing the new download task based on the failed one's original information.
- **UI Components:** Use `Progress` and `Button` from `shadcn/ui`. The list can be rendered in a `Table` or as a series of `Card` components.

# Story 3.5: Basic Offline Playback

## Status: Draft

## Story

**As a user,** I want to click on a successfully downloaded video and have it play within the application so I don't need an external player.

## Acceptance Criteria (ACs)

- AC1: When a downloaded video is clicked, the app must first verify that the local file still exists. If not, it will show a "File not found" message.
- AC2: The player must correctly load and play the local MP4 video file.
- AC3: The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
- AC4: The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 2, 3, 4):** Create a `VideoPlayer.tsx` component. This component will be responsible for rendering the video and all custom controls. A library like `ReactPlayer` could be used, or the native HTML5 `<video>` element.
- [ ] **Task 2 (AC: 1):** When a user clicks a downloaded video, before showing the player, call a new `fs:verify-file-exists` IPC handler with the video's `downloadPath`.
- [ ] **Task 3 (AC: 1):** If the IPC handler returns `false`, display a "File not found" message to the user.
- [ ] **Task 4 (AC: 2):** If the file exists, render the `VideoPlayer.tsx` component, passing the local file path to it. The path will need to be properly formatted for the player to access it (e.g., using a custom file protocol exposed by Electron).
- [ ] **Task 5 (AC: 3, 4):** Implement the UI controls for the player, including play/pause, volume slider, a loop toggle button, a seek bar that shows buffering progress, and a menu for subtitle selection.

**Backend (`Main Process`)**

- [ ] **Task 6 (AC: 1):** Create the `fs:verify-file-exists` IPC handler. This handler will accept a file path string and use Node.js's `fs` module to check for the file's existence, returning `true` or `false`.
- [ ] **Task 7 (AC: 3):** Implement logic in the backend (likely in the `fs` service) to detect associated subtitle files (e.g., `.vtt` or `.srt` files with the same name as the video file) for a given video path. This information will be needed to populate the subtitle menu in the player.

## Dev Technical Guidance

- **File System Access:** The sandboxed frontend (Renderer Process) cannot directly check if a file exists on the user's hard drive. This check **must** be delegated to the Main Process via an IPC call for security and proper functioning.
- **Serving Local Files:** To play a local file in the `VideoPlayer.tsx` component, you cannot use a standard `file://` path due to security restrictions. The developer will need to use Electron's `protocol.registerFileProtocol` to create a custom protocol (e.g., `app://`) that can securely serve files from the user's disk to the renderer process.
- **Player Controls:** Building a custom player control overlay on top of the `<video>` element gives the most flexibility to match the application's UI/UX. The controls' state (playing, volume, loop) should be managed within the `VideoPlayer.tsx` component.
- **Subtitles:** The logic to find available subtitle tracks should be on the backend. The frontend player can then request the list of available subtitle tracks and load the selected one using a `<track>` element within the `<video>` tag.

# Story 4.1: Persistent Backend Task Management Service

## Status: Partially Implemented

## Story

**As a developer,** I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

## Acceptance Criteria (ACs)

- AC1: A `background_tasks` table must be created in the SQLite database to store task information (defined in [`src/backend/db/schema.ts`](../../src/backend/db/schema.ts:1)).
- AC2: All new tasks (imports, downloads) must be saved as a record in this table via [`src/backend/services/backgroundTaskService.ts`](../../src/backend/services/backgroundTaskService.ts:1).
- AC3: (Schema, Service Logic partiellement) The service must support parent/child task relationships (for playlist downloads) to handle partial failures gracefully. Schema supports `parentId`. Service logic for aggregation might need enhancement.
- AC4: On application startup, the service must read this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed. Current task processing (e.g., in `playlistImportService`) uses in-memory queues.

## Tasks / Subtasks

**Backend (`Main Process`)**

- [ ] **Task 1 (AC: 1):** Define the `background_tasks` table using Drizzle ORM in [`src/backend/db/schema.ts`](../../src/backend/db/schema.ts:1). The schema aligns with `ARCH_YT_Import_ActivityCenter.md` and the main [`docs/ArchitectureDocument.md`](../ArchitectureDocument.md:1).
- [ ] **Task 2 & 3 (AC: 2, 3):** Implement [`src/backend/services/backgroundTaskService.ts`](../../src/backend/services/backgroundTaskService.ts:1). This service directly uses Drizzle ORM for CRUD operations (Create, Read, Update) on the `background_tasks` table. It includes methods like `createBackgroundTask`, `updateBackgroundTaskStatus`, `updateBackgroundTaskProgress`, and `getAllBackgroundTasks`. (Supersedes separate TaskRepository and TaskManagementService).
- [ ] **Task 4 (AC: 3):** The `background_tasks` schema in [`src/backend/db/schema.ts`](../../src/backend/db/schema.ts:1) includes `parentId` and relations to support parent/child task relationships. Service-level logic for managing these (e.g., progress aggregation) is partially present or may need specific implementation per feature.
- [ ] **Task 5 (AC: 4):** Implement logic that runs on application startup. This logic should query the `background_tasks` table for any tasks that were in a non-terminal state (e.g., `QUEUED`, `FETCHING_METADATA`, `PROCESSING_VIDEOS`, `PERSISTING_DATA`) and re-initiate their processing. This currently does not happen for tasks managed by `playlistImportService.ts`'s in-memory queue.
- [ ] **Task 6 (AC: 2):** Implement the IPC mechanism that pushes task updates to the frontend on the `task:update` channel whenever a task's status changes. This is handled by `backgroundTaskService.ts` using `appEmitter` and `mainWindow.webContents.send`.

## Dev Technical Guidance

- **Database Schema:** The schema for the `background_tasks` table is defined in [`src/backend/db/schema.ts`](../../src/backend/db/schema.ts:1) using Drizzle ORM and aligns with [`ARCH_YT_Import_ActivityCenter.md`](../../.ruru/planning/ARCH_YT_Import_ActivityCenter.md:1). It includes fields like `id`, `type`, `status`, `progress`, `targetId`, `parentId`, `details`, `createdAt`, `updatedAt`, and `completedAt`.
- **Persistence is Key:** The primary goal of this story is to ensure tasks are durable. If the user closes the app mid-download, the task should be picked back up or marked as failed upon restart. **Task 5 (resuming tasks on startup) is critical for this and remains an outstanding item for robust persistence of in-flight tasks.**
- **Service Implementation:** The [`src/backend/services/backgroundTaskService.ts`](../../src/backend/services/backgroundTaskService.ts:1) handles the direct database interactions for `background_tasks`. Services like `playlistImportService.ts` utilize `backgroundTaskService.ts` for status and progress updates.
- **Parent/Child Logic:** The schema supports linking tasks. Services consuming this (like a potential future download manager for playlist items) would need to implement specific logic for creating these relationships and managing their states (e.g., aggregating child progress to the parent).

# Story 4.2: Integrate Core Services with Task Manager

## Status: Partially Implemented (Core Parent/Child Infrastructure Ready)

## Story

**As a developer,** I need the import and download services to report their status to the new Task Management service (now `BackgroundTaskService`) to handle partial failures gracefully, especially for operations involving multiple items like playlist downloads.

## Acceptance Criteria (ACs)

- AC1: Playlist imports and downloads (specifically those involving multiple sub-items like downloading all videos in a playlist) must create a "parent" task. The parent task's progress should reflect the completion of its "child" video tasks. The new [`src/backend/services/downloadService.ts`](../../src/backend/services/downloadService.ts:1) demonstrates this pattern. [`src/backend/services/playlistImportService.ts`](../../src/backend/services/playlistImportService.ts:1) currently treats metadata import as a single task.
- AC2: If some videos in a playlist download fail, the parent task should be marked as "Completed with errors." This is handled by `backgroundTaskService.handleChildTaskCompletion`.
- AC3: The download service (and any service creating tasks) must update the task's progress and final status in the database via `BackgroundTaskService`.

## Tasks / Subtasks

**Backend (`Main Process`)**

- [ ] **Task 1 (AC: 1):** Refactor/Implement services that manage multi-item operations (e.g., the new [`src/backend/services/downloadService.ts`](../../src/backend/services/downloadService.ts:1) for playlist downloads).
  - [ ] Subtask 1.1: Before adding jobs to the `p-queue` for individual items, the service must first call `backgroundTaskService.createBackgroundTask` to create a parent task for the overall operation and child tasks for each sub-item, linking them with `parentId`.
- [ ] **Task 2 (AC: 3):** Modify/Implement the core logic for processing individual items (e.g., a single video download in `downloadService.ts`, functions executed by `p-queue`).
  - [ ] Subtask 2.1: This logic must accept its specific child `taskId` as a parameter.
  - [ ] Subtask 2.2: Throughout its execution, it must call `backgroundTaskService.updateBackgroundTaskStatus/Progress` to report updates for its own child task. Upon its own completion/failure, it must call `backgroundTaskService.handleChildTaskCompletion(childTaskId)`.
- [ ] **Task 3 (AC: 2):** Implement logic within `backgroundTaskService.ts` (the `handleChildTaskCompletion` method) to handle the completion of a child task. When a child task finishes, this method checks sibling tasks to update the parent task's progress and determine if the parent task's overall status needs to be updated (e.g., to `COMPLETED_WITH_ERRORS` or `COMPLETED`).

## Dev Technical Guidance

- **Refactoring Focus:** This story involves setting up the infrastructure for robust parent/child task management. The new `downloadService.ts` exemplifies this. Existing services like `playlistImportService.ts` (which handles metadata import as a single task) are now correctly using their `taskId` for self-reporting but would need further refactoring if their specific operations were to be broken into parent/child tasks.
- **Data Flow (for parent/child operations):**
  1.  IPC handler (or internal service call) initiates a multi-item operation.
  2.  The responsible service (e.g., `downloadService.ts`) calls `backgroundTaskService.createBackgroundTask` to create a parent task record.
  3.  The service then iterates through items, creating a child `BackgroundTask` for each (with `parentId` set) and enqueues a job for each child, passing the child's `taskId`.
  4.  The child job function executes, calling `backgroundTaskService.updateBackgroundTaskStatus/Progress` for its own `taskId`.
  5.  When a child job finishes, it calls `backgroundTaskService.handleChildTaskCompletion(childTaskId)`.
  6.  `handleChildTaskCompletion` updates the parent task's progress and, if all children are done, its final status.
- **Parent Task Aggregation:** The `backgroundTaskService.handleChildTaskCompletion` method now handles aggregation of child statuses to determine the parent's final status (`COMPLETED` vs. `COMPLETED_WITH_ERRORS`) and progress.

# Story 4.3: Activity Center UI

## Status: Done

## Story

**As a user,** I want to see a persistent widget in the corner of the screen that shows me my active tasks, which I can cancel or clear at any time.

## Acceptance Criteria (ACs)

- AC1: A persistent widget must be displayed in the bottom-right corner of the application.
- AC2: The widget header must show an active task count (e.g., "Active (2)") and a minimize icon.
- AC3: The widget must display a list of all `In Queue` and `In Progress` tasks.
- AC4: Each task item must display its type (e.g., Import, Download), thumbnail, title, a progress bar, and a status tag.
- AC5: Each active task in the widget must have a "Cancel" button that stops the corresponding backend task.
- AC6: To keep the UI performant, progress updates from the backend must be throttled (updated no more than a few times per second).
- AC7: When a task is completed (successfully or failed), it should remain visible with a final status, a timestamp, and then automatically fade out after a short delay.
- AC8: A "Clear All" (trash can icon) button must be present to manually remove all completed tasks from the view.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Create the `ActivityCenter.tsx` widget component and add it to the main application layout (`AppLayout.tsx`) so it's persistent.
- [ ] **Task 2 (AC: 1):** Style the widget as a persistent overlay in the bottom-right of the viewport.
- [ ] **Task 3 (AC: 3):** Implement the real-time listener for the `task:update` IPC channel to receive the list of tasks.
- [ ] **Task 4 (AC: 4):** Create a `TaskItem.tsx` component to render a single task's details, including a `Progress` bar and status tag from `shadcn/ui`.
- [ ] **Task 5 (AC: 5):** The `TaskItem.tsx` component should include a "Cancel" button that calls the `task:cancel` IPC handler, passing the task's ID.
- [ ] **Task 6 (AC: 2, 8):** Implement the header with the active task count and the "Clear All" and "Minimize" buttons.
- [ ] **Task 7 (AC: 7):** Implement the client-side logic for the "fade out on completion" behavior using CSS transitions and a `setTimeout`.
- [ ] **Task 8 (AC: 6):** Ensure that the UI updates from the incoming IPC events are throttled to prevent performance issues.

## Dev Technical Guidance

- **Real-Time Data:** The Activity Center is a live view of the backend's task queue. It **must** get its data by listening to the `task:update` push channel from the backend.
- **UI Components:** Use `Card`, `Progress`, `Button`, and icons from `lucide-react` to build the widget, maintaining the application's visual style.
- **Client-Side Logic:** The "Clear All" and "fade out" behaviors are view-only. "Clear All" should filter out completed/failed tasks from the local state, it does not delete them from the backend history.
- **Cancel Action:** The "Cancel" button performs a backend action. It must call the `task:cancel` IPC handler, which will instruct the backend to stop and update the task.
- **Throttling:** If the backend sends many updates in quick succession (e.g., for a fast download), the UI could lag. The state updates in the React component should be throttled (e.g., using `lodash.throttle`) to ensure a smooth user experience.

# Story 5.1: Backend Health Check Service

## Status: Draft

## Story

**As a developer,** I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

## Acceptance Criteria (ACs)

- AC1: The service must iterate through the videos of a given playlist.
- AC2: For each video, it must use a lightweight `yt-dlp` command to verify its current status on YouTube.
- AC3: It must update the `availability_status` (e.g., 'Live', 'Deleted', 'Private') for the video in the local database.
- AC4: The service must process videos in a **low-concurrency queue** (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.

## Tasks / Subtasks

**Backend (`Main Process`)**

- [ ] **Task 1 (AC: 1):** Create a new `HealthCheckService.ts` file within the `src/backend/services/` directory.
- [ ] **Task 2 (AC: 4):** Within the new service, instantiate and configure a `p-queue` with a low concurrency limit (e.g., `concurrency: 2`).
- [ ] **Task 3 (AC: 1):** Implement the main service function that accepts a `playlistId`. This function will fetch all associated videos from the database using the `VideoRepository`.
- [ ] **Task 4 (AC: 2):** For each video, add a job to the `p-queue`. This job will call the `yt-dlp-wrap` library to get the video's current availability status.
- [ ] **Task 5 (AC: 3):** After the `yt-dlp` check is complete, the job must use the `VideoRepository` to update the `availability_status` field for that video in the `videos` table.
- [ ] **Task 6 (AC: 3):** Once all jobs for a given playlist have been processed, the service should update the `last_health_check` timestamp on the parent playlist record in the `playlists` table.

## Dev Technical Guidance

- **Rate Limiting is Critical:** The most important constraint is to avoid making too many requests to YouTube in a short period. The use of `p-queue` with a very low concurrency setting is mandatory to prevent potential IP blocks.
- **Lightweight Command:** The `yt-dlp` command used should be as lightweight as possible to only fetch the video's status, not the entire video metadata (e.g., using flags like `--get-status` or `--simulate`).
- **Database Interaction:** All database updates **must** go through the `VideoRepository` and `PlaylistRepository` as defined by the Repository Pattern in the architecture.
- **Data Model:** The `availability_status` field in the `videos` table should be updated with values like `'LIVE'`, `'DELETED'`, `'PRIVATE'`, `'UNLISTED'`, or `'UNCHECKED'`, as defined in the `Video` data model.

# Story 5.2: Display Video Health Status in UI

## Status: Draft

## Story

**As a user,** I want to see a colored dot next to each video in an imported playlist so I know if it's still available on YouTube and when that status was last checked.

## Acceptance Criteria (ACs)

- AC1: In the video list item component, a colored dot must be displayed based on the video's `availability_status` from the database.
- AC2: The colors will be: Green for 'Live', Yellow for 'Unlisted/Private', and Red for 'Deleted'.
- AC3: A tooltip on the dot must explain the status on hover (e.g., "Status: Live").
- AC4: The playlist view header must display a "Status last checked: [timestamp]" (e.g., "3 hours ago") message.

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1, 2):** In the `VideoListItem.tsx` component, add a new UI element (e.g., a small `div`) to serve as the colored status dot.
- [ ] **Task 2 (AC: 2):** Implement the logic to apply the correct color to the dot based on the `availability_status` property of the video data.
- [ ] **Task 3 (AC: 3):** Wrap the status dot element in a `Tooltip` component from `shadcn/ui`. The tooltip's content should display the status text (e.g., "Status: Live").
- [ ] **Task 4 (AC: 4):** In the `PlaylistDetailsView.tsx` component, display the `last_health_check` timestamp from the playlist data in the header.
- [ ] **Task 5 (AC: 4):** Format the timestamp into a user-friendly, relative string (e.g., "3 hours ago", "2 days ago"). A library like `date-fns` is recommended for this.

## Dev Technical Guidance

- **Component Modification:** The primary changes will be in the `VideoListItem.tsx` component, which was created in Story 1.4.
- **Data Source:** The `availability_status` from the `Video` data model and the `last_health_check` from the `Playlist` data model are the data sources for this UI. This data is already being fetched as part of Story 1.4.
- **UI Components:** Use the `Tooltip` component from `shadcn/ui` for the hover-over text.
- **Timestamp Formatting:** The `last_health_check` will likely be an ISO 8601 timestamp string from the database. This needs to be parsed and formatted for display. Libraries like `date-fns` (specifically the `formatDistanceToNow` function) are ideal for creating relative time strings.

# Story 5.3: Implement Auto-Sync Settings UI

## Status: Draft

## Story

**As a user,** I want to configure how often my playlists are automatically checked for status updates.

## Acceptance Criteria (ACs)

- AC1: A dedicated "Auto-Sync Settings" section must be created on the Settings page.
- AC2: The UI must provide controls (e.g., radio buttons) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
- AC3: "Daily" will be the default setting.
- AC4: A note explaining the resource usage trade-off must be present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** Create a `Settings.tsx` page component if one does not already exist, and ensure it is linked in the main router and `Sidebar.tsx`.
- [ ] **Task 2 (AC: 1, 2):** Build the "Auto-Sync Settings" UI section within the `Settings.tsx` page. Use a `RadioGroup` from `shadcn/ui` for the frequency options.
- [ ] **Task 3 (AC: 2, 3):** On component mount, call a new `settings:get-auto-sync` IPC handler to fetch and display the currently saved setting. If no setting is saved, default the UI to "Daily".
- [ ] **Task 4 (AC: 2):** When the user changes the selection, call a new `settings:set-auto-sync` IPC handler to save the new value.
- [ ] **Task 5 (AC: 4):** Add the explanatory note about resource usage to the UI.

**Backend (`Main Process`)**

- [ ] **Task 6 (AC: 2, 3):** Using the `electron-store` library, create two new IPC handlers:
  - [ ] Subtask 6.1: `settings:get-auto-sync`: Retrieves the auto-sync frequency from storage. If not set, it should return 'Daily'.
  - [ ] Subtask 6.2: `settings:set-auto-sync`: Saves the provided auto-sync frequency to storage.

## Dev Technical Guidance

- **Settings Persistence:** As defined in the architecture, all user settings must be persisted on the backend using the `electron-store` library. The frontend should not manage this state itself.
- **IPC API:** This story requires two new IPC handlers for getting and setting this specific configuration value. They will act as simple wrappers around the `electron-store` get/set methods.
- **UI Components:** Use the `RadioGroup` and `Label` components from `shadcn/ui` to build the settings interface.
- **Default Value:** The logic for defaulting to "Daily" should primarily live on the backend. When the frontend asks for the setting, if one isn't found, the backend should return the default value.

# Story 5.4: Scheduled Background Sync

## Status: Draft

## Story

**As a developer,** I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

## Acceptance Criteria (ACs)

- AC1: The scheduler must read the user's sync frequency from settings to determine its interval.
- AC2: The scheduler must **pause** if a user-initiated task (like a new import or download) is active, to prioritize the user's actions. It will resume after the user's tasks are complete.

## Tasks / Subtasks

**Backend (`Main Process`)**

- [ ] **Task 1 (AC: 1):** In the backend, create a scheduler service or manager. This can be initialized on application startup using a `setInterval` loop that runs at a fixed interval (e.g., every 10 minutes).
- [ ] **Task 2 (AC: 1):** Inside the scheduler's callback, it must first read the user's chosen sync frequency from `electron-store`.
- [ ] **Task 3 (AC: 1):** The scheduler must then check if it's time to run based on the user's setting (e.g., if the setting is "Daily", it checks if the last run was > 24 hours ago).
- [ ] **Task 4 (AC: 2):** Before running, the scheduler must check the status of the main task queue (managed by the `TaskManagementService`). If there are active user-initiated tasks (imports/downloads), the scheduler should do nothing and wait for the next interval.
- [ ] **Task 5 (AC: 1):** If it is time to run and the main queue is free, the scheduler should trigger the `HealthCheckService` to begin checking all relevant playlists.

## Dev Technical Guidance

- **Scheduler Implementation:** A simple `setInterval` initialized in the `main.ts` entry point is a sufficient and robust way to implement a scheduler in an Electron application.
- **Resource Management:** The requirement to pause the health check while other tasks are running is critical for ensuring a good user experience. The application should prioritize user-initiated actions like downloads over background maintenance tasks. The scheduler must communicate with the `TaskManagementService` to check its state.
- **Frequency Logic:** The scheduler's fixed interval (e.g., every 10 minutes) is just for checking if it _should_ run. The actual logic for whether to proceed will depend on the user's setting (e.g., 'Hourly', 'Daily') and the timestamp of the last successful health check run.
- **Service Orchestration:** The scheduler's only job is to decide _when_ to run. The actual work of checking the playlists is entirely handled by the `HealthCheckService` created in Story 5.1.

# Story 5.5: Manual Playlist Refresh

## Status: Draft

## Story

**As a user,** I want a button to manually trigger a health check on a specific playlist so I can get its up-to-the-minute status on demand.

## Acceptance Criteria (ACs)

- AC1: The context menu for any imported YouTube playlist must have a "Refresh Status Now" button.
- AC2: Clicking the button must trigger the `HealthCheckService` for that single playlist.
- AC3: The UI should provide immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon next to the "Last checked" timestamp).

## Tasks / Subtasks

**Frontend (`Renderer Process`)**

- [ ] **Task 1 (AC: 1):** In the `Sidebar.tsx` component's playlist `ContextMenu`, add a "Refresh Status Now" item. This option must only be visible for playlists where `type` is `YOUTUBE`.
- [ ] **Task 2 (AC: 2):** When the "Refresh Status Now" button is clicked, call the new `healthcheck:start-manual` IPC handler, passing the `playlistId`.
- [ ] **Task 3 (AC: 3):** Implement a client-side state (e.g., using `Zustand` or local state) to track the IDs of playlists currently being refreshed.
- [ ] **Task 4 (AC: 3):** In the `PlaylistDetailsView.tsx` header, display a spinning icon next to the "Last checked" timestamp if the current playlist's ID is in the list of refreshing playlists.

**Backend (`Main Process`)**

- [ ] **Task 5 (AC: 2):** Create the `healthcheck:start-manual` IPC handler, as defined in the `ArchitectureDocument.md`.
- [ ] **Task 6 (AC: 2):** The handler will accept a `playlistId` and will invoke the `HealthCheckService` (from Story 5.1) for that specific playlist.

## Dev Technical Guidance

- **Conditional UI:** The "Refresh Status Now" option should only appear on playlists imported from YouTube, not on custom-created playlists. This requires checking the playlist `type` in the `Sidebar` component.
- **UI Feedback:** To show that a refresh is in progress, the frontend needs to manage a temporary state of "refreshing" playlists. When the refresh is complete, the `task:update` IPC event (which pushes all task statuses) or an updated playlist list will signal the UI to remove the spinning icon.
- **IPC API:** This story introduces a `healthcheck:start-manual` IPC handler. Its purpose is to provide a direct trigger for the `HealthCheckService`.
- **Service Orchestration:** The backend handler is very straightforward; it acts as a simple bridge between the UI action and the already-existing `HealthCheckService`.

# Playlistify Development Workflow Checklist

This document provides a comprehensive checklist for developing the Playlistify application, an Electron-based YouTube playlist manager and downloader that uses yt-dlp. Follow each phase and check off items as you complete them.

## Getting Started

### Create Project
Copy and paste these commands or follow the checklist to create a new Electron project with TypeScript and Webpack:

- [x] Initialize a new Electron Forge project with TypeScript + Webpack template:
```bash
npx create-electron-app@latest . --template=webpack --force
npm install --save-dev typescript @types/react @types/react-dom ts-loader
```

- [x] Create necessary directories for our application structure:
```bash
# Create renderer directories
mkdir -p src/renderer/components
mkdir -p src/renderer/features
mkdir -p src/renderer/pages
mkdir -p src/renderer/stores
mkdir -p src/renderer/utils
mkdir -p src/renderer/styles

# Create main process directories
mkdir -p src/main/services
mkdir -p src/main/utils
mkdir -p src/main/ipc

# Create shared directories
mkdir -p src/shared/types
mkdir -p src/shared/constants

# Create asset directories
mkdir -p assets/icons
mkdir -p assets/images
mkdir -p public

# Create test directories
mkdir -p tests/main/services
mkdir -p tests/renderer/features
mkdir -p tests/renderer/stores

# Create documentation directory
mkdir -p docs
```

### Completed Setup Tasks
- [x] Project initialization with Electron Forge
- [x] TypeScript configuration
- [x] Webpack configuration for main and renderer processes
- [x] PostCSS and Tailwind CSS setup
- [x] Basic project structure creation
- [x] TypeScript declarations for webpack entries
- [x] License update to AGPL-3.0
- [x] Settings management with electron-store
- [x] File system utilities implementation with fs-extra
- [x] IPC communication channels setup
- [x] Type-safe API for renderer process
- [x] Secure preload script configuration

### Current Progress
1. **Project Structure**
   - [x] Basic directory structure
   - [x] Configuration files setup
   - [x] Build system configuration

2. **Development Environment**
   - [x] TypeScript configuration
   - [x] Webpack setup
   - [x] PostCSS and Tailwind CSS integration
   - [x] Development server configuration

3. **Core Setup**
   - [x] Main process entry point
   - [x] Renderer process setup
   - [x] Preload script configuration
   - [x] IPC communication foundation
   - [x] Settings management with electron-store
   - [x] File system utilities with fs-extra
   - [x] Secure IPC communication channels

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

### Install Required Packages

Copy and paste these commands to install all required packages:

```bash
# Core dependencies
npm install electron @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip @electron-forge/maker-deb @electron-forge/maker-rpm typescript @types/node electron-store fs-extra @types/fs-extra electron-updater electron-squirrel-startup

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
- [x] electron
- [x] @electron-forge/cli
- [x] @electron-forge/maker-squirrel
- [x] @electron-forge/maker-zip
- [x] @electron-forge/maker-deb
- [x] @electron-forge/maker-rpm
- [x] typescript
- [x] @types/node
- [x] electron-store
- [x] fs-extra
- [x] @types/fs-extra
- [x] electron-updater
- [x] electron-squirrel-startup

### UI
- [x] react
- [x] react-dom
- [x] @types/react
- [x] @types/react-dom
- [x] tailwindcss
- [x] postcss
- [x] autoprefixer
- [x] @shadcn/ui
- [x] @tanstack/react-router
- [x] @tanstack/react-query

### Media & Downloads
- [x] yt-dlp-wrap
- [x] fluent-ffmpeg
- [x] p-queue
- [x] react-player
- [x] winston

### Integration
- [x] better-auth
- [x] googleapis
- [x] axios
- [x] zustand

### Testing & Development
- [x] jest
- [x] @types/jest
- [x] ts-jest
- [x] @testing-library/react
- [x] @electron-forge/plugin-auto-unpack-natives
- [x] @electron-forge/plugin-fuses
- [x] @electron-forge/plugin-webpack
- [x] @electron/fuses
- [x] @vercel/webpack-asset-relocator-loader
- [x] cross-env
- [x] css-loader
- [x] electron-rebuild
- [x] eslint
- [x] node-loader
- [x] prettier
- [x] prettier-plugin-sort-imports
- [x] prettier-plugin-tailwindcss
- [x] purgecss
- [x] style-loader
- [x] @types/lodash

## Phase 1: Project Setup & Core Infrastructure

### Phase 1.1: Initialize Electron Project
**Tasks:**
- [x] Create base Electron project with TypeScript
- [x] Set up basic window configuration

**Files Created:**
- [x] `package.json` (~50 lines)
  - Project configuration, dependencies, scripts
- [x] `tsconfig.json` (~30 lines)
  - TypeScript configuration with strict type checking
- [x] `src/main/main.ts` (~100 lines)
  - Main Electron process entry point
  - Window creation and management
- [x] `electron-forge.config.js` (~50 lines)
  - Electron Forge build configuration

**Sample Code for `src/main/main.ts`:**
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

### Phase 1.2: Set Up React and UI Libraries

**Tasks:**
- [x] Integrate React for the renderer process
- [x] Set up TailwindCSS and Shadcn UI for styling
- [x] Configure TanStack Router for navigation
- [x] Implement dark/light theme support

**Files Created:**
- [x] `src/renderer/index.tsx` (~50 lines)
  - Renderer entry point
  - Root React rendering
- [x] `src/renderer/App.tsx` (~15 lines)
  - Main React component
  - Router integration
  - Dark/light theme support
- [x] `postcss.config.js` (~10 lines)
  - PostCSS configuration for Tailwind
- [x] `tailwind.config.js` (~25 lines)
  - Tailwind CSS configuration
  - Custom YouTube-inspired color scheme
- [x] `src/renderer/styles/global.css` (~85 lines)
  - Global styles and Tailwind directives
  - Custom component classes
  - Dark/light mode variables
  - Custom scrollbar styles
- [x] `src/renderer/routes/routes.ts` (~45 lines)
  - TanStack Router configuration
  - Route definitions for Dashboard, Settings, and Playlist pages
- [x] `src/renderer/pages/Dashboard/DashboardPage.tsx` (~25 lines)
  - Dashboard page component with responsive layout
- [x] `src/renderer/pages/Settings/SettingsPage.tsx` (~30 lines) 
  - Settings page component
- [x] `src/renderer/pages/PlaylistView/PlaylistViewPage.tsx` (~30 lines)
  - Individual playlist viewing page

**Notes:**
- Implemented TanStack Router for navigation between Dashboard, Settings, and Playlist views
- Created responsive layouts with Tailwind's utility classes
- Set up YouTube-inspired theme with CSS variables for color tokens
- Added support for both light and dark modes
- Added reusable component classes in global.css (.btn, .input, .select)
- Set up custom scrollbar styling consistent with the application theme

### Phase 1.3: Configure Routing and Data Fetching

**Tasks:**
- [x] Set up routing with TanStack Router
- [x] Configure React Query for data management

**Files Created/Updated:**
- [x] `src/renderer/App.tsx` 
  - Added QueryClientProvider with configuration
  - Set up stale time and refetch options
  - Implemented theme detection and management
- [x] `src/shared/types/appTypes.ts` (~85 lines)
  - Created comprehensive TypeScript interfaces for playlists, videos, settings, etc.
  - Defined type-safe structures for core application entities
  - Added error handling types
- [x] `src/renderer/routes/routes.ts` (~70 lines)
  - Implemented TanStack Router with route definitions
  - Set up route structure with dashboard, settings, and playlist views
  - Added catch-all route for redirects
  - Provided type safety through declarations
- [x] `src/renderer/services/queryHooks.ts` (~140 lines)
  - Created React Query hooks for data operations
  - Implemented query caching and invalidation strategies
  - Added store synchronization with query results
  - Set up mutation hooks for create, update, and delete operations
- [x] `src/renderer/services/playlistService.ts` (~135 lines)
  - Implemented playlist data service with mock data
  - Created CRUD operations for playlists
  - Added YouTube playlist import functionality
- [x] `src/renderer/pages/Dashboard/DashboardPage.tsx` (~85 lines)
  - Implemented dashboard UI with responsive layout
  - Connected to playlist store for data display
  - Added error handling for data loading
- [x] `src/renderer/features/playlists/components/PlaylistList.tsx` (~75 lines)
  - Implemented React Query for fetching playlists
  - Added loading, error, and empty states
  - Created responsive grid layout for playlist display
- [x] `src/renderer/stores/playlistStore.ts` (~100 lines)
  - Implemented Zustand store for client-side state management
  - Added actions for managing playlist and video data
  - Created loading and error state management

**Notes:**
- Set up React Query with sensible defaults (5 minute stale time, no refetch on window focus)
- Created TypeScript interfaces to ensure type safety across the application
- Implemented Zustand store for client-side state management that syncs with React Query
- Added proper loading, error, and empty states for data fetching
- Created mock data service for development before backend implementation
- Implemented mutation hooks for data modification operations

### Phase 1.4: Persistent Storage and File System

**Tasks:**
- [x] Implement settings management with electron-store
- [x] Create file system utilities with fs-extra

**Files Created:**
- [x] `src/main/services/settingsManager.ts` (~150 lines)
  - Settings storage and retrieval with TypeScript type safety
  - Default configuration management
  - Directory initialization
  - Account management functions
- [x] `src/main/utils/fileUtils.ts` (~230 lines)
  - File system operations for playlists and videos
  - Directory and file management utilities
  - Playlist metadata handling
  - File validation functions
- [x] `src/main/ipc/handlers.ts` (~150 lines)
  - IPC communication between main and renderer processes
  - Settings IPC handlers
  - File system operation handlers
  - Path validation handlers
- [x] `src/shared/types/appTypes.ts` (~130 lines)
  - Type definitions for settings, playlists, and videos
  - API interface for the renderer process
  - IPC communication types

**Sample Code for `src/main/services/settingsManager.ts`:**
```typescript
import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';

// Define the settings schema type
interface SettingsSchema {
  // General settings
  theme: 'light' | 'dark' | 'system';
  checkForUpdates: boolean;
  startAtLogin: boolean;
  minimizeToTray: boolean;
  
  // Download settings
  downloadLocation: string;
  concurrentDownloads: number;
  downloadFormat: 'mp4' | 'webm' | 'mp3' | 'best';
  maxQuality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
  autoConvertToMp3: boolean;
  
  // Playlist settings
  playlistLocation: string;
  // ...other settings
}

const store = new Store<SettingsSchema>({
  defaults: defaultSettings,
  name: 'settings',
});

export function getSetting<K extends keyof SettingsSchema>(
  key: K,
  defaultValue?: SettingsSchema[K]
): SettingsSchema[K] {
  if (defaultValue !== undefined) {
    return store.get(key as any, defaultValue);
  }
  return store.get(key as any, defaultSettings[key]);
}

export function setSetting<K extends keyof SettingsSchema>(
  key: K,
  value: SettingsSchema[K]
): void {
  // If we're setting a path, ensure the directory exists
  if ((key === 'downloadLocation' || key === 'playlistLocation') && typeof value === 'string') {
    fs.ensureDirSync(value);
  }
  
  store.set(key, value);
}
```

**Sample Code for `src/main/utils/fileUtils.ts`:**
```typescript
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getSetting } from '../services/settingsManager';

/**
 * Creates the playlist directory structure
 */
export async function createPlaylistDir(playlistId: string, playlistName: string): Promise<string> {
  const baseDir = getSetting('playlistLocation');
  // Use a sanitized version of the playlist name for the folder
  const sanitizedName = sanitizeFileName(playlistName);
  // Create a directory with format: playlistId-sanitizedName
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  
  try {
    await ensureDir(playlistDir);
    // Create subdirectories for metadata and videos
    await ensureDir(path.join(playlistDir, 'metadata'));
    await ensureDir(path.join(playlistDir, 'videos'));
    return playlistDir;
  } catch (error) {
    console.error(`Failed to create playlist directory for ${playlistName}:`, error);
    throw error;
  }
}

/**
 * Writes playlist metadata to JSON file
 */
export async function writePlaylistMetadata(
  playlistId: string,
  playlistName: string,
  metadata: any
): Promise<void> {
  const baseDir = getSetting('playlistLocation');
  const sanitizedName = sanitizeFileName(playlistName);
  const playlistDir = path.join(baseDir, `${playlistId}-${sanitizedName}`);
  const metadataDir = path.join(playlistDir, 'metadata');
  const metadataPath = path.join(metadataDir, 'playlist-info.json');
  
  try {
    await ensureDir(metadataDir);
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  } catch (error) {
    console.error(`Failed to write metadata for playlist ${playlistName}:`, error);
    throw error;
  }
}
```

**Sample Code for `src/main/preload.ts` API exposure:**
```typescript
// File system API shortcuts
fs: {
  selectDirectory: () => {
    return ipcRenderer.invoke('fs:selectDirectory');
  },
  createPlaylistDir: (playlistId: string, playlistName: string) => {
    return ipcRenderer.invoke('fs:createPlaylistDir', playlistId, playlistName);
  },
  writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => {
    return ipcRenderer.invoke('fs:writePlaylistMetadata', playlistId, playlistName, metadata);
  },
  readPlaylistMetadata: (playlistId: string, playlistName: string) => {
    return ipcRenderer.invoke('fs:readPlaylistMetadata', playlistId, playlistName);
  },
  getAllPlaylists: () => {
    return ipcRenderer.invoke('fs:getAllPlaylists');
  }
  // ...other file system functions
}
```

## Phase 2: Playlist Management & Local Storage

### Phase 2.1: Playlist Creation UI

**Tasks:**
- [ ] Build UI components for playlist management
- [ ] Create playlist creation form

**Files to Create:**
- [ ] `src/renderer/features/playlists/components/PlaylistList.tsx` (~200 lines)
  - Playlist listing and management component
- [ ] `src/renderer/features/playlists/components/CreatePlaylistForm.tsx` (~150 lines)
  - Form for creating new playlists

**Sample Code for `src/renderer/features/playlists/components/PlaylistList.tsx`:**
```typescript
import React, { useState } from 'react';
import { useStore } from '../../../../stores/playlistStore';

const PlaylistList: React.FC = () => {
  const [name, setName] = useState('');
  const addPlaylist = useStore((state) => state.addPlaylist);
  const playlists = useStore((state) => state.playlists);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      addPlaylist(name, []);
      setName('');
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Playlist Name"
          className="border p-2 mr-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Playlist
        </button>
      </form>
      <ul className="space-y-2">
        {playlists.map((pl) => (
          <li key={pl.name} className="p-2 bg-white rounded shadow">
            {pl.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlaylistList;
```

### Phase 2.2: Import Playlists with yt-dlp

**Tasks:**
- [ ] Implement yt-dlp integration for fetching playlist metadata
- [ ] Create wrapper functions for yt-dlp commands

**Files to Create:**
- [ ] `src/main/services/ytDlpManager.ts` (~200 lines)
  - Wrapper for yt-dlp commands
  - Playlist metadata extraction functions
- [ ] `src/main/services/playlistManager.ts` (~200 lines)
  - Playlist creation and management logic

**Sample Code for `src/main/services/ytDlpManager.ts`:**
```typescript
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

**Files to Create:**
- [ ] `src/renderer/stores/playlistStore.ts` (~150 lines)
  - Zustand store for playlists
  - Actions for managing playlist state
- [ ] `src/shared/constants/appConstants.ts` (~50 lines)
  - Application constants and defaults

**Sample Code for `src/renderer/stores/playlistStore.ts`:**
```typescript
import { create } from 'zustand';
import { writeMetadata } from '../../main/utils/fileUtils';

interface Playlist {
  name: string;
  videos: { id: string; title: string; url: string }[];
}

interface PlaylistState {
  playlists: Playlist[];
  addPlaylist: (name: string, videos: any[]) => void;
}

export const useStore = create<PlaylistState>((set) => ({
  playlists: [],
  addPlaylist: (name, videos) => {
    const newPlaylist = { name, videos };
    writeMetadata(name, newPlaylist);
    set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
  },
}));
```

### Phase 2.4: Display Playlists

**Tasks:**
- [ ] Create UI components for playlist display
- [ ] Add search and filtering capabilities

**Files to Create:**
- [ ] `src/renderer/features/playlists/components/PlaylistCard.tsx` (~150 lines)
  - Individual playlist display component
- [ ] `src/renderer/features/playlists/components/PlaylistFilters.tsx` (~150 lines)
  - Search and filtering UI components

**Sample Code for `src/renderer/pages/Dashboard/DashboardPage.tsx`:**
```typescript
import React from 'react';
import PlaylistList from '../../features/playlists/components/PlaylistList';

const DashboardPage: React.FC = () => (
  <div className="container mx-auto">
    <h1 className="text-3xl font-bold mb-4">YouTube Playlist Manager</h1>
    <PlaylistList />
  </div>
);

export default DashboardPage;
```

## Phase 3: Video Downloading & Playback

### Phase 3.1: Download Logic

**Tasks:**
- [ ] Implement video download functionality with yt-dlp
- [ ] Create download queue management with p-queue

**Files to Create:**
- [ ] `src/main/services/downloadManager.ts` (~250 lines)
  - Download queue management
  - yt-dlp download execution
- [ ] `src/main/services/logger.ts` (~100 lines)
  - Logging service for downloads and errors

**Sample Code for `src/main/services/downloadManager.ts`:**
```typescript
import PQueue from 'p-queue';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { getSetting } from './settingsManager';
const execAsync = promisify(exec);

const queue = new PQueue({ concurrency: 3 });

export async function downloadVideo(url: string, playlistName: string): Promise<void> {
  const outputDir = path.join(getSetting('downloadLocation', '~/Downloads/Videos'), playlistName);
  await fs.ensureDir(outputDir);
  const outputPath = path.join(outputDir, `${url.split('v=')[1]}.mp4`);
  const command = `yt-dlp -f "bestvideo[height<=1080]+bestaudio" -o "${outputPath}" "${url}"`;
  await execAsync(command);
}

export async function downloadVideos(urls: string[], playlistName: string): Promise<void> {
  const tasks = urls.map((url) => () => downloadVideo(url, playlistName));
  await queue.addAll(tasks);
}
```

### Phase 3.2: Format Conversion

**Tasks:**
- [ ] Add format conversion capabilities with fluent-ffmpeg
- [ ] Implement quality selection options

**Files to Create:**
- [ ] `src/main/services/formatConverter.ts` (~150 lines)
  - Format conversion utilities
  - ffmpeg integration
- [ ] `src/renderer/features/downloads/components/FormatSelector.tsx` (~150 lines)
  - UI for selecting download formats and quality

**Sample Code for `src/main/services/formatConverter.ts`:**
```typescript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export async function convertToMp3(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.mp4', '.mp3');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}
```

### Phase 3.3: Playback

**Tasks:**
- [ ] Create video player component with react-player
- [ ] Implement playback controls

**Files to Create:**
- [ ] `src/renderer/features/player/components/VideoPlayer.tsx` (~200 lines)
  - Video playback component
  - Controls and options UI
- [ ] `src/renderer/pages/PlaylistView/PlaylistViewPage.tsx` (~200 lines)
  - Page for viewing a specific playlist and its videos

**Sample Code for `src/renderer/features/player/components/VideoPlayer.tsx`:**
```typescript
import React from 'react';
import ReactPlayer from 'react-player';
import { getSetting } from '../../../../main/services/settingsManager';

interface VideoPlayerProps {
  videoId: string;
  playlistName: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, playlistName }) => {
  const filePath = `${getSetting('downloadLocation', '~/Downloads/Videos')}/${playlistName}/${videoId}.mp4`;
  return (
    <div className="p-4">
      <ReactPlayer url={`file://${filePath}`} controls width="100%" height="auto" />
    </div>
  );
};

export default VideoPlayer;
```

### Phase 3.4: Download Status

**Tasks:**
- [ ] Implement download status tracking
- [ ] Create UI for displaying download progress

**Files to Create:**
- [ ] `src/renderer/features/downloads/components/DownloadStatus.tsx` (~150 lines)
  - Download progress and status display
- [ ] `src/renderer/stores/downloadStore.ts` (~100 lines)
  - Zustand store for download state management

**Sample Code for `src/renderer/features/downloads/components/DownloadStatus.tsx`:**
```typescript
import React from 'react';
import { useStore } from '../../../stores/downloadStore';

const DownloadStatus: React.FC = () => {
  const downloads = useStore((state) => state.downloads);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Downloads</h2>
      <ul className="space-y-2">
        {downloads.map((d) => (
          <li key={d.id} className="p-2 bg-gray-200 rounded">
            {d.title} - {d.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DownloadStatus;
```

**Sample Code for `src/renderer/stores/downloadStore.ts`:**
```typescript
import { create } from 'zustand';

interface Download {
  id: string;
  title: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

interface DownloadState {
  downloads: Download[];
  addDownload: (id: string, title: string) => void;
  updateStatus: (id: string, status: Download['status']) => void;
}

export const useStore = create<DownloadState>((set) => ({
  downloads: [],
  addDownload: (id, title) => set((state) => ({
    downloads: [...state.downloads, { id, title, status: 'pending' }],
  })),
  updateStatus: (id, status) => set((state) => ({
    downloads: state.downloads.map((d) => (d.id === id ? { ...d, status } : d)),
  })),
}));
```

## Phase 4: Google & YouTube Integration

### Phase 4.1: Google OAuth2 Authentication

**Tasks:**
- [ ] Implement Google OAuth2 authentication with PKCE flow
- [ ] Set up secure token storage
- [ ] Create a secure configuration system for production builds

**Files to Create:**
- [ ] `src/main/services/authManager.ts` (~200 lines)
  - OAuth2 implementation with PKCE
  - Token management and refresh
- [ ] `src/main/services/secureStorage.ts` (~150 lines)
  - Encrypted storage for user tokens

**Sample Code for secure configuration in production:**
```typescript
// src/main/services/secureConfig.ts
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

**Sample Code for `src/main/services/authManager.ts` with PKCE flow:**
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
const configPath = path.join(__dirname, '../src/main/services/secureConfig.ts');
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
- [ ] `src/main/services/youtubeApi.ts` (~150 lines)
  - YouTube API client
  - Playlist fetching functions

**Sample Code for `src/main/services/youtubeApi.ts`:**
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
- [ ] `src/main/services/privatePlaylistManager.ts` (~150 lines)
  - Functions specific to private playlist handling

**Sample Code for private playlist support (adding to `src/main/services/ytDlpManager.ts`):**
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
import { authenticate } from '../../../main/services/authManager';
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
- [ ] `src/main/services/videoStatusChecker.ts` (~150 lines)
  - Functions for checking video availability
- [ ] `src/renderer/features/videos/components/VideoStatusIndicator.tsx` (~100 lines)
  - Status indicator component

**Sample Code for video status checking (adding to `src/main/services/ytDlpManager.ts`):**
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
- [ ] `src/renderer/features/player/components/StreamSelector.tsx` (~150 lines)
  - UI for selecting between stream and local playback
- [ ] `src/renderer/utils/rendererUtils.ts` (~100 lines)
  - Utility functions for the renderer process

**Sample Code for adding streaming to VideoPlayer:**
```typescript
import React from 'react';
import ReactPlayer from 'react-player';
import fs from 'fs-extra';
import { getSetting } from '../../../../main/services/settingsManager';

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
- [ ] `src/renderer/features/playlists/components/PlaylistView.tsx` (~250 lines)
  - Detailed playlist view with video status
- [ ] `src/main/services/thumbnailUtils.ts` (~150 lines)
  - Thumbnail fetching and caching

**Sample Code for `src/renderer/features/playlists/components/PlaylistView.tsx`:**
```typescript
import React, { useEffect, useState } from 'react';
import { useStore } from '../../../stores/playlistStore';
import { checkVideoStatus } from '../../../../main/services/ytDlpManager';
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
- [ ] `src/renderer/features/tags/components/TagManager.tsx` (~150 lines)
  - Tag creation and management UI
- [ ] `src/renderer/features/tags/components/TagFilter.tsx` (~100 lines)
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
- [ ] `src/main/services/playlistUpdater.ts` (~150 lines)
  - Automatic playlist refresh logic
  - Scheduling functions

**Sample Code for `src/main/services/playlistUpdater.ts`:**
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
- [ ] Add animations and transitions
- [ ] Implement light/dark theme

**Files to Create:**
- [ ] `src/renderer/features/theme/components/ThemeToggle.tsx` (~100 lines)
  - Theme switching component
- [ ] `src/renderer/components/ErrorBoundary.tsx` (~100 lines)
  - Error handling for React components

**Sample Code for App.tsx with animations:**
```typescript
import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes/routes';
import './styles/global.css';

const App: React.FC = () => (
  <div className="min-h-screen bg-gray-100 transition-all duration-300">
    <RouterProvider router={router} />
  </div>
);

export default App;
```

### Phase 6.4: Application Auto-Updates

**Tasks:**
- [ ] Implement application auto-update functionality with electron-updater
- [ ] Create update checking and notification system

**Files to Create:**
- [ ] `src/main/services/appUpdater.ts` (~150 lines)
  - Application update checking and installation
  - Update notification management
- [ ] `src/renderer/features/updates/components/UpdateNotification.tsx` (~100 lines)
  - UI for displaying update availability and progress

**Sample Code for `src/main/services/appUpdater.ts`:**
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
- [ ] `tests/main/services/downloadManager.test.ts` (~150 lines)
  - Tests for download manager
- [ ] `tests/main/services/playlistManager.test.ts` (~150 lines)
  - Tests for playlist management
- [ ] `tests/renderer/features/playlists/components/PlaylistList.test.tsx` (~150 lines)
  - Tests for playlist list component
- [ ] `tests/renderer/features/player/components/VideoPlayer.test.tsx` (~150 lines)
  - Tests for video player component
- [ ] `tests/renderer/stores/settingsStore.test.tsx` (~100 lines)
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

- [x] Setup Tailwind CSS with custom configuration:
```bash
npm install tailwindcss@latest postcss autoprefixer
npx tailwindcss init -p
```

- [x] Configure YouTube-inspired color palette:
  - Primary: YouTube Red (#FF0000)
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

- [x] Create light/dark theme toggle functionality
- [x] Ensure consistent styling across all components with the theme
- [x] Implement responsive design with Tailwind's utility classes

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
│   ├── main/
│   │   ├── main.ts
│   │   ├── ipc/
│   │   │   └── handlers.ts
│   │   ├── services/
│   │   │   ├── ytDlpManager.ts
│   │   │   ├── downloadManager.ts
│   │   │   ├── playlistManager.ts
│   │   │   ├── privatePlaylistManager.ts
│   │   │   ├── formatConverter.ts
│   │   │   ├── authManager.ts
│   │   │   ├── settingsManager.ts
│   │   │   ├── youtubeApi.ts
│   │   │   ├── thumbnailUtils.ts
│   │   │   ├── videoStatusChecker.ts
│   │   │   ├── playlistUpdater.ts
│   │   │   └── logger.ts
│   │   └── utils/
│   │       └── fileUtils.ts
│   ├── renderer/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   │   └── routes.ts
│   │   ├── components/
│   │   │   └── ErrorBoundary.tsx
│   │   ├── features/
│   │   │   ├── playlists/
│   │   │   │   └── components/
│   │   │   │       ├── PlaylistList.tsx
│   │   │   │       ├── PlaylistCard.tsx
│   │   │   │       ├── CreatePlaylistForm.tsx
│   │   │   │       ├── PlaylistFilters.tsx
│   │   │   │       └── PlaylistView.tsx
│   │   │   ├── downloads/
│   │   │   │   └── components/
│   │   │   │       ├── FormatSelector.tsx
│   │   │   │       └── DownloadStatus.tsx
│   │   │   ├── player/
│   │   │   │   └── components/
│   │   │   │       ├── VideoPlayer.tsx
│   │   │   │       └── StreamSelector.tsx
│   │   │   ├── accounts/
│   │   │   │   └── components/
│   │   │   │       └── AccountManager.tsx
│   │   │   ├── videos/
│   │   │   │   └── components/
│   │   │   │       └── VideoStatusIndicator.tsx
│   │   │   ├── tags/
│   │   │   │   └── components/
│   │   │   │       ├── TagManager.tsx
│   │   │   │       └── TagFilter.tsx
│   │   │   └── theme/
│   │   │       └── components/
│   │   │           └── ThemeToggle.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── Settings/
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── General/
│   │   │   │   │   └── GeneralSettingsPage.tsx
│   │   │   │   ├── Storage/
│   │   │   │   │   └── StorageSettingsPage.tsx
│   │   │   │   ├── Downloads/
│   │   │   │   │   └── DownloadsSettingsPage.tsx
│   │   │   │   ├── Accounts/
│   │   │   │   │   └── AccountsSettingsPage.tsx
│   │   │   │   ├── Playback/
│   │   │   │   │   └── PlaybackSettingsPage.tsx
│   │   │   │   ├── Playlists/
│   │   │   │   │   └── PlaylistsSettingsPage.tsx
│   │   │   │   └── Advanced/
│   │   │   │       └── AdvancedSettingsPage.tsx
│   │   │   └── PlaylistView/
│   │   │       └── PlaylistViewPage.tsx
│   │   ├── stores/
│   │   │   ├── playlistStore.ts
│   │   │   ├── downloadStore.ts
│   │   │   ├── accountStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── utils/
│   │   │   └── rendererUtils.ts
│   │   └── styles/
│   │       └── global.css
│   └── shared/
│       ├── types/
│       │   └── appTypes.ts
│       └── constants/
│           └── appConstants.ts
├── assets/
│   ├── icons/
│   │   └── app-icon.png
│   └── images/
│       └── placeholder.jpg
├── public/
│   └── index.html
├── tests/
│   ├── main/
│   │   └── services/
│   │       ├── downloadManager.test.ts
│   │       └── playlistManager.test.ts
│   └── renderer/
│       ├── features/
│       │   ├── playlists/
│   │   │   └── components/
│   │   │       └── PlaylistList.test.tsx
│   │   └── player/
│   │       └── components/
│   │           └── VideoPlayer.test.tsx
│   └── stores/
│       └── settingsStore.test.tsx
└── docs/
    ├── UserGuide.md
    └── DEVELOPER.md
``` 
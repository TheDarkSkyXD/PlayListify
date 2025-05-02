# PlayListify - Implementation Workflow

This document provides a structured workflow for implementing the PlayListify application, organized into phases and checklist items for tracking progress.

## Phase 1: Project Setup & Core Dependencies

### 1.0: Package Setup & Management
- [x] Initialize package.json with `npm init -y`
  - Path: Project Root (`.`)
- [x] Use Context7 to determine appropriate package versions before installation:
  ```bash
  # Get information about key packages before installing
  npx context7 resolve-library-id electron
  npx context7 get-library-docs electron
  npx context7 resolve-library-id @tanstack/react-query
  npx context7 get-library-docs @tanstack/react-query
  npx context7 resolve-library-id zustand
  npx context7 get-library-docs zustand
  ```
  - Path: Project Root (`.`)
- [x] Install development dependencies with specific versions (use the versions from the implementation plan):
  ```bash
  npm install --save-dev @electron-forge/cli@7.8.0 @electron-forge/maker-deb@7.8.0 @electron-forge/maker-rpm@7.8.0 @electron-forge/maker-squirrel@7.8.0 @electron-forge/maker-zip@7.8.0 @electron-forge/plugin-auto-unpack-natives@7.8.0 @electron-forge/plugin-fuses@7.8.0 @electron-forge/plugin-webpack@7.8.0 @electron/fuses@1.8.0 @electron/rebuild@3.6.0 @radix-ui/react-checkbox@1.1.4 @radix-ui/react-dialog@1.1.6 @radix-ui/react-label@2.1.2 @radix-ui/react-select@2.1.6 @radix-ui/react-slot@1.1.2 @testing-library/jest-dom@6.6.3 @testing-library/react@14.3.1 @types/jest@29.5.12 @types/progress@2.0.7 @types/react@18.2.55 @types/react-dom@18.2.19 @types/sqlite3@3.1.11 @types/tar@6.1.13 @types/testing-library__jest-dom@5.14.9 @types/unzipper@0.10.11 @types/uuid@10.0.0 @vercel/webpack-asset-relocator-loader@1.7.3 autoprefixer@10.4.17 copy-webpack-plugin@13.0.0 cross-env@7.0.3 css-loader@6.10.0 electron@28.2.3 eslint@8.56.0 ffprobe-static@3.1.0 jest@29.7.0 jest-environment-jsdom@29.7.0 node-loader@2.0.0 postcss@8.4.35 postcss-loader@8.1.1 prettier@3.2.5 prettier-plugin-sort-imports@1.8.6 prettier-plugin-tailwindcss@0.5.11 purgecss@5.0.0 shadcn-ui@0.9.5 style-loader@3.3.4 tailwindcss@3.4.1 ts-jest@29.1.2 ts-loader@9.5.1 typescript@5.3.3
  ```
  - Path: Project Root (`.`)
- [x] Install runtime dependencies with specific versions (use the versions from the implementation plan):
  ```bash
  npm install @radix-ui/react-alert-dialog@1.1.6 @radix-ui/react-popover@1.1.6 @radix-ui/react-progress@1.1.2 @radix-ui/react-separator@1.1.2 @radix-ui/react-slider@1.2.3 @radix-ui/react-switch@1.1.3 @radix-ui/react-tabs@1.1.3 @radix-ui/react-tooltip@1.1.8 @shadcn/ui@0.0.4 @tanstack/react-query@5.71.10 @tanstack/react-router@1.114.34 @types/better-sqlite3@7.6.13 @types/fs-extra@11.0.4 @types/mime-types@2.1.4 @types/node@22.14.0 axios@1.8.4 better-auth@1.2.4 better-sqlite3@11.9.1 class-variance-authority@0.7.1 clsx@2.1.1 date-fns@4.1.0 electron-squirrel-startup@1.0.1 electron-store@10.0.1 electron-updater@6.6.2 ffprobe@1.1.2 fluent-ffmpeg@2.1.3 fs-extra@11.3.0 googleapis@148.0.0 lucide-react@0.487.0 mime-types@3.0.1 p-queue@8.1.0 react@18.2.0 react-dom@18.2.0 react-hook-form@7.54.2 react-player@2.16.0 react-router-dom@7.5.0 tailwind-merge@3.1.0 transliteration@2.3.5 unzipper@0.12.3 uuid@11.1.0 winston@3.17.0 yt-dlp-wrap@2.3.12 zustand@5.0.3
  ```
  - Path: Project Root (`.`)
- [x] Create a documentation lookup helper script for ongoing development:
  ```javascript
  // scripts/get-package-docs.js
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  // Function to lookup documentation for a package
  const lookupDocs = (packageName, topic = '') => {
    try {
      console.log(`Looking up documentation for ${packageName}${topic ? ` on "${topic}"` : ''}...`);
      
      // First resolve the library ID
      const resolveCmd = `npx context7 resolve-library-id ${packageName}`;
      const libraryId = execSync(resolveCmd, { encoding: 'utf8' }).trim();
      
      if (!libraryId || libraryId.includes('Could not find')) {
        console.error(`Could not resolve library ID for ${packageName}`);
        return;
      }
      
      console.log(`Resolved ID: ${libraryId}`);
      
      // Now get the docs
      const docsCmd = `npx context7 get-library-docs ${libraryId}${topic ? ` --topic="${topic}"` : ''}`;
      const docs = execSync(docsCmd, { encoding: 'utf8' });
      
      // Save to a docs folder
      const docsDir = path.join(__dirname, '../docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      const filename = `${packageName.replace(/\//g, '-')}${topic ? `-${topic.replace(/\s/g, '-')}` : ''}.md`;
      fs.writeFileSync(path.join(docsDir, filename), docs);
      
      console.log(`Saved documentation to docs/${filename}`);
    } catch (error) {
      console.error(`Error looking up documentation for ${packageName}:`, error.message);
    }
  }

  // If running directly from command line
  if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.log('Usage: node get-package-docs.js packageName [topic]');
      return;
    }
    
    const packageName = args[0];
    const topic = args[1] || '';
    lookupDocs(packageName, topic);
  }

  module.exports = lookupDocs;
  ```
  - Path: `scripts/get-package-docs.js`
- [x] Create a package version checker script that uses Context7 for documentation:
  ```javascript
  // scripts/check-package-versions.js
  const https = require('https');
  const packageJson = require('../package.json');
  const lookupDocs = require('./get-package-docs');

  const checkDependencies = async (deps) => {
    for (const [pkg, version] of Object.entries(deps)) {
      try {
        const currentVersion = version.replace('^', '');
        const latestVersion = await getLatestVersion(pkg);
        
        if (currentVersion !== latestVersion) {
          console.log(`${pkg}: ${currentVersion} → ${latestVersion} [UPDATE AVAILABLE]`);
          
          // For major packages, also look up documentation if there's an update
          if (isKeyPackage(pkg)) {
            lookupDocs(pkg);
          }
        } else {
          console.log(`${pkg}: ${currentVersion} [UP TO DATE]`);
        }
      } catch (error) {
        console.error(`Error checking ${pkg}: ${error.message}`);
      }
    }
  };

  const isKeyPackage = (pkg) => {
    const keyPackages = [
      'electron', 'react', 'react-dom', 'react-query', '@tanstack/react-query', 
      'zustand', 'better-sqlite3', 'yt-dlp-wrap', 'fluent-ffmpeg'
    ];
    return keyPackages.some(kp => pkg.includes(kp));
  };

  const getLatestVersion = (pkg) => {
    return new Promise((resolve, reject) => {
      https.get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const latest = JSON.parse(data).version;
            resolve(latest);
          } catch (error) {
            reject(new Error(`Failed to parse response for ${pkg}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  };

  console.log('Checking dependencies...');
  checkDependencies(packageJson.dependencies);
  
  console.log('\nChecking devDependencies...');
  checkDependencies(packageJson.devDependencies);
  ```
  - Path: `scripts/check-package-versions.js`

### 1.1: Initialize Electron Project with Forge & TypeScript
- [x] Initialize project with Electron Forge (Webpack + TypeScript template)
  - Path: Project Root (`.`)
- [x] Verify initial build 

### 1.2: Install Core Dependencies
- [x] Install React & related dependencies
  - Path: `package.json`
- [x] Install UI Framework (shadcn/ui & Tailwind)
  - Paths: `package.json`, `tailwind.config.js`, `postcss.config.js`, `src/renderer/styles/globals.css`, `components.json`
- [x] Install State Management & Routing (Zustand, TanStack Router)
  - Path: `package.json`
- [x] Install Backend/Main Process Dependencies (better-sqlite3, yt-dlp-wrap, etc.)
  - Path: `package.json`

### 1.3: Configure TypeScript & ESLint/Prettier
- [x] Configure tsconfig.json for strict mode
  - Path: `tsconfig.json`, `tsconfig.node.json` (if exists)
- [x] Setup ESLint & Prettier
  - Paths: `package.json`, `.eslintrc.js`, `.prettierrc.js`, `.eslintignore`, `.prettierignore`
- [x] Add Lint/Format Scripts to package.json
  - Path: `package.json`

### 1.4: Establish Basic File Structure
- [x] Create Main Process Folders (database, services, utils)
  - Path: `src/main/`
- [x] Create Renderer Process Folders (assets, components, hooks, etc.)
  - Path: `src/renderer/`
- [x] Create Shared Folder for types and constants
  - Path: `src/shared/`
- [x] Update Entry Points (if needed)
  - Paths: `src/main/index.ts`, `src/renderer/index.tsx`, `forge.config.js`

## Phase 2: Database Setup

### 2.1: Define Database Schema
- [x] Create schema.sql file with all required tables
  - Path: `src/main/database/schema.sql`

### 2.2: Implement Database Initialization & Connection
- [x] Create Database Service Module
  - Path: `src/main/database/index.ts`
- [x] Implement Connection Logic
  - Path: `src/main/database/index.ts`
- [x] Call Initialization on App Start
  - Path: `src/main/index.ts`

### 2.3: Implement Basic CRUD Helpers
- [x] Create Playlist CRUD Helpers
  - Path: `src/main/database/playlistQueries.ts`
- [x] Create Video CRUD Helpers
  - Path: `src/main/database/videoQueries.ts`
- [x] Create PlaylistVideo CRUD Helpers
  - Path: `src/main/database/playlistVideoQueries.ts`
- [x] Create History CRUD Helpers
  - Path: `src/main/database/historyQueries.ts`

### 2.4: Implement Database Migrations (Basic)
- [x] Implement Version Check
  - Path: `src/main/database/index.ts`
- [x] Implement Migration Logic
  - Path: `src/main/database/index.ts`
- [x] Create Initial Migration (Set Version 1)
  - Path: `src/main/database/index.ts`

## Phase 3: Core Infrastructure Setup

### 3.1: Implement Secure IPC Bridge (Preload Script)
- [x] Create Preload Script
  - Path: `src/main/preload.ts`
- [x] Expose API via contextBridge
  - Path: `src/main/preload.ts`
- [x] Configure Main Process to Use Preload
  - Path: `src/main/index.ts`
- [x] Update Build Configuration (if needed)
  - Path: `forge.config.js` (or related Webpack config)

### 3.2: Setup Basic IPC Handlers
- [x] Create IPC Directory
  - Path: `src/main/ipc/`
- [x] Implement Ping Handler
  - Path: `src/main/index.ts` or `src/main/ipc/appHandlers.ts`
- [x] Register Handlers (if separate file)
  - Path: `src/main/index.ts`
- [x] Test Handler from Renderer
  - Path: `src/renderer/App.tsx` (or similar test location)

### 3.3: Implement Settings Management (Electron Store)
- [x] Create Settings Service
  - Path: `src/main/services/settingsService.ts`
- [x] Define Default Settings
  - Path: `src/main/services/settingsService.ts`
- [x] Create Settings IPC Handlers
  - Path: `src/main/ipc/settingsHandlers.ts`
- [x] Register Settings Handlers
  - Path: `src/main/index.ts`

### 3.4: Implement Logging (Winston)
- [x] Create Log Service
  - Path: `src/main/services/logService.ts`
- [x] Initialize Logger
  - Path: `src/main/index.ts`
- [x] Implement Global Error Handler
  - Path: `src/main/index.ts`

### 3.5: Configure Application Updates (electron-updater)
- [x] Configure Publisher (GitHub)
  - Path: `forge.config.js` or `package.json`
- [x] Create Update Service
  - Path: `src/main/services/updateService.ts`
- [x] Handle Update Events
  - Path: `src/main/services/updateService.ts`
- [x] Create Update IPC Handlers
  - Path: `src/main/ipc/appHandlers.ts`
- [x] Initialize Update Checks
  - Path: `src/main/index.ts`

### 3.6: Setup Dependency Handling (yt-dlp/ffmpeg)
- [x] Decide on Strategy (Bundle vs. System)
  - Path: N/A (Architectural decision)
- [x] Create Dependency Service
  - Path: `src/main/services/dependencyService.ts`
- [x] Implement Path Resolution Logic
  - Path: `src/main/services/dependencyService.ts`
- [x] Integrate with Wrappers
  - Path: `src/main/services/dependencyService.ts`
- [x] Refactor Into Specialized Services
  - Paths: 
    - `src/main/services/ytdlpService.ts` - Service for yt-dlp functionality
    - `src/main/services/ffmpegService.ts` - Service for ffmpeg functionality
    - `src/main/services/dependencyService.ts` - Facade to coordinate specialized services

## Phase 4: Playlist Management Implementation

### 4.1: Implement Playlist Service Logic
- [x] Create Playlist Service File
  - Path: `src/main/services/playlistService.ts`
- [x] Implement `createCustomPlaylist`
  - Path: `src/main/services/playlistService.ts`
- [x] Implement `importYouTubePlaylist`
  - Path: `src/main/services/youtubePlaylistService.ts`
- [x] Implement `getAllPlaylists`
  - Path: `src/main/services/playlistService.ts`
- [x] Implement `getPlaylistDetails`
  - Path: `src/main/services/playlistService.ts`
- [x] Implement `deletePlaylist`
  - Path: `src/main/services/playlistService.ts`
- [x] Implement `refreshPlaylist`
  - Path: `src/main/services/playlistService.ts` (using `youtubePlaylistService`)
- [x] Implement `exportPlaylist` / `importPlaylistFromJson`
  - Path: `src/main/services/playlistImportExportService.ts`
- [x] Implement Video Management Functions (add, remove, reorder)
  - Path: `src/main/services/playlistVideoService.ts`

### 4.2: Implement Playlist IPC Handlers
- [x] Create Playlist IPC Handler File
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Playlist Creation/Import Handlers
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Get All Playlists Handler
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Get Playlist Details Handler
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Update and Delete Playlist Handlers
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Refresh Playlist Handler
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Export/Import Handlers
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Implement Video Operations Handlers (add, remove, reorder)
  - Path: `src/main/ipc/playlistHandlers.ts`
- [x] Register Handlers in Main Process
  - Path: `src/main/index.ts`

### 4.3: Implement Frontend Playlist State Management
- [x] Create Shared Types for Playlist Operations
  - Path: `src/shared/types/index.ts`
- [x] Create React Query Hooks for Playlist Operations
  - Path: `src/renderer/hooks/usePlaylistQueries.ts`
- [x] Create Zustand Store for UI State Management
  - Path: `src/renderer/store/playlistStore.ts`
- [x] Set Up React Query Client
  - Path: `src/renderer/App.tsx`

### 4.4: Implement Playlist List UI
- [x] Create Playlist List Component
  - Path: `src/renderer/components/PlaylistList/PlaylistList.tsx`
- [x] Create Playlist Item Component
  - Path: `src/renderer/components/PlaylistList/PlaylistItem.tsx`
- [x] Integrate into My Playlists Page
  - Path: `src/renderer/pages/MyPlaylists.tsx`

### 4.5: Implement Playlist Details UI
- [x] Create Playlist View Component
  - Path: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- [x] Create Video Item Component
  - Path: `src/renderer/components/PlaylistView/VideoItem.tsx`
- [x] Implement Video List Rendering
  - Path: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- [x] Implement Search/Filter Bar
  - Path: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- [x] Integrate into My Playlists Page
  - Path: `src/renderer/pages/MyPlaylists.tsx`

### 4.6: Implement Create/Import Playlist UI
- [x] Create Playlist Actions Bar
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistActionsBar.tsx`
- [x] Create "New Playlist" Modal
  - Path: `src/renderer/components/Modals/CreatePlaylistModal.tsx`
- [x] Create "Import Playlist" Modal
  - Path: `src/renderer/components/Modals/ImportPlaylistModal.tsx`
- [x] Connect Buttons to Modals
  - Path: `src/renderer/pages/MyPlaylists.tsx`

### 4.7: Implement Playlist Actions (Rename, Delete, Duplicate, Refresh)
- [x] Add Action Buttons/Menu
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistItem.tsx`
- [x] Implement Rename Logic
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistItem.tsx` (and `src/renderer/components/Modals/RenamePlaylistModal.tsx`)
- [x] Implement Delete Logic
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistItem.tsx` (and `src/renderer/components/Modals/ConfirmDeleteModal.tsx`)
- [ ] Implement Duplicate Logic
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistItem.tsx` (and potentially new service/handler)
- [x] Implement Refresh Logic
  - Path: `src/renderer/components/PlaylistSidebar/PlaylistItem.tsx`

### 4.8: Implement Playlist Export/Import (JSON)
- [x] Add Export Button/Menu Item
  - Path: `src/renderer/components/PlaylistList/PlaylistItem.tsx` (export button in playlist item menu)
- [x] Implement Export Logic
  - Path: `src/renderer/pages/MyPlaylists.tsx` (handlePlaylistAction export case)
- [x] Add Import Button/Menu Item
  - Path: `src/renderer/components/PlaylistList/PlaylistActionsBar.tsx` (Import JSON button)
- [x] Implement Import Logic
  - Path: `src/renderer/pages/MyPlaylists.tsx` (handleImportJsonSubmit) and `src/renderer/components/Modals/ImportJsonModal.tsx`

## Phase 5: Video Download Implementation

### 5.1: Implement Download Service Logic
- [ ] Create Download Service File
  - Path: `src/main/services/downloadService.ts`
- [ ] Initialize Download Queue
  - Path: `src/main/services/downloadService.ts`
- [ ] Implement `getFormats`
  - Path: `src/main/services/downloadService.ts`
- [ ] Implement `addDownload` (Core Logic)
  - Path: `src/main/services/downloadService.ts`
- [ ] Implement `startVideoDownload` / `startPlaylistDownload`
  - Path: `src/main/services/downloadService.ts`
- [ ] Implement `getQueueStatus`
  - Path: `src/main/services/downloadService.ts`

### 5.2: Implement Download IPC Handlers & Events
- [ ] Create Download Handlers File
  - Path: `src/main/ipc/downloadHandlers.ts`
- [ ] Implement Handlers
  - Path: `src/main/ipc/downloadHandlers.ts`
- [ ] Register Download Handlers
  - Path: `src/main/index.ts`
- [ ] Verify Event Sending
  - Path: `src/main/services/downloadService.ts`

### 5.3: Implement Frontend Download State Management
- [ ] Create Download Store (Zustand)
  - Path: `src/renderer/store/downloadStore.ts`
- [ ] Implement IPC Event Listeners
  - Path: `src/renderer/App.tsx` (or similar)
- [ ] Create Format Query Hook
  - Path: `src/renderer/hooks/useDownloadQueries.ts`

### 5.4: Implement Download Button & Options UI
- [ ] Create Download Button Component
  - Path: `src/renderer/components/DownloadButton/DownloadButton.tsx`
- [ ] Add Button to Video Item
  - Path: `src/renderer/components/PlaylistView/VideoItem.tsx`
- [ ] Create Download Options Modal
  - Path: `src/renderer/components/Modals/DownloadOptionsModal.tsx`
- [ ] Connect Button to Modal
  - Path: `src/renderer/components/DownloadButton/DownloadButton.tsx`

### 5.5: Implement Downloads Page UI
- [ ] Create Downloads Page Component
  - Path: `src/renderer/pages/Downloads.tsx`
- [ ] Access Download Queue State
  - Path: `src/renderer/pages/Downloads.tsx`
- [ ] Render Download Items
  - Path: `src/renderer/pages/Downloads.tsx`
- [ ] Add Page to Router
  - Path: `src/renderer/router/index.ts`

## Phase 6: User Experience & Core UI Implementation

### 6.1: Implement Main Layout & Navigation
- [x] Create Main Layout Component
  - Path: `src/renderer/layouts/MainLayout.tsx`
- [x] Create Sidebar Component
  - Path: `src/renderer/components/Sidebar/Sidebar.tsx`
- [ ] Configure Router
  - Path: `src/renderer/router/index.ts`, `src/renderer/pages/*.tsx`
- [ ] Integrate Router in App
  - Path: `src/renderer/App.tsx`

### 6.2: Implement Settings Page UI & Logic
- [ ] Create Settings Page Component
  - Path: `src/renderer/pages/Settings.tsx`
- [ ] Create Setting Item Component (e.g., Directory Selector)
  - Path: `src/renderer/components/Settings/DirectorySelector.tsx`
- [ ] Implement Setting Update Logic
  - Path: `src/renderer/pages/Settings.tsx`, `src/renderer/components/Settings/DirectorySelector.tsx`
- [ ] Display Settings
  - Path: `src/renderer/pages/Settings.tsx`

### 6.3: Implement History Service & UI
- [ ] Implement History Service Logic
  - Path: `src/main/services/historyService.ts`
- [ ] Implement History IPC Handlers
  - Path: `src/main/ipc/historyHandlers.ts`
- [ ] Register History Handlers
  - Path: `src/main/index.ts`
- [ ] Implement History Page UI
  - Path: `
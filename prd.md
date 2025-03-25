# Product Requirements Document: YouTube Playlist Manager & Downloader

## 1. Product Overview

The Playlistify is an Electron-based desktop application that allows users to manage YouTube playlists, download videos using yt-dlp, and play them offline or stream online. The app supports multiple Google accounts, customizable save locations, and employs Zustand for state management.

## 2. Target Users

- YouTube content consumers who want to manage playlists offline
- Users who need to download videos for offline viewing
- Content creators managing multiple playlists
- Users with limited internet connectivity who need offline access

## 3. Core Features

### 3.1 Playlist Management
- Create custom playlists
- Import existing YouTube playlists (public and private)
- Add/remove videos from playlists
- Search and filter playlists
- Add custom tags to playlists

### 3.2 Video Downloading
- Download videos with customizable quality settings
- Format conversion options (MP4, MP3, etc.)
- Queue management for batch downloads
- Download status tracking
- Download private content (with authentication)

### 3.3 Playback
- Offline playback of downloaded videos
- Streaming option for non-downloaded content
- Video player controls (volume, playback speed, etc.)
- Subtitle support

### 3.4 Account Management
- Google OAuth2 authentication
- Support for multiple accounts
- Token refresh management
- Private playlist access

### 3.5 Status Tracking
- Video availability checking
- Download progress display
- Auto-refresh of playlist content

## 4. Technical Specifications

### 4.1 Technologies
- Electron v35.0.3 for cross-platform desktop application
- React v19.0.0 with TypeScript for UI development
- Tailwind CSS v4.0.15 for styling
- yt-dlp-wrap v2.3.12 for YouTube video downloading
- Zustand v5.0.3 for state management
- TanStack React Query v5.69.0 for data fetching
- TanStack React Router v1.114.27 for routing
- Electron Store v10.0.1 for persistent storage
- P-Queue v8.1.0 for task queuing
- Winston v3.17.0 for logging
- Fluent-FFmpeg v2.1.3 for media processing
- React Player v2.16.0 for video playback

### 4.2 Required Packages
#### Core Packages
- electron
- @electron-forge/cli
- @electron-forge/maker-squirrel
- @electron-forge/maker-zip
- @electron-forge/maker-deb
- @electron-forge/maker-rpm
- typescript
- @types/node
- electron-store
- fs-extra
- @types/fs-extra
- electron-updater
- electron-squirrel-startup

#### UI Packages
- react
- react-dom
- @types/react
- @types/react-dom
- tailwindcss
- postcss
- autoprefixer
- @shadcn/ui
- @tanstack/react-router
- @tanstack/react-query

#### Media & Downloads Packages
- yt-dlp-wrap
- fluent-ffmpeg
- p-queue
- react-player
- winston

#### Integration Packages
- better-auth
- googleapis
- axios
- zustand

#### Build & Development Packages
- @electron-forge/plugin-auto-unpack-natives
- @electron-forge/plugin-fuses
- @electron-forge/plugin-webpack
- @electron/fuses
- @vercel/webpack-asset-relocator-loader
- cross-env
- css-loader
- electron-rebuild
- eslint
- node-loader
- prettier
- prettier-plugin-sort-imports
- prettier-plugin-tailwindcss
- purgecss
- style-loader

#### Testing Packages
- jest
- @types/jest
- ts-jest
- @testing-library/react
- @types/lodash

### 4.3 Architecture
- Main Process: Handles file system operations, video downloads, and YouTube API interactions
- Renderer Process: Manages UI components and state
- IPC Communication: Facilitates communication between processes

### 4.4 UI/UX Design
- Dark and light themes with YouTube-inspired color palette
- Primary color: YouTube Red (#FF0000)
- Dark mode colors:
  - Main Background: #181818 (deep gray)
  - Secondary Background: #212121 (dark gray)
  - Tertiary Background: #3d3d3d (medium-dark gray)
  - Primary Text: #FFFFFF (white)
  - Secondary Text: #AAAAAA (lighter gray)
  - Accent: #FF0000 (red)
- Light mode colors:
  - Main Background: #FFFFFF (white)
  - Secondary Background: #EDEDED (light gray)
  - Primary Text: #212121 (dark gray)
  - Secondary Text: #808080 (medium gray)
  - Accent: #FF0000 (red)
- Neutral color: #AAAAAA (medium gray) for borders and secondary UI elements
- Responsive layout with adaptive components
- Material Design inspired UI elements
- Enhanced accessibility features

## 5. UI/UX Design

### 5.1 Main Interface
- Clean, modern design with responsive layout
- Dark/light theme support
- Sidebar navigation for playlist access
- Main content area for playlist display and video playback

### 5.2 Settings Page
Eight categories of settings:
1. General Settings (theme, language, startup options)
2. Storage Settings (file locations, organization)
3. Download Settings (quality, format, concurrency)
4. Account Settings (connected accounts, token management)
5. Playback Settings (default mode, volume, subtitles)
6. Playlist Settings (refresh intervals, name sanitization)
7. Advanced Settings (cache management, debugging)

## 6. Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
- Initialize Electron project with TypeScript
- Set up React and UI libraries
- Configure routing and data fetching
- Implement persistent storage and file system utilities

### Phase 2: Playlist Management & Local Storage
- Develop playlist creation UI
- Implement yt-dlp integration for playlist fetching
- Create state management with Zustand
- Build playlist display components

### Phase 3: Video Downloading & Playback
- Implement download logic with yt-dlp
- Add format conversion capabilities
- Develop queue management for downloads
- Create video player component
- Add download status tracking

### Phase 4: Google & YouTube Integration
- Implement OAuth2 authentication
- Create YouTube API integration
- Add private playlist support
- Develop account management UI

### Phase 5: Video Status & Streaming
- Implement video availability checking
- Add streaming support for non-downloaded content
- Create status UI components
- Implement thumbnail fetching

### Phase 6: Advanced Features & Polish
- Add playlist tagging system
- Implement automatic playlist updates
- Calculate and display playlist durations
- Polish UI with animations and transitions

### Phase 7: Testing & Deployment
- Create unit tests for core functionality
- Ensure cross-platform compatibility
- Package app for distribution
- Create user documentation

## 7. File Structure
The application follows a modular file structure with:
- Main process files in src/main
- Renderer process files in src/renderer
- Shared types and constants in src/shared
- Assets in assets/
- Tests in tests/
- Documentation in docs/

## 8. Testing Requirements
- Unit tests for core functionality
- Integration tests for main components
- Cross-platform testing on Windows, macOS, and Linux
- Performance testing for download queues

## 9. Performance Requirements
- Support for downloading multiple videos concurrently
- Efficient memory usage during long download sessions
- Responsive UI during background operations
- Minimal startup time

## 10. Security Requirements
- Secure storage of OAuth tokens
- Proper handling of file system permissions
- Protection against common web vulnerabilities

## 11. Deliverables
- Functional Electron application
- Source code with proper documentation
- Installers for Windows, macOS, and Linux
- User guide and developer documentation

## 12. Future Enhancements
- Scheduled downloads
- Video editing capabilities
- Integration with other video platforms
- Mobile companion app 
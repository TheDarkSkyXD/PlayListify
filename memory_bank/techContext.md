# Technical Context

## Technology Stack

### Electron
- **Electron**: Version 28+
- **Node.js**: Version 18+ (LTS)
- **Chromium**: Latest version bundled with Electron
- **Main Process**: Node.js
- **Renderer Process**: React 18+

### Frontend (Renderer Process)
- **Framework**: React 18+
- **Language**: TypeScript 5.0+
- **State Management**: Redux Toolkit
- **Styling**: Styled Components 6.0+, Material UI 5.0+
- **Testing**: Jest, React Testing Library
- **Build Tools**: Electron Forge or Electron Builder, Vite 4.0+

### Backend (Main Process)
- **Runtime**: Node.js 18+ (LTS) embedded in Electron
- **IPC**: Electron IPC for main/renderer communication
- **Local Storage**: Electron Store for persistent data
- **Authentication**: OAuth 2.0 for third-party auth
- **API Communication**: Axios, fetch API
- **Security**: Secure storage for tokens and credentials

### DevOps
- **Version Control**: Git, GitHub
- **CI/CD**: GitHub Actions
- **Packaging**: Electron Builder/Forge for platform-specific builds
- **Code Signing**: Platform-specific code signing (Windows, macOS)
- **Auto-updates**: Electron Updater
- **Monitoring**: Sentry for error tracking
- **Analytics**: Google Analytics, custom event tracking

## External Integrations

### Music Streaming Services
- **Spotify API**
  - Authentication: OAuth 2.0
  - Features: Playlist CRUD, User Library Access, Search
  - Rate Limits: 1000 requests per day
  
- **Apple Music API**
  - Authentication: JWT with MusicKit
  - Features: Playlist Management, Library Access
  - Rate Limits: Variable, token-based
  
- **YouTube Music API**
  - Authentication: OAuth 2.0
  - Features: Playlist CRUD, Search
  - Rate Limits: Quota-based system

### Additional Services
- **User Authentication**: OAuth for streaming services
- **Storage**: Local file system for cached content
- **Email**: System mail client integration for sharing

## Development Environment
- **Code Editor**: VS Code with standardized extensions
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier
- **Pre-commit Hooks**: Husky with lint-staged
- **Package Manager**: npm or yarn
- **Electron Development**: Electron DevTools Extension, electron-debug

## Platform Support
- **Windows**: 10, 11
- **macOS**: Latest 3 versions
- **Linux**: Ubuntu, Debian, Fedora

## Performance Requirements
- Initial load under 3 seconds
- Time to interactive under 5 seconds
- API response times under 300ms
- Offline capabilities for core functionality
- Memory usage optimized for desktop environment
- CPU usage minimized for background operation

## Download System Architecture

### Download Service
We've implemented a download service that manages video downloads using yt-dlp and a queue system:

- **Queue Management**: Uses `p-queue` to manage concurrent downloads with configurable limits
- **Download Tracking**: Downloads are tracked in the database with status, progress, and file information
- **Format Detection**: Fetches and presents available video formats using yt-dlp's format detection
- **Progress Tracking**: Monitors download progress in real-time and sends events to the renderer
- **Error Handling**: Manages download failures and provides retry capabilities
- **Recovery**: Automatically recovers interrupted downloads on application restart

### IPC Communication
Download events flow from main process to renderer using these channels:

- `download:progress` - Real-time progress updates (percent complete, speed, etc.)
- `download:complete` - Notification when download completes, fails, or is cancelled
- `download:queue-update` - Updates on the overall queue status

### Database Structure
Downloads are stored in the `downloads` table with the following structure:
```sql
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL DEFAULT 0,
  download_path TEXT NOT NULL,
  format_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  final_path TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(video_id) REFERENCES videos(video_id) ON DELETE CASCADE
);
```

### External Dependencies
The download system relies on these external tools:

- **yt-dlp**: Command-line tool for downloading videos from YouTube
- **ffmpeg**: Required by yt-dlp for video processing and format conversion
- Both are bundled/installed by our dependency management system

*This document provides technical context for development decisions and infrastructure planning.* 
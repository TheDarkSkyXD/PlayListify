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

*This document provides technical context for development decisions and infrastructure planning.* 
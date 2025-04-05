# PlayListify Source Code Structure

This document explains the organization of the PlayListify codebase.

## Folder Structure

```
src/
├── backend/       # Electron main process (formerly main/)
│   ├── ipc/       # Inter-process communication handlers
│   ├── services/  # Backend services (YouTube API, download management, etc.)
│   └── utils/     # Backend utility functions
├── frontend/      # React frontend (formerly renderer/)
│   ├── components/  # Shared UI components
│   │   ├── ui/      # Basic UI elements
│   │   ├── layout/  # Layout components
│   │   └── common/  # Common components used across features
│   ├── features/    # Feature-based organization
│   │   ├── dashboard/
│   │   ├── playlists/
│   │   ├── downloads/
│   │   ├── history/
│   │   └── settings/
│   ├── services/    # Frontend services
│   ├── utils/       # Frontend utility functions
│   ├── styles/      # Global styles
│   └── App.tsx      # Main App component
└── shared/        # Code shared between backend and frontend
    ├── constants/ # Shared constants
    └── types/     # TypeScript type definitions
```

## Architecture Overview

PlayListify is built with Electron, which uses a multi-process architecture:

### Backend (Main Process)

The `backend/` folder contains all code that runs in Electron's main process:

- **Access to Node.js APIs**: Full access to Node.js and native modules
- **System Integration**: File system access, OS notifications, etc.
- **Backend Services**: YouTube API integration, download management, etc.
- **IPC Handlers**: Communication with the frontend

### Frontend (Renderer Process)

The `frontend/` folder contains all code that runs in Electron's renderer process:

- **User Interface**: React components, pages, and UI logic
- **State Management**: Application state and data flow
- **Feature Organization**: Code organized by features (dashboard, playlists, etc.)
- **API Communication**: Services to communicate with the backend

### Shared Code

The `shared/` folder contains code used by both processes:

- **Type Definitions**: TypeScript interfaces and types
- **Constants**: Shared constants and configuration
- **Utilities**: Helper functions used in both processes

## Communication Between Processes

The backend and frontend communicate through Electron's Inter-Process Communication (IPC) system:

- **From Frontend to Backend**: `window.api.someFunction()`
- **From Backend to Frontend**: Events or responses to IPC calls

## Development Guidelines

1. **Keep Concerns Separated**: Backend code should handle system-level operations, while frontend code should focus on UI and user interactions.

2. **Use TypeScript**: All code should be written in TypeScript for better type safety.

3. **Feature-Based Organization**: Frontend code should be organized by features, with each feature having its own folder.

4. **Shared Components**: Reusable UI components should be placed in the appropriate subfolder of `frontend/components/`.

5. **Documentation**: Document your code, especially public APIs and complex logic.

## Building and Running

See the main README.md file for instructions on building and running the application.

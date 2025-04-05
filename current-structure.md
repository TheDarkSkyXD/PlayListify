# PlayListify - Current Codebase Structure

This document outlines the current organization of the PlayListify codebase to help understand the existing structure before reorganization.

## Top-Level Structure

```
playlistify/
├── package.json
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
├── electron-forge.config.js
├── src/                   # Main source code directory
│   ├── main/              # Electron main process
│   ├── renderer/          # React frontend (renderer process)
│   └── shared/            # Shared code between main and renderer
├── public/                # Static assets
└── scripts/               # Build and utility scripts
```

## Main Process Structure

```
src/main/
├── main.ts                # Main entry point for Electron
├── index.ts               # Secondary entry point
├── preload.ts             # Preload script for Electron
├── ipc/
│   └── handlers.ts        # IPC handlers for main-renderer communication
├── services/              # Backend services
│   ├── ytDlpManager.ts    # YouTube-DL management
│   ├── downloadManager.ts # Download management
│   ├── playlistManager.ts # Playlist management
│   ├── settingsManager.ts # Settings management
│   ├── youtubeApi.ts      # YouTube API integration
│   ├── thumbnailUtils.ts  # Thumbnail utilities
│   ├── videoStatusChecker.ts # Video status checking
│   ├── playlistUpdater.ts # Playlist updating
│   ├── logger.ts          # Logging service
│   └── ytDlp/             # Modular yt-dlp service
│       ├── index.ts       # Re-exports
│       ├── binary.ts      # Binary management
│       ├── config.ts      # Configuration
│       ├── playlist.ts    # Playlist operations
│       └── video.ts       # Video operations
└── utils/
    ├── fileUtils.ts       # File utilities
    └── imageUtils.ts      # Image utilities
```

## Renderer Process Structure

```
src/renderer/
├── index.tsx              # Entry point for React
├── App.tsx                # Main App component
├── components/            # UI components
│   ├── ui/                # Basic UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   └── ... (other UI components)
│   ├── Layout/
│   │   └── AppLayout.tsx  # Main application layout
│   ├── Navigation/
│   │   └── SidebarNav.tsx # Sidebar navigation
│   ├── Media/
│   │   └── CachedImage.tsx # Image with caching
│   └── ImportProgress.tsx # Import progress indicator
├── features/              # Feature-specific components
│   └── playlists/         # Playlist feature
│       └── components/    # Playlist components
│           ├── PlaylistList.tsx
│           ├── PlaylistCard.tsx
│           ├── PlaylistDetails.tsx
│           ├── PlaylistFilters.tsx
│           └── AddPlaylistDialog.tsx
├── pages/                 # Page components
│   ├── Dashboard/
│   │   └── DashboardPage.tsx
│   ├── Playlists/
│   │   └── PlaylistsPage.tsx
│   ├── PlaylistView/
│   │   └── PlaylistViewPage.tsx
│   ├── Downloads/
│   │   └── DownloadsPage.tsx
│   ├── History/
│   │   └── HistoryPage.tsx
│   └── Settings/
│       └── SettingsPage.tsx
├── routes/                # Routing
│   └── routes.ts          # Route definitions
├── services/              # Frontend services
│   ├── playlistService.ts # Playlist service
│   ├── importService.ts   # Import service
│   ├── notificationService.ts # Notification service
│   ├── queryHooks.ts      # React Query hooks
│   └── queryKeys.ts       # React Query keys
├── stores/                # State management
│   └── playlistStore.ts   # Playlist store
├── styles/                # Styling
│   └── global.css         # Global styles
├── utils/                 # Utility functions
│   ├── formatters.ts      # Formatting utilities
│   └── cn.ts              # Class name utility
└── lib/                   # Additional utilities
    └── utils.ts           # General utilities
```

## Shared Code Structure

```
src/shared/
├── constants/
│   └── appConstants.ts    # Application constants
└── types/
    └── appTypes.ts        # TypeScript type definitions
```

## Issues with Current Structure

1. **Multiple utility folders**: There are several utility folders (`utils`, `lib`) with similar purposes, making it unclear where to find specific utility functions.

2. **Inconsistent component organization**: Some components are in `components/`, others in `features/`, and some directly in page folders.

3. **Mixed feature and page organization**: Features and pages are not clearly separated, with some feature components inside page folders.

4. **Duplicate utility functions**: There are multiple implementations of similar utilities (e.g., `cn.ts` and `utils.ts`).

5. **Inconsistent file naming**: Some files use PascalCase, others use camelCase, making it harder to navigate.

6. **Limited feature-based organization**: Only playlists have a dedicated feature folder, while other features are scattered across the codebase.

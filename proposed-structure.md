# PlayListify - Proposed Codebase Structure

This document outlines the proposed reorganization of the PlayListify codebase to improve maintainability, readability, and organization.

## Top-Level Structure (Unchanged)

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

## Main Process Structure (Mostly Unchanged)

```
src/main/
├── main.ts                # Main entry point for Electron
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

## Renderer Process Structure (Reorganized)

```
src/renderer/
├── index.tsx              # Entry point for React
├── App.tsx                # Main App component
├── components/            # Shared UI components
│   ├── ui/                # Basic UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   └── ... (other UI components)
│   ├── layout/            # Layout components
│   │   └── AppLayout.tsx  # Main application layout
│   └── common/            # Other shared components
│       ├── CachedImage.tsx # Image with caching
│       ├── ImportProgress.tsx # Import progress indicator
│       └── SidebarNav.tsx # Sidebar navigation
├── features/              # Feature-based organization
│   ├── dashboard/         # Dashboard feature
│   │   ├── components/    # Dashboard components
│   │   │   └── DashboardStats.tsx
│   │   ├── hooks/         # Dashboard-specific hooks
│   │   │   └── useDashboardStats.ts
│   │   └── pages/         # Dashboard pages
│   │       └── DashboardPage.tsx
│   ├── playlists/         # Playlists feature
│   │   ├── components/    # Playlist components
│   │   │   ├── PlaylistList.tsx
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── PlaylistDetails.tsx
│   │   │   ├── PlaylistFilters.tsx
│   │   │   └── AddPlaylistDialog.tsx
│   │   ├── hooks/         # Playlist-specific hooks
│   │   │   └── usePlaylistActions.ts
│   │   └── pages/         # Playlist pages
│   │       ├── PlaylistsPage.tsx
│   │       └── PlaylistViewPage.tsx
│   ├── downloads/         # Downloads feature
│   │   ├── components/    # Download components
│   │   │   ├── DownloadList.tsx
│   │   │   └── DownloadItem.tsx
│   │   ├── hooks/         # Download-specific hooks
│   │   │   └── useDownloadManager.ts
│   │   └── pages/         # Download pages
│   │       └── DownloadsPage.tsx
│   ├── history/           # History feature
│   │   ├── components/    # History components
│   │   │   ├── HistoryList.tsx
│   │   │   └── HistoryItem.tsx
│   │   ├── hooks/         # History-specific hooks
│   │   │   └── useHistory.ts
│   │   └── pages/         # History pages
│   │       └── HistoryPage.tsx
│   └── settings/          # Settings feature
│       ├── components/    # Settings components
│       │   ├── GeneralSettings.tsx
│       │   ├── DownloadSettings.tsx
│       │   └── AdvancedSettings.tsx
│       ├── hooks/         # Settings-specific hooks
│       │   └── useSettings.ts
│       └── pages/         # Settings pages
│           └── SettingsPage.tsx
├── utils/                 # Consolidated utilities
│   ├── formatting.ts      # Formatting utilities
│   ├── validation.ts      # Validation utilities
│   ├── storage.ts         # Storage utilities
│   ├── classNames.ts      # Class name utilities (replaces cn.ts and utils.ts)
│   └── helpers.ts         # General helper functions
├── services/              # Shared services
│   ├── api.ts             # API service
│   ├── notification.ts    # Notification service
│   └── query/             # React Query related
│       ├── hooks.ts       # Query hooks
│       └── keys.ts        # Query keys
├── hooks/                 # Shared hooks
│   ├── useLocalStorage.ts # Local storage hook
│   └── useMediaQuery.ts   # Media query hook
├── routes/                # Routing
│   └── routes.ts          # Route definitions
└── styles/                # Styling
    └── global.css         # Global styles
```

## Shared Code Structure (Unchanged)

```
src/shared/
├── constants/
│   └── appConstants.ts    # Application constants
└── types/
    └── appTypes.ts        # TypeScript type definitions
```

## Key Improvements

1. **Feature-Based Organization**:
   - Each major feature (dashboard, playlists, downloads, history, settings) has its own folder
   - Each feature folder contains components, hooks, and pages specific to that feature
   - Clear separation between features makes the codebase more maintainable

2. **Consolidated Utilities**:
   - All utility functions are in a single `utils` folder
   - Utilities are organized by purpose (formatting, validation, etc.)
   - No more confusion about where to find utility functions

3. **Clearer Component Organization**:
   - Shared UI components are in `components/ui`
   - Layout components are in `components/layout`
   - Other shared components are in `components/common`
   - Feature-specific components are in their respective feature folders

4. **Consistent Naming**:
   - All component files use PascalCase
   - All utility files use camelCase
   - Clear naming patterns make it easier to navigate the codebase

5. **Improved Discoverability**:
   - Related code is grouped together
   - Clear folder structure makes it easier to find code
   - New developers can quickly understand the codebase organization

## Implementation Strategy

The reorganization will be implemented in phases:

1. **Create the new folder structure**
2. **Move files to their new locations**
3. **Update import paths**
4. **Update webpack and tsconfig configuration**
5. **Test the application to ensure everything works**

This approach minimizes the risk of breaking changes and allows for incremental improvements.

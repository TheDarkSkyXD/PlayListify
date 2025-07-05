# Project File Structure

This document defines the definitive file and folder structure for the Playlistify application. This structure is derived from the specifications outlined in `project.md` and is designed to create a clear separation of concerns between the backend (Main Process), frontend (Renderer Process), and shared code.

## High-Level Directory Tree

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
│   │   │   └── globals.css
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

## Directory Descriptions

*   **`src/backend`**: Contains all backend logic for the Electron Main Process. This code runs in Node.js and has full access to the operating system, filesystem, and database.
    *   **`ipc/`**: Holds all Inter-Process Communication handlers, acting as the bridge between the frontend and backend.
    *   **`database/`**: Contains the database schema (`schema.sql`), the `SQLiteAdapter`, and all data query files.
    *   **`services/`**: Contains the core business logic of the application, such as downloading, playlist management, and settings.

*   **`src/frontend`**: Contains all frontend UI code for the Electron Renderer Process. This code runs in a sandboxed Chromium window and is responsible for everything the user sees and interacts with.
    *   **`components/`**: Contains reusable React components, organized by feature (e.g., `Modals`, `PlaylistGrid`) and a `ui` sub-directory for generic components (e.g., `Button`).
    *   **`pages/`**: Contains top-level components that represent a full page or view (e.g., `Dashboard.tsx`, `Settings.tsx`).
    *   **`store/`**: Contains global state management stores (using Zustand).
    *   **`hooks/`**: For custom React hooks used across the application.
    *   **`styles/`**: For global CSS and Tailwind configuration.

*   **`src/shared`**: A crucial directory for holding TypeScript types, interfaces, and constants that are used by *both* the backend and frontend to ensure type-safe communication and consistency.

*   **`assets/`**: Contains static assets like icons and images used during the build process for installers and application branding.

*   **`public/`**: Contains static files that will be copied to the build directory as-is.

*   **`docs/`**: Contains all project documentation, including specifications, architecture, and user guides.
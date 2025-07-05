# Synthesis: An Integrated Model for the Playlistify Application

This document presents a cohesive architectural model for the Playlistify application, synthesizing the key findings from all three research arcs: Local Media Library Management, Robust Video Downloading, and Secure API Integration.

## Core Architectural Principles

1.  **Decoupled & Database-Driven:** The application's architecture is fundamentally database-driven. The SQLite database is the single source of truth for all metadata, state, and relationships. The file system is treated as a simple, content-addressable blob store, completely decoupled from the application's logical data structure.
2.  **Secure by Default:** The architecture prioritizes security by embracing modern Electron patterns. It establishes a hard boundary between the privileged main process and the unprivileged renderer process, communicating only through a strictly-defined, type-safe API exposed via the Context Bridge. All sensitive data is encrypted at rest using the operating system's native credential vault.
3.  **Optimized for Common Operations:** Design choices are optimized for the most frequent user actions (reading/querying data) while providing robust, transactional integrity for less frequent but critical write operations (importing/downloading).

## The Integrated Model

### 1. The Backend (Main Process)

The backend is the core of the application, responsible for all business logic, data persistence, and interaction with external services.

*   **Data Layer (`better-sqlite3`):**
    *   A single SQLite database file manages all application metadata (playlists, videos, settings, download queue).
    *   The schema uses a junction table (`playlist_videos`) to manage the many-to-many relationship between playlists and videos.
    *   The database connection is always initialized with `PRAGMA foreign_keys = ON;`.
    *   A dedicated migration library (e.g., `node-pg-migrate`) manages all schema changes automatically on application startup.

*   **Services Layer:**
    *   **`PlaylistService`:** Manages all CRUD operations for playlists and videos, wrapping bulk operations in database transactions for performance.
    *   **`DownloadService`:** Orchestrates the download process. It uses `p-queue` to manage a priority-based download queue and executes `yt-dlp` via `yt-dlp-wrap` for the actual downloading and metadata embedding.
    *   **`SettingsService`:** Manages user settings via `electron-store`. It uses Electron's `safeStorage` API to encrypt and decrypt any sensitive data (like OAuth tokens) before storing it.
    *   **`AuthService`:** Handles the OAuth 2.0 flow for authenticating with the YouTube API.

*   **IPC Layer:**
    *   A secure API is exposed to the renderer process via the `preload.ts` script and `contextBridge`. This API is strictly typed and does not expose any Node.js or Electron primitives.
    *   All incoming requests from the renderer are handled by dedicated IPC handlers that call the appropriate service methods.

### 2. The Frontend (Renderer Process)

The frontend is responsible for the user interface and user interaction.

*   **UI Layer (`React`):** A standard React application for rendering the UI components.
*   **State Management (`React Query` & `Zustand`):**
    *   `React Query` is the primary mechanism for fetching, caching, and synchronizing server state from the backend. It handles loading, error, and success states for all data-related operations.
    *   `Zustand` is used for managing purely client-side UI state that does not need to be persisted (e.g., the state of a modal dialog).
*   **Communication:** The frontend communicates with the backend exclusively through the `window.electronAPI` object exposed by the preload script. It has no direct access to `ipcRenderer` or the file system.

### 3. The File System

*   **Application Data:** The SQLite database file, `electron-store` settings file, and logs are stored in the user's application data directory (`app.getPath('userData')`).
*   **Media Storage:** Downloaded media files are stored in a user-configurable location. Within this location, a performance-optimized, hashed directory structure (e.g., `.../media/d7/f5/`) is used for the physical storage of files, preventing file system bottlenecks. The database maps the logical playlist structure to these physical file paths.
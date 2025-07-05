# Synthesis: Practical Applications and Development Tasks

This document translates the key research insights into a checklist of practical, actionable tasks for the development team.

## Arc 1: Local Media Library Management

*   **Task 1: Implement the Core Database Schema.**
    *   [ ] Create the initial SQL schema file with `CREATE TABLE` statements for `playlists`, `videos`, and the `playlist_videos` junction table.
    *   [ ] The schema must include all relevant fields identified in the research (e.g., `position` in `playlist_videos`, `download_path` in `videos`).
    *   [ ] Ensure all foreign key relationships are explicitly defined.

*   **Task 2: Set Up the Database Migration System.**
    *   [ ] Choose and install a dedicated Node.js migration library (e.g., `node-pg-migrate`, `knex`).
    *   [ ] Create the first migration file, which will contain the schema from Task 1.
    *   [ ] Write a function in the main process that automatically runs any pending migrations on application startup.

*   **Task 3: Enforce Database Best Practices.**
    *   [ ] In the database connection utility, ensure `PRAGMA foreign_keys = ON;` is executed immediately after every connection is opened.
    *   [ ] Create a `db.transaction()` wrapper for all application logic that performs multiple database writes in a single operation (e.g., `importPlaylist`, `downloadVideos`).
    *   [ ] Add the recommended indexes to the database schema to optimize common queries.

*   **Task 4: Implement the File Storage System.**
    *   [ ] Create a utility function to sanitize playlist titles for use as directory names.
    *   [ ] Implement the hashed directory storage mechanism for all downloaded media files.
    *   [ ] Ensure the `videos` table in the database correctly stores the full, internal path to the downloaded file.

## Arc 2: Robust Video Downloading and Conversion

*   **Task 5: Implement the `yt-dlp` Wrapper Service.**
    *   [ ] Create a service that can execute `yt-dlp` commands using `yt-dlp-wrap`.
    *   [ ] Implement a function to fetch video/playlist metadata using the `--dump-json` command.
    *   [ ] Implement the core download function using the recommended format selection and metadata embedding flags.
    *   [ ] Add robust error handling to differentiate between network errors, unavailable videos, and other `yt-dlp` failures.

*   **Task 6: Build the Download Manager.**
    *   [ ] Initialize a `p-queue` instance with a user-configurable concurrency setting.
    *   [ ] Implement the database-backed persistent queue. On startup, load any unfinished downloads from the DB into the queue.
    *   [ ] Implement the priority system for user-initiated vs. background tasks.
    *   [ ] Expose methods for pausing, resuming, and clearing the queue via the secure IPC channel.

## Arc 3: Secure API Integration & Settings

*   **Task 7: Implement the Secure Settings Service.**
    *   [ ] In the `SettingsService`, create distinct methods for handling sensitive vs. non-sensitive data.
    *   [ ] All calls to set or get sensitive data (e.g., `setAuthToken`) must use the `safeStorage` API for encryption/decryption.
    *   [ ] Ensure the application checks `safeStorage.isEncryptionAvailable()` and handles potential errors gracefully.

*   **Task 8: Implement the Secure IPC Bridge.**
    *   [ ] Define a clear, comprehensive TypeScript interface for the entire API that will be exposed to the renderer.
    *   [ ] Implement the `preload.ts` script using `contextBridge` to expose only the functions defined in the API interface.
    *   [ ] Add a `renderer.d.ts` file to provide type safety for the `window.electronAPI` object in the frontend codebase.
# High-Level Design for Playlistify

This document outlines the high-level architecture for the Playlistify application, a desktop-first, offline-capable tool for managing and downloading YouTube playlists.

## Architectural Pattern: Layered Architecture

The backend of Playlistify adopts a classic **Layered Architecture** (also known as N-Tier architecture). This pattern promotes separation of concerns, making the system more maintainable, testable, and scalable.

The layers are organized as follows:

1.  **Services Layer:** The topmost layer, responsible for orchestrating business logic and workflows. It does not directly interact with the database or external libraries.
2.  **Repositories Layer:** This layer provides a clean, object-oriented API for accessing and manipulating data models. It abstracts away the underlying database implementation.
3.  **Adapters Layer:** The lowest layer, responsible for wrapping and isolating external dependencies, such as the database driver (`better-sqlite3`) and the YouTube downloader (`yt-dlp-wrap`).

This strict, one-way dependency flow (Services -> Repositories -> Adapters) ensures that changes in a lower layer (e.g., swapping the database) have minimal impact on the layers above.

## Core Components and Responsibilities

### Backend Components

*   **`main.ts` (Backend Entry Point):**
    *   Initializes all services, repositories, and adapters.
    *   Sets up Electron IPC listeners to handle requests from the frontend.
    *   Manages the application's lifecycle.

*   **`SQLiteAdapter`:**
    *   A robust wrapper around the `better-sqlite3` library, designed to prevent UI blocking.
    *   **Traceability:** Fulfills `NFR-1` (Performance) and `NFR-2` (Responsiveness).
    *   Manages the database connection lifecycle.
    *   Executes raw SQL queries and applies schema migrations by delegating them to a dedicated worker thread. This ensures that synchronous, potentially long-running database operations do not block the main Electron event loop.
    *   Manages a pool of worker threads for executing queries, ensuring the main event loop remains free.
    *   Implements retry logic for transient connection errors.
    *   Ensures all state-modifying operations are transactional.

*   **`PlaylistRepository`:**
    *   Handles all CRUD (Create, Read, Update, Delete) operations for the `Playlist` data model.
    *   Provides methods like `createPlaylist`, `getPlaylist`, and `getAllPlaylists`.
    *   Interacts exclusively with the `SQLiteAdapter`.

*   **`VideoRepository`:**
    *   Handles all CRUD operations for the `Video` data model.
    *   Provides methods to manage videos within playlists.
    *   Interacts exclusively with the `SQLiteAdapter`.

*   **`BackgroundTaskRepository`:**
    *   Manages the persistence of background tasks (e.g., video downloads, health checks).
    *   Handles CRUD operations for the `BackgroundTask` model.
    *   Works in concert with the `BackgroundTaskService` to track task status, progress, and logs.

*   **`PlaylistManager`:**
    *   Contains the core business logic for playlist management.
    *   **Traceability:** Fulfills `US-1` (Import Playlist), `US-3` (Manage Playlist).
    *   Orchestrates operations by using `PlaylistRepository` and `VideoRepository`.
    *   Handles complex workflows like importing a full playlist from YouTube, which involves fetching metadata via the `VideoSource` interface and creating multiple video entries.

*   **`VideoSource` (Interface):**
    *   An abstraction that defines a strict contract for fetching metadata from a video source. This decouples the application from any single dependency. See `ADR-003-yt-dlp-risk-mitigation.md`.
    *   **Traceability:** Fulfills `FR-1` (Fetch Metadata) and `NFR-5` (Extensibility).
    *   Defines methods for fetching playlist and video metadata, including batch operations.

*   **`YoutubeService` (Implementation of `VideoSource`):**
    *   A concrete implementation of the `VideoSource` interface that wraps the `yt-dlp-wrap` library.
    *   Provides a clean API for fetching metadata for YouTube playlists and videos.
    *   Abstracts away the command-line interface of `yt-dlp`.
    *   Implements efficient batch operations for fetching data for all videos in a playlist at once.

*   **`VideoDownloader`:**
    *   Manages the entire video download process.
    *   **Traceability:** Fulfills `US-2` (Download Video), `FR-2` (Manage Downloads).
    *   When a download is requested, it creates a `BackgroundTask` via the `BackgroundTaskRepository`.
    *   Uses `p-queue` to manage a low-concurrency queue for the actual download operations, preventing resource exhaustion.
    *   Handles quality selection, fallbacks, and post-processing.

*   **`HealthCheckService`:**
    *   Performs periodic checks to verify that downloaded videos are still available and not private/deleted on YouTube.
    *   **Traceability:** Fulfills `US-4` (Check Video Health), `NFR-3` (Data Integrity).
    *   Creates background tasks to perform these checks without blocking the UI, using the `VideoSource` interface to re-fetch metadata.

### Frontend Components

*   **`index.ts` (Frontend Entry Point):**
    *   Renders the main React application.
    *   Initializes frontend services.

*   **UI Components:**
    *   A set of React components for displaying playlists, video lists, download progress, and settings.

*   **Frontend Services (`ipcService`):**
    *   A service that abstracts the Electron IPC communication. It provides strongly-typed methods for sending requests to the backend (e.g., `downloadVideo(videoId)`) and subscribing to events from the backend (e.g., `onTaskProgressUpdate`).

### Shared Components

*   **Data Models (`shared/`):**
    *   TypeScript interfaces (`Playlist`, `Video`, `BackgroundTask`) that define the shape of data used throughout the application. Sharing these between the frontend and backend ensures type safety across the IPC boundary.
*   **IPC Contract (`shared/`):**
    *   Defines the channel names and payload types for all IPC communication, creating a strict contract that prevents integration errors.

## Data Flows

### Flow 1: Importing a YouTube Playlist

1.  **User** pastes a YouTube playlist URL into the frontend UI. (`US-1`)
2.  **Frontend** sends an `import-playlist` IPC message with the URL to the backend.
3.  **`PlaylistManager`** receives the request.
4.  It calls the **`VideoSource`** implementation (currently `YoutubeService`) to fetch the playlist metadata and the metadata for *all videos in the playlist* in a single, efficient batch operation. This minimizes network requests and API calls. (`FR-1`, `NFR-1`)
5.  The **`YoutubeService`** uses the **`yt-dlp-wrap`** adapter to get the complete data from YouTube.
6.  **`PlaylistManager`** uses **`PlaylistRepository`** and **`VideoRepository`** to create the new playlist and all associated video records in the SQLite database within a single transaction. (`NFR-3`)
7.  The backend notifies the **Frontend** of completion, and the UI updates to show the new playlist.

### Flow 2: Downloading a Video

1.  **User** clicks the "Download" button for a video in the UI.
2.  **Frontend** sends a `download-video` IPC message with the `videoId`.
3.  **`VideoDownloader`** service receives the request.
4.  It creates a new `BackgroundTask` record in the database via **`BackgroundTaskRepository`** with a `pending` status.
5.  The **`BackgroundTaskService`** (driven by `p-queue`) picks up the task from its queue.
6.  It executes the download logic using **`yt-dlp-wrap`**, providing progress updates.
7.  As the download progresses, the service calls **`BackgroundTaskRepository.updateTaskProgress()`**, which emits an IPC event to the frontend.
8.  **Frontend** receives the progress update and visually updates the UI (e.g., a progress bar).
9.  Upon completion, the task status is updated to `completed` or `failed`, and the **`VideoRepository`** is updated with the local file path of the downloaded video.
# High-Level Design

This document provides a high-level overview of the Playlistify application's architecture, its core components, and how they interact.

## 1. Architectural Pattern

The Playlistify application employs a hybrid architectural pattern based on Electron's two-process model:

*   **Backend (Main Process):** A **Layered Architecture** is used to separate concerns. This promotes modularity and testability.
    *   **IPC Layer:** The outermost layer, responsible for receiving requests from the frontend and sending events.
    *   **Service Layer:** Contains the core business logic of the application (e.g., `PlaylistService`, `DownloadService`). It orchestrates operations by coordinating repositories and other services.
    *   **Repository Layer (DAL):** The Data Access Layer, responsible for all database interactions via the `SQLiteAdapter`. It abstracts SQL queries from the business logic.
*   **Frontend (Renderer Process):** A **Component-Based Architecture** is used, built with React. The UI is composed of modular, reusable components.

## 2. Core Components

### Backend (Main Process)

This is the entry point of the application running in a Node.js environment.

**Responsibilities:**
-   **Window Management:** Creating and managing the application's renderer windows.
-   **IPC Handling:** Exposing backend functionality to the frontend securely via the **Typed IPC Contract**.
-   **Business Logic:** Executing core application logic within the **Service Layer**.
-   **Data Persistence:** Managing the SQLite database through the **Repository Layer**.
-   **Task Coordination:** Managing long-running background tasks (downloads, imports) using `p-queue`.
-   **Native OS Interaction:** Handling file system access, dialogs, and other OS-level interactions.
-   **Logging:** Capturing application-wide logs using `winston`.

### Frontend (Renderer Process)

This is the UI running in a sandboxed Chromium environment.

**Responsibilities:**
-   **UI Rendering:** Rendering the UI using React and styling with Tailwind CSS.
-   **State Management:**
    -   **Server Cache:** Using `@tanstack/react-query` to manage the state of data fetched from the backend.
    -   **Global UI State:** Using `zustand` for shared, client-side state (e.g., player status, modal visibility).
-   **Routing:** Managing navigation with `@tanstack/react-router`.
-   **User Interaction:** Handling all user input and invoking backend services via the IPC contract.

## 3. Component Interactions & Data Flow

### The Typed IPC Contract

All communication between the Frontend and Backend is governed by a strict, shared TypeScript interface defined in [`src/shared/ipc-contract.ts`](src/shared/ipc-contract.ts). This is a critical architectural choice that provides:
- **Type Safety:** Prevents entire classes of bugs related to mismatched channel names or data payloads.
- **Discoverability:** Acts as a single source of truth for all available backend APIs.
- **Testability:** Allows for easy mocking of the backend API during frontend testing and vice-versa.

**Example Data Flow: Importing a Playlist**
1.  **UI Interaction:** User pastes a URL into the `AddNewPlaylistDialog` component.
2.  **Frontend IPC Call:** The component calls `window.api.playlists.importFromUrl(url)`. This is a type-safe function exposed via the preload script.
3.  **Backend IPC Handler:** The `playlist:import` handler in the `ipc/playlistHandlers.ts` file receives the request.
4.  **Service Layer:** The handler calls the `playlistImportService.ts`.
5.  **Task Management:** The service creates a new task in the `BackgroundTaskService` and adds a job to the `p-queue`.
6.  **External Tool:** The job in the queue calls the `ytDlpService` which spawns `yt-dlp` to fetch metadata.
7.  **Repository Layer:** The service uses the `PlaylistRepository` and `VideoRepository` to save the new data to the database.
8.  **Backend Event:** The `BackgroundTaskService` emits progress updates via the `task:update` IPC channel.
9.  **Frontend Update:** The `ActivityCenter` component listens for `task:update` events and updates the UI in real-time.

## 4. Resilience and Chaos Engineering

### Resilience Patterns

-   **Circuit Breaker:** For all external API calls (e.g., fetching YouTube metadata), a simple circuit breaker will be implemented. If an API fails repeatedly, the circuit will "open" for a short period, and subsequent calls will fail immediately without hitting the network, preventing the application from getting stuck on a failing resource.
-   **Stateful Retries:** Network-related failures during downloads will trigger a limited number of automatic retries with **exponential backoff**.
-   **Concurrent Task Queuing:** The `p-queue` library limits concurrent downloads, preventing resource exhaustion.
-   **Graceful Degradation:** If a video in a playlist fails to process, it will be marked as "failed" in the UI, but the rest of the playlist will remain functional.
-   **Disk Full Handling:** The `DownloadService` will check for sufficient disk space before starting a download and will gracefully pause the task with a user notification if the disk becomes full.
-   **Process Timeouts:** All child processes (`yt-dlp`, `ffmpeg`) will be spawned with a strict timeout. If a process hangs, it will be terminated, and the task will be marked as failed.

### Chaos Engineering Plan

-   **Hypothesis 1 (Hanging Process):** If `yt-dlp` hangs, the `DownloadService`'s timeout mechanism should trigger, kill the orphaned process, and mark the task as failed without crashing the main process.
    -   **Experiment:** Use a wrapper script for `yt-dlp` that enters an infinite loop. Attempt a download and verify the task fails gracefully after the timeout.
-   **Hypothesis 2 (Database Corruption):** If the SQLite database file becomes corrupted or is unreadable, the application should start up in a degraded mode, notify the user, and offer to restore from a backup or create a new database.
    -   **Experiment:** Replace the `database.sqlite` file with a zero-byte or garbage file. On startup, verify the application doesn't crash and presents the user with recovery options.
-   **Hypothesis 3 (Network Interruption):** If network connectivity is lost during a download, the retry mechanism should engage.
    -   **Experiment:** Use a tool to block network access for the application mid-download. Verify that the task pauses and retries according to the backoff strategy once connectivity is restored.

## 5. Dependency Management

To create a stable and predictable environment, critical external binary dependencies (`yt-dlp`, `ffmpeg`) will not be reliant on the user's system. Instead, specific, tested versions of these tools will be packaged and shipped directly with the application. The application will be configured to use these bundled binaries exclusively. See `ADR-002-packaged-dependencies.md` for details.
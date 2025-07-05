# Technology Stack

This document outlines the key technologies, libraries, and frameworks chosen for the Playlistify application, along with the justification for each choice.

## Core Framework

*   **Technology:** **Electron.js**
*   **Justification:** Electron is the premier framework for building cross-platform desktop applications using web technologies (JavaScript, HTML, CSS). It allows us to deliver a native-like experience on Windows, macOS, and Linux from a single codebase, which is a primary requirement for Playlistify. Its maturity, large community, and rich feature set (e.g., native OS integrations, IPC) make it the ideal choice.

## Backend

*   **Technology:** **Node.js**
*   **Justification:** Node.js is the runtime environment for the Electron main process. Its event-driven, non-blocking I/O model is well-suited for handling concurrent operations like file downloads and IPC communication without freezing the application.

*   **Technology:** **TypeScript**
*   **Justification:** TypeScript is used for both the backend and frontend. Its static typing system is invaluable for building a large, complex application. It helps catch errors at compile time, improves code quality and maintainability, and enables features like autocompletion and refactoring in IDEs. The use of shared types across the IPC boundary is a key benefit for ensuring robust communication between the frontend and backend.

## Frontend

*   **Technology:** **React**
*   **Justification:** React is a declarative, component-based library for building user interfaces. Its popularity, performance (thanks to the virtual DOM), and vast ecosystem of tools and libraries make it a productive choice. The component model fits well with the modular UI requirements of Playlistify, allowing us to create reusable UI elements for playlists, video items, and progress indicators.

## Database

*   **Technology:** **SQLite (via `better-sqlite3`)**
*   **Justification:** SQLite is a perfect fit for a local-first, offline-capable desktop application.
    *   **Serverless:** It runs within the application process, requiring no separate server installation or configuration, which simplifies the user experience.
    *   **File-based:** The entire database is a single file, making it portable and easy to back up.
    *   **Transactional:** It supports ACID-compliant transactions, which is critical for ensuring data integrity during complex operations like importing a playlist.
    *   **`better-sqlite3`:** This specific library is chosen for its performance and direct, synchronous API. While the synchronous nature can be a risk, we mitigate this by offloading all database operations to a separate worker thread.
*   **Performance Risk Mitigation:** The synchronous, blocking nature of `better-sqlite3` poses a risk of freezing the main UI thread if a query is slow. To mitigate this, the `SQLiteAdapter` will not execute queries directly on the main thread. Instead, it will manage a dedicated worker thread (using Node.js `worker_threads`). All database calls from the main process are passed to this worker, which executes the synchronous `better-sqlite3` operation and returns the result asynchronously. This strategy isolates the blocking I/O from the event loop, ensuring the application UI remains fully responsive at all times, thereby upholding `NFR-1` and `NFR-2`.

## Task & Concurrency Management

*   **Technology:** **`p-queue`**
*   **Justification:** Resource-intensive operations like downloading videos must be managed carefully to avoid overwhelming the user's system and network. `p-queue` is a lightweight, promise-based task queue that allows us to easily limit concurrency. We can configure it to only allow a small number of downloads (e.g., 2-3) to run simultaneously, ensuring the application remains responsive.

## External Dependencies

*   **Technology:** **`yt-dlp-wrap`**
*   **Justification:** `yt-dlp` is a powerful command-line tool for downloading videos and fetching metadata from YouTube and other sites. `yt-dlp-wrap` provides a convenient Node.js wrapper around this tool. This approach is chosen because:
    *   **No API Key Required:** It does not require a formal YouTube Data API key, which has strict quotas and requires a complex setup process. This aligns with the goal of making the application easy for users to set up and run.
    *   **Rich Metadata:** It can extract detailed metadata, including video quality options, which is a core requirement.
    *   **Actively Maintained:** `yt-dlp` is actively maintained and frequently updated to keep pace with changes on YouTube.

## Testing

*   **Technology:** **Jest**
*   **Justification:** Jest is a popular, all-in-one testing framework. It provides a test runner, assertion library, and mocking capabilities out of the box. Its "zero-config" philosophy and powerful features like snapshot testing make it an excellent choice for both **unit** and **integration** testing of our backend services and repositories.

*   **Technology:** **Playwright**
*   **Justification:** Playwright is a modern, powerful framework for end-to-end (E2E) testing. It can drive a real instance of our packaged Electron application, simulating user interactions like clicking buttons and entering text. This allows us to write tests that verify complete user workflows from the UI down to the database, ensuring all parts of the system are correctly integrated. Its ability to auto-wait and its rich debugging tools make E2E testing more reliable and less flaky.
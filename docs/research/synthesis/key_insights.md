# Synthesis: Key Research Insights

This document summarizes the most critical, high-level insights derived from the comprehensive research process. These insights should serve as guiding principles during the application's specification and development phases.

1.  **SQLite is the Bedrock, But Requires Configuration.**
    *   **Insight:** SQLite is the correct choice for the application's data layer due to its performance and portability. However, its default settings are not optimal.
    *   **Actionable Advice:** To ensure data integrity and performance, developers must *always* enable foreign key constraints (`PRAGMA foreign_keys = ON;`) and wrap all bulk write operations in transactions (`db.transaction()`). These are not optional tweaks; they are fundamental requirements for a robust application.

2.  **Decouple Logical Data from Physical Files.**
    *   **Insight:** The most scalable and maintainable architecture is one that separates the *metadata about files* from the *files themselves*.
    *   **Actionable Advice:** The SQLite database should be the single source of truth for all metadata. The file system should be treated as a dumb but performant blob store, using a hashed directory structure to prevent bottlenecks. Do not rely on file or folder names for application logic.

3.  **Security is an Architectural Choice, Not an Add-on.**
    *   **Insight:** Modern Electron security is built on the principle of least privilege, enforced by the Context Bridge.
    *   **Actionable Advice:** Never expose Node.js or Electron modules directly to the renderer process. All communication must flow through a well-defined, type-safe API exposed via `contextBridge` in a `preload` script. All sensitive data, without exception, must be encrypted using the OS-native `safeStorage` API before being persisted.

4.  **Leverage Specialized Tools for Specialized Jobs.**
    *   **Insight:** The core technologies chosen for this project (`better-sqlite3`, `yt-dlp`) are powerful because they are focused. They do not try to solve every problem.
    *   **Actionable Advice:** Embrace this philosophy by using other specialized tools to fill the gaps. Use a dedicated migration library to handle schema changes. Use a dedicated queue library (`p-queue`) to manage concurrency. Do not try to reinvent these complex components.

5.  **Anticipate and Manage External Dependencies.**
    *   **Insight:** Key functionality, like embedding thumbnails, depends on external command-line tools (`ffmpeg`, `mutagen`, `AtomicParsley`) being available in the application's environment.
    *   **Actionable Advice:** The application's startup process must include robust checks to verify the existence and correct configuration of these external dependencies. The download process must be designed to handle their absence gracefully (e.g., by skipping a step and logging a warning rather than crashing).
# Playlistify: Constraints and Anti-Goals

## 1. Constraints
*   **Technological Constraints:**
    *   Must use Electron v28.2.8 for cross-platform compatibility.
    *   Must use React v18.2.0, TypeScript v5.0, and Shadcns UI v0.8.0 for UI development.
    *   Must use yt-dlp-wrap v0.2.1 for YouTube video downloading.
    *   Must use ffmpeg v6.1.1 for video encoding.
    *   Must use better-sqlite3 v9.4.3 for database management.
    *   Use a current version of Electron.
    *   Evaluate dependencies and choose trusted 3rd-party libraries.
    *   Use patch-package for dependency patching.
*   **UI/UX Constraints:**
    *   Importing a playlist: The user can initiate the import process in 3 clicks or less from the main screen.
    *   Downloading a video: The user can start a download in 2 clicks or less, and clear progress information is displayed during the download.
    *   Managing custom playlists: All playlist actions (add, delete, edit) are accessible through a context menu with a single click.

## 2. Risks and Mitigation Strategies
*   **YouTube API Changes:**
    *   Implement a modular architecture to isolate YouTube-specific code.
    *   Prioritize automated testing to quickly detect and address breaking changes.
*   **Dependency Management:**
    *   Use a robust packaging solution (e.g., Electron Forge) to bundle dependencies.
*   **Performance:**
    *   Optimize code for efficient resource usage.
    *   Implement virtualized lists for large playlists.
    *   Offer configurable performance settings (e.g., download quality).

## 3. Anti-Goals
*   The application is not intended to bypass YouTube's terms of service or copyright restrictions.
*   The application is not intended to support downloading copyrighted material without proper authorization.
*   The application is not intended to be a general-purpose video editor or converter.
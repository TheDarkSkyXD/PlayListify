# Constraints & Anti-Goals

This document defines the key technical and product constraints the project must operate within and lists "anti-goals" to prevent scope creep and maintain focus. It is derived from the `Mutual_Understanding_Document.md`.

## 1. Key Constraints

*   **Offline First:** The application must be fully functional without an internet connection for all locally-stored content and data.
*   **No Google Account for MVP:** The Minimum Viable Product must not require Google authentication for any of its core features. All functionality must be available to a user who has not signed in.
*   **Intelligent Download Quality & Packaging:**
    *   The download quality options presented to the user must be dynamically determined based on the actual qualities available for the specific video or playlist.
    *   For playlists, the quality options shown should represent the highest quality available across all videos in that playlist.
    *   **Fallback Mechanism:** If a user selects a quality for a playlist download that a specific video does not support, the system must automatically download that video at the highest quality it *does* support.
    *   **Thumbnail Embedding:** All downloaded video files, regardless of format or quality (from 144p to 8K and beyond), must have their respective YouTube thumbnails embedded.
*   **Resource Management:** The application must utilize a managed, low-concurrency task queue for I/O-heavy operations like downloads to prevent system overload. It must be optimized for low CPU and memory usage when idle.
*   **Data Integrity:** All database operations that modify state must be transactional to prevent data corruption, particularly during asynchronous background tasks.

## 2. Anti-Goals (What We Are NOT Building for MVP)

To maintain focus on the core user value, the following are explicitly defined as **anti-goals** for the MVP:

*   **We are not building a cloud-syncing service.** All data is local to the user's machine. There will be no feature to sync playlists or settings between multiple computers.
*   **We are not building a social platform.** There will be no features for sharing playlists with other users, commenting, or any other social interaction.
*   **We are not building a video editing tool.** The application will provide playback, but no functionality for cutting, trimming, or altering video content.
*   **We are not building a generic file downloader.** The application's download capabilities are exclusively for the YouTube content it manages, not for arbitrary files from the web.
*   **We are not building a mobile app.** The focus is exclusively on a cross-platform desktop experience using Electron.
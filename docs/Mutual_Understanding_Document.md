# Playlistify: Mutual Understanding Document

This document establishes a clear, shared understanding of the "Playlistify" project's goals, scope, and constraints. It serves as the foundational agreement for all subsequent development work.

## 1. Project Vision

To be the definitive desktop tool for anyone serious about their YouTube collections, transforming the passive viewing experience into an actively managed, secure, and permanent personal library where users have complete sovereignty over their content.

## 2. Core Problem

Managing and preserving YouTube playlists is challenging. The native YouTube interface has limited organizational tools, and users constantly risk losing curated content when videos are deleted or set to private. Playlistify solves this by providing a powerful application to manage, archive, and locally access YouTube content, ensuring true ownership and preventing data loss.

## 3. Target Audience

*   **The Digital Archivist:** A user who is meticulous about creating a secure, permanent, and locally-controlled archive of YouTube content. Their primary motivation is to prevent the loss of valuable content that might be deleted or made private.
*   **The Convenience User:** A casual user whose main goal is to easily download playlists and videos for offline access. They are motivated by situations like travel, commuting, or living in areas with poor internet connectivity.

## 4. Key Features & Scope (MVP)

*   **Core Viewing & Management:**
    *   Import public YouTube playlists via URL.
    *   Create, edit, and manage local "custom" playlists.
    *   View all videos within any playlist, with details like title, duration, and thumbnail.
    *   Search for videos by title within a selected playlist.
    *   Search across all playlists by video or playlist title.
    *   Duplicate an existing playlist.
    *   A dedicated 'History' page that shows a chronological list of all videos played within the app.

*   **Downloading & Offline Playback:**
    *   Download individual videos or entire playlists with selectable quality and format (MP4/MP3).
    *   An integrated video player for offline playback of downloaded content.
    *   A dedicated "Downloads" page to track the status of all downloads.

*   **Application Infrastructure:**
    *   A persistent background task system and an "Activity Center" UI to monitor the progress of imports and downloads.
    *   An automated "Playlist Health Check" to identify deleted or private videos in imported playlists, with user-configurable frequency.

## 5. Out of Scope (MVP)

*   **Google Account Integration:** The MVP will not require or allow users to log in with a Google account. Consequently, importing private/unlisted playlists, "Liked Videos," or "Watch Later" is out of scope.
*   **Advanced Organizational Features:** The initial release will not include playlist folders, a tagging system, or a "Trash Can" for restoring deleted items.
*   **Advanced UI/UX Features:** Online streaming (playing videos without downloading), multi-select batch actions, and advanced player controls (like playback speed) are not part of the MVP.

## 6. Core Technologies

*   **Platform & Bundling:**
    *   Electron
    *   Electron Forge
    *   Webpack

*   **Frontend & UI:**
    *   React & React-DOM
    *   TypeScript
    *   TailwindCSS
    *   shadcn/ui, lucide-react

*   **State Management & Data Fetching:**
    *   TanStack React Query
    *   Zustand
    *   TanStack React Router

*   **Backend & Services:**
    *   Node.js
    *   fs-extra (File System Utilities)
    *   better-sqlite3 (Database)
    *   Drizzle ORM (Database Interaction)
    *   Zod (Validation)
    *   Winston (Logging)
    *   electron-store (Persistent Settings)
    *   p-queue (Task Queuing)

*   **External Integrations & Media:**
    *   yt-dlp-wrap (YouTube Interaction)
    *   @rse/ffmpeg (Media Processing)
    *   React Player (Video Playback)
    *   axios (HTTP Client)
    *   googleapis (Google API Client)
    *   better-auth (Authentication Helper)

*   **Testing:**
    *   Jest
    *   ts-jest

## 7. Success Metrics (MVP)

*   **Core Functionality:** A user can successfully import a public YouTube playlist of at least 500 videos, and all video metadata is saved correctly to the local database without errors.
*   **Archiving:** A user can successfully download an entire 10-video playlist in 1080p MP4 format. All downloaded files are playable offline within the application, and all video files have their respective YouTube thumbnails embedded.
*   **Stability:** The application will run for a 72-hour session of mixed use (importing, downloading, playback) without crashing or requiring a restart.
*   **User Adoption:** Within the first month, at least 50% of users have created at least one custom playlist.

## 8. Key Constraints & Assumptions

*   **Offline First:** The application must be fully functional without an internet connection (for accessing already downloaded content).
*   **No Google Account for MVP:** All MVP features must work without requiring the user to authenticate with a Google account.
*   **Intelligent Download Quality & Packaging:**
    *   The download quality options presented to the user must be dynamically determined based on the actual qualities available.
    *   For single videos, the options will reflect what is available for that video.
    *   For playlists, the quality options shown should represent the highest quality available across all videos in that playlist.
    *   If a user selects a quality for a playlist download that a specific video does not support, the system must automatically download that video at the highest quality it *does* support.
    *   Thumbnail embedding must be supported for all video formats and qualities, from 144p up to 8K and beyond.
*   **Resource Management:** The application must use a managed task queue to avoid system overload during downloads and must be optimized for low CPU and memory usage when idle.
*   **Data Integrity:** The backend database operations must be transactional to prevent data corruption, especially during background processing, as recommended by the research report.
# Arc 1: Key Questions for Local Media Library Management

This research arc focuses on establishing a robust and scalable foundation for storing and managing user data, playlists, and downloaded media files locally.

1.  **Database Schema Design (`better-sqlite3`):**
    *   What is an optimal SQLite schema for managing playlists, videos, and their relationships (e.g., videos within a playlist)?
    *   How should the schema handle one-to-many and many-to-many relationships, such as a single video appearing in multiple user-created playlists?
    *   What data types are most efficient for storing YouTube-specific metadata (e.g., video IDs, durations, view counts, thumbnails)?
    *   What are the best practices for indexing tables in `better-sqlite3` to ensure fast queries, especially for filtering and sorting large playlists?
    *   How should the database schema accommodate tracking download status, file paths, and actual downloaded quality for each video?

2.  **File System Management (`fs-extra`):**
    *   What is a scalable and user-friendly directory structure for storing thousands of downloaded video and audio files?
    *   What are the performance and reliability trade-offs between storing media in a flat structure versus a nested structure (e.g., `Artist/Album/Track` or `PlaylistName/VideoTitle`)?
    *   How can the application reliably handle file and directory naming conflicts, especially with special characters common in video titles?
    *   What are robust strategies for managing thumbnail images associated with videos and playlists? Should they be stored alongside media files or in a separate cache directory?

3.  **Metadata Handling and Synchronization:**
    *   What is the most effective strategy for storing playlist and video metadata? Should it all reside in the SQLite database, within JSON sidecar files, or embedded directly into media file tags (e.g., ID3 tags for MP3s)?
    *   How should the application handle metadata updates for imported YouTube playlists? What is the best way to detect changes (e.g., new videos, removed videos, title changes) and synchronize the local state?
    *   What are the potential race conditions or data integrity issues when synchronizing metadata while a user is interacting with the local data, and how can they be mitigated?
# C4 Component Diagram for Playlistify

This document contains a C4-style component diagram that visualizes the major components of the Playlistify application, their relationships, and their interactions with external systems.

```mermaid
C4Component
    Person(User, "Application User")

    System_Ext(YouTube, "YouTube", "Provides video and playlist content")

    System_Boundary(PlaylistifyApp, "Playlistify Desktop Application") {
        Container(Frontend, "Frontend (React UI)", "Provides the user interface for managing playlists and downloads.")
        Container(Backend, "Backend (Node.js/Electron)", "Handles business logic, data persistence, and external service communication.")
    }

    System_Boundary(BackendBoundary, "Backend Components") {
        Component(Main, "Main Process", "main.ts", "Initializes the application and handles IPC communication.")
        Component(PlaylistManager, "Playlist Manager", "services/PlaylistManager.ts", "Orchestrates playlist and video operations.")
        Component(VideoDownloader, "Video Downloader", "services/VideoDownloader.ts", "Manages the video download queue and process.")
        Component(HealthChecker, "Health Check Service", "services/HealthCheckService.ts", "Verifies the availability of downloaded videos.")

        Component(YoutubeSvc, "YouTube Service", "services/YoutubeService.ts", "Wrapper for fetching YouTube metadata.")
        Component(YtdlpAdapter, "yt-dlp Adapter", "adapters/YtdlpWrapAdapter.ts", "Low-level wrapper for the yt-dlp CLI tool.")

        Component(PlaylistRepo, "Playlist Repository", "repositories/PlaylistRepository.ts", "Handles data access for playlists.")
        Component(VideoRepo, "Video Repository", "repositories/VideoRepository.ts", "Handles data access for videos.")
        Component(TaskRepo, "Background Task Repository", "repositories/BackgroundTaskRepository.ts", "Handles data access for background tasks.")
        Component(SqliteAdapter, "SQLite Adapter", "adapters/SQLiteAdapter.ts", "Manages the connection and execution of SQL queries.")
        ComponentDb(Database, "SQLite Database", "sqlite3", "Stores all application data (playlists, videos, tasks).")
    }

    ' Relationships
    Rel(User, Frontend, "Uses")

    Rel(Frontend, Main, "Sends IPC requests to", "Electron IPC")
    Rel(Main, Frontend, "Sends IPC events to", "Electron IPC")

    Rel(Main, PlaylistManager, "Delegates to")
    Rel(Main, VideoDownloader, "Delegates to")
    Rel(Main, HealthChecker, "Delegates to")

    Rel(PlaylistManager, PlaylistRepo, "Uses")
    Rel(PlaylistManager, VideoRepo, "Uses")
    Rel(PlaylistManager, YoutubeSvc, "Uses")

    Rel(VideoDownloader, TaskRepo, "Uses")
    Rel(VideoDownloader, YtdlpAdapter, "Uses")
    Rel(HealthChecker, VideoRepo, "Uses")
    Rel(HealthChecker, YoutubeSvc, "Uses")

    Rel(YoutubeSvc, YtdlpAdapter, "Uses")
    Rel(YtdlpAdapter, YouTube, "Makes API calls to", "HTTPS")

    Rel(PlaylistRepo, SqliteAdapter, "Uses")
    Rel(VideoRepo, SqliteAdapter, "Uses")
    Rel(TaskRepo, SqliteAdapter, "Uses")
    Rel(SqliteAdapter, Database, "Reads/Writes to")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
```

## Diagram Legend

*   **Person:** A user of the system.
*   **System_Ext:** An external system that Playlistify depends on (YouTube).
*   **System_Boundary:** A container for a group of related components.
*   **Container:** A deployable unit, like the frontend or backend.
*   **Component:** A logical grouping of code that represents a major functional area of the system (e.g., a service or repository).
*   **ComponentDb:** A database component.
*   **Rel:** Shows the relationship and data flow between two components.
# Data Models

This document defines the data models used in the Playlistify application. These models represent the structure of the data stored and manipulated by the application.

## User

*   **Description:** Represents a user account in the system.
*   **Properties:**
    *   `id`: `integer` - Unique identifier for the user.
    *   `username`: `string` - User's username.
        *   **Validation Rules:**
            *   Must be between 3 and 50 characters.
            *   Can only contain alphanumeric characters and underscores.
    *   `email`: `string` - User's email address.
        *   **Validation Rules:**
            *   Must be a valid email address format (e.g., `user@example.com`).
    *   `passwordHash`: `string` - Hashed password for secure authentication.
        *   **Validation Rules:**
            *   Must be at least 60 characters long (bcrypt hash).
    *   `createdAt`: `timestamp` - Timestamp of when the user account was created.
    *   `updatedAt`: `timestamp` - Timestamp of when the user account was last updated.

## Playlist

*   **Description:** Represents a playlist of videos.
*   **Properties:**
    *   `id`: `integer` - Unique identifier for the playlist.
    *   `userId`: `integer` - Foreign key referencing the user who owns the playlist.
    *   `title`: `string` - Title of the playlist.
        *   **Validation Rules:**
            *   Must be between 1 and 255 characters.
    *   `description`: `string` - Description of the playlist.
        *   **Validation Rules:**
            *   Must be between 0 and 1000 characters.
    *   `type`: `string` - Type of playlist (e.g., "YOUTUBE", "CUSTOM").
    *   `createdAt`: `timestamp` - Timestamp of when the playlist was created.
    *   `updatedAt`: `timestamp` - Timestamp of when the playlist was last updated.
    *   `lastHealthCheck`: `timestamp` - Timestamp of when the playlist was last checked for video availability.

## Video

*   **Description:** Represents a video.
*   **Properties:**
    *   `id`: `string` - Unique identifier for the video (e.g., YouTube video ID).
    *   `title`: `string` - Title of the video.
        *   **Validation Rules:**
            *   Must be between 1 and 255 characters.
    *   `channelName`: `string` - Name of the YouTube channel that published the video.
        *   **Validation Rules:**
            *   Must be between 1 and 255 characters.
    *   `duration`: `string` - Duration of the video.
        *   **Validation Rules:**
            *   Must be a valid duration format (e.g., "1:23", "0:45").
    *   `viewCount`: `integer` - Number of views the video has.
        *   **Validation Rules:**
            *   Must be a non-negative integer.
    *   `uploadDate`: `date` - Date when the video was uploaded.
    *   `thumbnailURL`: `string` - URL of the video's thumbnail image.
        *   **Validation Rules:**
            *   Must be a valid URL format.
    *   `availabilityStatus`: `string` - Status of the video's availability on YouTube (e.g., "LIVE", "DELETED", "PRIVATE").
        *   **Validation Rules:**
            *   Must be one of the allowed values: "LIVE", "PUBLIC", "PRIVATE", "DELETED".
    *   `downloadedQuality`: `string` - The actual video quality that was downloaded (e.g., "1080p", "720p").
    *   `downloadPath`: `string` - Path to the downloaded video file (if downloaded).
    *   `createdAt`: `timestamp` - Timestamp of when the video information was added to the database.
    *   `updatedAt`: `timestamp` - Timestamp of when the video information was last updated.

## PlaylistVideo

*   **Description:** Represents the relationship between playlists and videos (many-to-many relationship).
*   **Properties:**
    *   `playlistId`: `integer` - Foreign key referencing the playlist.
    *   `videoId`: `string` - Foreign key referencing the video.
        *   **Constraints:**
            *   Must reference a valid `id` in the `Video` table.
    *   `order`: `integer` - The order of the video within the playlist.

## BackgroundTask

*   **Description:** Represents a background task (e.g., importing a playlist, downloading videos).
*   **Properties:**
    *   `id`: `integer` - Unique identifier for the task.
    *   `type`: `string` - Type of task (e.g., "IMPORT_PLAYLIST", "DOWNLOAD_VIDEO").
        *   **Validation Rules:**
            *   Must be one of the allowed values: "IMPORT_PLAYLIST", "DOWNLOAD_VIDEO", "REFRESH_PLAYLIST".
    *   `status`: `string` - Status of the task (e.g., "QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED").
        *   **Validation Rules:**
            *   Must be one of the allowed values: "QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED".
    *   `progress`: `integer` - Progress of the task (0-100).
        *   **Validation Rules:**
            *   Must be an integer between 0 and 100.
    *   `targetId`: `string` - ID of the target entity (e.g., playlist ID, video ID).
    *   `parentId`: `integer` - ID of the parent task (if this is a subtask).
    *   `details`: `JSON` - Additional details about the task (e.g., download options).
    *   `createdAt`: `timestamp` - Timestamp of when the task was created.
    *   `updatedAt`: `timestamp` - Timestamp of when the task was last updated.
    *   `completedAt`: `timestamp` - Timestamp of when the task was completed.
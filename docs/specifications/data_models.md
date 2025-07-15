# Data Models

This document defines the core data models and database schema for the Playlistify application. These models provide a structured representation of the application's data, ensuring consistency across the backend, frontend, and database layers.

---

## 1. Database Schema (SQLite)

The following SQL statements define the tables used in the application's SQLite database.

### `playlists` Table

Stores information about each playlist, whether imported from YouTube or created by the user.

```sql
CREATE TABLE playlists (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('YOUTUBE', 'CUSTOM')),
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    youtube_id TEXT UNIQUE,
    video_count INTEGER NOT NULL DEFAULT 0,
    last_health_check_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `videos` Table

Stores information about each individual video.

```sql
CREATE TABLE videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    channel_name TEXT,
    duration INTEGER,
    thumbnail_url TEXT,
    view_count INTEGER,
    upload_date TEXT,
    youtube_id TEXT UNIQUE,
    download_status TEXT NOT NULL DEFAULT 'NOT_DOWNLOADED' CHECK(download_status IN ('NOT_DOWNLOADED', 'QUEUED', 'DOWNLOADING', 'COMPLETED', 'FAILED')),
    download_path TEXT,
    downloaded_at TIMESTAMP,
    availability_status TEXT NOT NULL DEFAULT 'UNCHECKED' CHECK(availability_status IN ('UNCHECKED', 'LIVE', 'DELETED', 'PRIVATE', 'UNLISTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `playlist_videos` Table

A junction table to manage the many-to-many relationship between playlists and videos.

```sql
CREATE TABLE playlist_videos (
    playlist_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, video_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);
```

### `background_tasks` Table

Stores the state of all long-running background tasks, such as imports and downloads.

```sql
CREATE TABLE background_tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('IMPORT', 'DOWNLOAD', 'HEALTH_CHECK')),
    status TEXT NOT NULL CHECK(status IN ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS')),
    progress REAL NOT NULL DEFAULT 0.0,
    target_id TEXT, -- e.g., playlistId for an import, videoId for a download
    parent_id TEXT,
    details TEXT, -- JSON blob for additional details
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES background_tasks(id) ON DELETE CASCADE
);
```

---

## 2. TypeScript Interfaces

These TypeScript interfaces are used throughout the application (in both backend and frontend) to ensure type safety and consistency with the database schema.

### `Playlist`

```typescript
export interface Playlist {
  id: string;
  type: 'YOUTUBE' | 'CUSTOM';
  title: string;
  description?: string;
  thumbnail_url?: string;
  youtube_id?: string;
  video_count: number;
  last_health_check_at?: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  videos?: Video[]; // Optional, for detailed views
}
```

### `Video`

```typescript
export type DownloadStatus = 'NOT_DOWNLOADED' | 'QUEUED' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';
export type AvailabilityStatus = 'UNCHECKED' | 'LIVE' | 'DELETED' | 'PRIVATE' | 'UNLISTED';

export interface Video {
  id: string;
  title: string;
  channel_name?: string;
  duration?: number; // in seconds
  thumbnail_url?: string;
  view_count?: number;
  upload_date?: string; // e.g., 'YYYY-MM-DD'
  youtube_id?: string;
  download_status: DownloadStatus;
  download_path?: string;
  downloaded_at?: string; // ISO 8601
  availability_status: AvailabilityStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

### `PlaylistVideo`

Represents the association in the `playlist_videos` junction table.

```typescript
export interface PlaylistVideo {
  playlist_id: string;
  video_id: string;
  position: number;
}
```

### `BackgroundTask`

```typescript
export type TaskType = 'IMPORT' | 'DOWNLOAD' | 'HEALTH_CHECK';
export type TaskStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'COMPLETED_WITH_ERRORS';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number; // 0.0 to 1.0
  target_id?: string;
  parent_id?: string;
  details?: Record<string, any>; // For storing task-specific info
  error_message?: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  completed_at?: string; // ISO 8601
}
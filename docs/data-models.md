### **Data Models**

### **Core Application Entities / Domain Objects**

These are the primary data structures used throughout the application, defined here as TypeScript interfaces.

#### **Playlist**
* **Description:** Represents a collection of videos, which can either be imported from YouTube or created custom by the user.
* **Schema / Interface Definition:**
    ```typescript
    export interface Playlist {
      id: string; // Unique identifier (UUID)
      type: 'YOUTUBE' | 'CUSTOM';
      title: string;
      description?: string;
      youtubeId?: string; // Original YouTube playlist ID, if type is 'YOUTUBE'
      thumbnailUrl?: string;
      lastHealthCheck?: string; // ISO 8601 timestamp
      createdAt: string; // ISO 8601 timestamp
    }
    ```
* **Validation Rules:** `title` is required and cannot be empty.

#### **Video**
* **Description:** Represents a single video, containing its metadata and status within the user's library.
* **Schema / Interface Definition:**
    ```typescript
    export interface Video {
      id: string; // Unique identifier (UUID)
      youtubeId: string; // Original YouTube video ID
      title: string;
      channelName: string;
      duration: number; // in seconds
      thumbnailUrl?: string;
      viewCount?: number;
      uploadDate?: string; // ISO 8601 timestamp
      availabilityStatus: 'LIVE' | 'DELETED' | 'PRIVATE' | 'UNLISTED' | 'UNCHECKED';
      downloadPath?: string; // Local file path if downloaded
      downloadQuality?: string; // e.g., '1080p'
      downloadedAt?: string; // ISO 8601 timestamp
    }
    ```
* **Validation Rules:** `youtubeId` and `title` are required.

#### **BackgroundTask**
* **Description:** Represents a long-running background task, such as an import or download.
* **Schema / Interface Definition:**
    ```typescript
    export interface BackgroundTask {
      id: string; // Unique identifier (UUID)
      type: 'IMPORT' | 'DOWNLOAD' | 'HEALTH_CHECK';
      status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS' | 'CANCELLED';
      progress: number; // 0-100
      message?: string; // e.g., "Downloading video 5 of 20" or error details
      targetId: string; // ID of the playlist or video this task relates to
      parentId?: string; // For parent/child task relationships
      createdAt: string; // ISO 8601 timestamp
      completedAt?: string; // ISO 8601 timestamp
    }
    ```

### **API Payload Schemas (If distinct)**

For now, most IPC API payloads will directly use the Core Application Entities or simple primitives (e.g., `{ url: string }`). Distinct Data Transfer Objects (DTOs) will be defined in `src/shared/ipc-contracts.ts` as they become necessary.

### **Database Schemas**

The following SQL statements define the tables for our `better-sqlite3` database.

#### **`playlists` table**
* **Purpose:** Stores all imported and custom playlists.
* **Schema Definition:**
    ```sql
    CREATE TABLE playlists (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- 'YOUTUBE' or 'CUSTOM'
      title TEXT NOT NULL,
      description TEXT,
      youtube_id TEXT UNIQUE,
      thumbnail_url TEXT,
      last_health_check TEXT,
      created_at TEXT NOT NULL
    );
    ```

#### **`videos` table**
* **Purpose:** Stores metadata for all unique videos across all playlists.
* **Schema Definition:**
    ```sql
    CREATE TABLE videos (
      id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      channel_name TEXT,
      duration INTEGER,
      thumbnail_url TEXT,
      view_count INTEGER,
      upload_date TEXT,
      availability_status TEXT NOT NULL DEFAULT 'UNCHECKED',
      download_path TEXT,
      download_quality TEXT,
      downloaded_at TEXT
    );
    ```

#### **`playlist_videos` table**
* **Purpose:** A junction table to manage the many-to-many relationship between playlists and videos.
* **Schema Definition:**
    ```sql
    CREATE TABLE playlist_videos (
      playlist_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      PRIMARY KEY (playlist_id, video_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    ```

#### **`background_tasks` table**
* **Purpose:** Stores the state of all background tasks for persistence.
* **Schema Definition:**
    ```sql
    CREATE TABLE background_tasks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      message TEXT,
      target_id TEXT,
      parent_id TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (parent_id) REFERENCES background_tasks(id) ON DELETE CASCADE
    );
    ```
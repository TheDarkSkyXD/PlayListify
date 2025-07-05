# Arc 1: Primary Findings - Database Schema Design

## Finding 1: The Junction Table Model for Many-to-Many Relationships

**Source(s):** SQLite Tutorial, Stack Overflow, Medium (Spotify Design)

**Key Insight:** The most robust and standard method for modeling the relationship between playlists and videos (where one video can exist in multiple playlists, and one playlist can contain multiple videos) is to use a **junction table**, also known as a linking or associative table.

**Paraphrased Summary:**
For a local-first YouTube media library, the database schema should be designed around three core tables to manage the many-to-many relationship effectively:

1.  **`playlists` Table:** This table will store unique information about each playlist.
    *   `playlist_id` (Primary Key)
    *   `name` (e.g., "Coding Music", "Workout Mix")
    *   `description`
    *   `source_url` (if imported from YouTube)
    *   `created_at`, `updated_at`

2.  **`videos` Table:** This table will store unique information about each video, ensuring that video data is not duplicated even if the video appears in multiple playlists.
    *   `video_id` (Primary Key)
    *   `youtube_id` (The unique ID from YouTube, e.g., `dQw4w9WgXcQ`)
    *   `title`
    *   `author`
    *   `duration` (in seconds)
    *   `thumbnail_url`
    *   `download_path` (local file path after download)
    *   `downloaded_quality`

3.  **`playlist_videos` (Junction Table):** This is the crucial table that connects the other two. Each row in this table represents a single video's inclusion in a single playlist.
    *   `playlist_id` (Foreign Key referencing `playlists.playlist_id`)
    *   `video_id` (Foreign Key referencing `videos.video_id`)
    *   `position` (An integer to maintain the specific order of videos within a playlist)
    *   `added_at`

This structure prevents data redundancy and provides a flexible and scalable way to manage complex relationships.

---

## Finding 2: SQLite Foreign Key Constraint Requirement

**Source(s):** Quackit SQLite Tutorial

**Key Insight:** SQLite does not enforce foreign key constraints by default. This is a critical implementation detail that must be addressed to ensure data integrity.

**Paraphrased Summary:**
To ensure the relationships defined by the foreign keys in the junction table (`playlist_videos`) are actually enforced (preventing orphaned records), every connection to the SQLite database must explicitly enable foreign key support. In `better-sqlite3`, this is typically done by executing the command `PRAGMA foreign_keys = ON;` immediately after opening the database connection. Failure to do so could lead to data corruption, such as having entries in `playlist_videos` that point to playlists or videos that no longer exist.
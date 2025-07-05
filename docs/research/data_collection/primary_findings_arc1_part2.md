# Arc 1: Primary Findings - Indexing and Query Optimization

## Finding 3: The Indexing Trade-Off

**Source(s):** Powersync Blog, Medium (Squeezing Performance), Android Developers

**Key Insight:** Indexes are the primary mechanism for improving query performance in SQLite, but they come at a cost to write performance (INSERT, UPDATE, DELETE). A balanced approach is required.

**Paraphrased Summary:**
For a media-heavy application like Playlistify, where reads (e.g., loading playlists, searching, filtering) are expected to be far more frequent than writes (e.g., adding a new playlist), a robust indexing strategy is critical.

*   **Performance Gain:** Indexes work like a book's index, allowing the database to quickly find rows that match a `WHERE` clause without scanning the entire table. This is essential for features like searching for videos by title or filtering playlists.
*   **Performance Cost:** Every time a row is added, updated, or deleted, the database must also update every index that includes that row. This can significantly slow down bulk operations like importing a large playlist. The performance penalty can be as much as a 5x reduction in insert speed for each secondary index.

**Recommendation:** Indexes should be added judiciously to columns that are frequently used in `WHERE` clauses, `JOIN` conditions, and for `ORDER BY` operations.

---

## Finding 4: Strategic Indexing for Common Queries

**Source(s):** SQLite Query Optimizer Overview, Android Developers

**Key Insight:** The most effective indexing strategy is to create indexes specifically for the most common and performance-critical queries the application will execute.

**Paraphrased Summary:**
Based on the proposed schema and expected application features, the following indexes are recommended as a starting point:

1.  **On the `videos` table:**
    *   `CREATE INDEX idx_videos_title ON videos (title);`
        *   **Reason:** To accelerate text-based searches for videos by their title. The SQLite Query Optimizer can use this index for `LIKE` queries, but it is most effective when the search term does not start with a wildcard (`%`).
    *   `CREATE INDEX idx_videos_author ON videos (author);`
        *   **Reason:** To allow for efficient filtering or searching by the video's author/channel.

2.  **On the `playlists` table:**
    *   `CREATE INDEX idx_playlists_name ON playlists (name);`
        *   **Reason:** To speed up searching for playlists by name.

3.  **On the `playlist_videos` junction table:**
    *   **Crucially, SQLite automatically creates indexes on primary keys and foreign keys in many cases, but creating explicit indexes on foreign key columns is a best practice.**
    *   `CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos (playlist_id);`
        *   **Reason:** This is vital for quickly retrieving all videos belonging to a specific playlist. It optimizes the `JOIN` operation when you query for the contents of a single playlist.
    *   `CREATE INDEX idx_playlist_videos_video_id ON playlist_videos (video_id);`
        *   **Reason:** This is useful for finding all playlists that contain a specific video.

**Note:** The query planner might not always use an index if it determines a full table scan would be faster (e.g., on very small tables). It's important to use `EXPLAIN QUERY PLAN` during development to verify that indexes are being used as expected for critical queries.
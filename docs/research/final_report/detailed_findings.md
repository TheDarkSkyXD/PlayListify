# Final Report: Detailed Findings

This section provides a comprehensive summary of all primary findings generated during the research process, organized by their respective research arc.

---

### Arc 1: Local Media Library Management

**Finding 1: The Junction Table Model for Many-to-Many Relationships**
The standard and most robust method for modeling the relationship between playlists and videos is to use a three-table structure: a `playlists` table, a `videos` table, and a `playlist_videos` junction table to link them. This prevents data redundancy and provides a scalable way to manage complex relationships.

**Finding 2: SQLite Foreign Key Constraint Requirement**
SQLite does not enforce foreign key constraints by default. To ensure data integrity, every database connection must be explicitly configured with `PRAGMA foreign_keys = ON;`.

**Finding 3: The Indexing Trade-Off**
Indexes are critical for read performance but incur a cost on write performance. For a read-heavy application like Playlistify, a proactive indexing strategy is essential, accepting the write-performance trade-off for a much more responsive user experience.

**Finding 4: Strategic Indexing for Common Queries**
Indexes should be created specifically for columns used in frequent `WHERE` clauses, `JOIN` conditions, and `ORDER BY` operations. This includes the foreign key columns in the junction table and any text fields that will be used for searching (e.g., `videos.title`).

**Finding 5: Hybrid Directory Structure for Scalability and Usability**
The optimal file storage strategy is a hybrid model. User-facing directories should be human-readable (based on playlist titles), but the actual media files should be stored in a nested, performance-optimized structure based on a unique ID (e.g., `.../media/d7/f5/d7f5ae9b7c5a.mp4`) to prevent file system bottlenecks.

**Finding 6: Consistent and Sanitized Naming Conventions**
All user-provided names (like playlist titles) must be sanitized to remove invalid file system characters before being used to create directories.

**Finding 7: SQLite as the Definitive Source of Truth**
For managing core application metadata, SQLite is unequivocally superior to file-based systems like JSON sidecar files or embedded ID3 tags due to its performance, data integrity guarantees, and powerful querying capabilities.

**Finding 8: The Need for an External Migration Library**
`better-sqlite3` does not include a built-in migration system. A dedicated, external library (like `node-pg-migrate` or `knex`) is required to manage database schema changes in a structured and automated way.

**Finding 9: The Critical Role of Transactions for Bulk Operations**
Wrapping multiple `INSERT` statements in a single transaction is the most critical optimization for bulk operations. The `db.transaction()` method in `better-sqlite3` is the most efficient way to achieve this, providing a significant performance boost for tasks like importing large playlists.

---

### Arc 2: Robust Video Downloading and Conversion

**Finding 1: Recommended Baseline Command for Data Extraction and Downloading**
A standard set of `yt-dlp` command-line arguments should be used to ensure reliable downloads and metadata embedding. This includes using `--dump-json` for metadata-only fetches and a robust format selector (`-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`) combined with `--embed-metadata` and `--embed-thumbnail` for the actual download process.

**Finding 2: Strategy for a Robust Download Queue**
The `p-queue` library provides all necessary features for an efficient download manager. The implementation should include:
1.  **Configurable Concurrency:** A user-defined setting to control simultaneous downloads.
2.  **Task Prioritization:** A system where user-initiated single downloads have higher priority than background playlist downloads.
3.  **Queue Lifecycle Management:** Clear methods to pause, resume, and clear the queue.
4.  **State Persistence:** The application logic must save the queue state to the database before adding tasks to `p-queue` to ensure it can be restored after a restart.

---

### Arc 3: Secure API Integration and Settings

**Finding 1: The Use of `safeStorage` is Non-Negotiable**
Storing sensitive data (e.g., OAuth tokens) in plain text is a major security risk. It is mandatory to use Electron's native `safeStorage` API, which leverages the host OS's credential vault to encrypt the data before it is persisted by `electron-store`.

**Finding 2: The Context Bridge as a Secure IPC Gateway**
The fundamental principle of modern Electron security is to use a `preload` script with `contextIsolation` enabled. A limited, type-safe API must be exposed to the renderer process via `contextBridge`. This prevents the renderer from having direct access to Node.js primitives and is the only secure way to implement Inter-Process Communication.
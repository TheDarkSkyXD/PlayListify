# Primary Findings (Arc 1, Part 3): State Management & Persistence Patterns

*This document contains findings for Research Arc 1 related to database schema design for a `tasks` table.*

## Finding 1.5: Core Principles of Schema Design for a `tasks` Table

Designing an effective schema for a `tasks` table in SQLite involves balancing normalization, performance, and the specific query patterns of a task queue.

### Recommended Columns and Data Types:

A robust `tasks` table schema should include the following columns:

*   **`id`** (`TEXT` or `UUID`, `PRIMARY KEY`): A unique identifier for the task. Using a UUID generated at the application layer is recommended to prevent collisions and simplify task creation.
*   **`type`** (`TEXT`): A string identifying the type of task (e.g., 'DOWNLOAD_VIDEO', 'IMPORT_PLAYLIST_METADATA'). This is useful for routing the task to the correct handler.
*   **`status`** (`TEXT`): The current state of the task (e.g., 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'). Using a constrained set of text values is clear and flexible.
*   **`parentId`** (`TEXT`, `FOREIGN KEY` to `tasks(id)`): An optional field to establish parent-child relationships, crucial for batch operations like playlist downloads.
*   **`progress`** (`INTEGER` or `REAL`): A numerical value from 0 to 100 (or 0.0 to 1.0) to track task progress.
*   **`details`** (`TEXT` as `JSON`): A JSON blob to store task-specific parameters, such as a video URL, download quality, or destination path. This provides flexibility without needing to alter the schema for new task types.
*   **`result`** (`TEXT` as `JSON`): An optional JSON blob to store the outcome of a completed task, such as a file path or success message.
*   **`error`** (`TEXT`): A field to store error messages if a task fails.
*   **`created_at`** (`DATETIME` or `INTEGER`): Timestamp for when the task was created. Storing as an ISO 8601 string (`TEXT`) or Unix epoch (`INTEGER`) are both common.
*   **`updated_at`** (`DATETIME` or `INTEGER`): Timestamp for the last time the task record was modified.
*   **`completed_at`** (`DATETIME` or `INTEGER`): Timestamp for when the task reached a terminal state (completed or failed).
*   **`priority`** (`INTEGER`): A priority level for the task, allowing more important tasks to be processed first.

*   **Source:** [Best Practices for Database Schema Design in SQLite | MoldStud](https://moldstud.com/articles/p-best-practices-for-database-schema-design-in-sqlite) - Emphasizes the key decision of choosing the right data types for each column.

### Indexing Strategy:

To optimize performance for common queries, indexes should be created on columns that are frequently used in `WHERE` clauses:

*   **`status`:** This is the most critical index. It allows the task worker to efficiently query for the next available task (e.g., `WHERE status = 'QUEUED'`).
*   **`type`:** Useful for quickly finding all tasks of a specific type.
*   **`parentId`:** Speeds up queries for finding all children of a parent task.
*   **`created_at`:** Useful for ordering tasks or cleaning up old, completed tasks.

### Single Table vs. Multiple Tables:

For a task queue in SQLite, a single `tasks` table is generally sufficient and performant. Because SQLite locks the entire database file per write transaction, splitting the queue into multiple tables (e.g., `download_tasks`, `import_tasks`) provides no concurrency benefit and adds unnecessary complexity to the application logic. A single table design is simpler to query and manage.

*   **Source:** [SQLite User Forum: Building a queue based on SQLite](https://sqlite.org/forum/info/b047f5ef5b76edff) - Notes that because SQLite locks the entire database per write, multiple tables and a single table should perform roughly the same for a queue.

## Finding 1.6: Atomic Task Locking at the Row Level

A common challenge in task queues is ensuring that two workers do not pick up and process the same task simultaneously. A simple `SELECT` followed by an `UPDATE` is not atomic and can lead to race conditions.

A robust pattern to atomically lock a task for processing is:

1.  **Select a candidate task:** Find a task that is available (e.g., `status = 'QUEUED'`).
2.  **Attempt an atomic update:** Use a single `UPDATE` statement that attempts to claim the task. This update should include the original status in its `WHERE` clause.
3.  **Check the result:** Verify that the `UPDATE` statement affected one row. If it did, the worker has successfully claimed the task. If it affected zero rows, it means another worker claimed it in the intervening microseconds, and the current worker should try to get the next task.

**Example SQL Pattern:**
```sql
-- Worker tries to claim task 'task-123'
UPDATE tasks
SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP
WHERE id = 'task-123' AND status = 'QUEUED';
```
If this update returns a `changes` count of 1, the lock is successful.

An alternative pattern suggested for queues uses a temporary lock via a timestamp:
```sql
-- 1. Find an available item
SELECT item_id WHERE expire = 0;
-- 2. Attempt to claim it atomically
UPDATE SET expire = 'some_future_time' WHERE item_id = '$selected_item_id' AND expire = 0;
-- 3. Check if the UPDATE affected any rows.
```
This achieves the same goal of atomically "locking" a row for a specific worker.

*   **Source:** [You really don't need anything fancy to implement a queue using SQL. | Hacker News](https://news.ycombinator.com/item?id=27482402) - Describes the pattern of using an `UPDATE ... WHERE` clause to atomically claim a queue item.

## Finding 1.7: IPC as the Synchronization Mechanism for UI Caching

In an Electron application, the backend (main process) has exclusive access to the SQLite database. The frontend (renderer process) runs in a separate, sandboxed environment. Therefore, the database itself is the definitive source of truth, and any in-memory cache on the frontend is purely a performance optimization that must be kept synchronized.

The standard and most secure pattern for this synchronization is:

1.  **Backend Owns the Data:** All database modifications (reads and writes) are handled exclusively by the main process.
2.  **Frontend Requests Data:** The UI requests the initial state or a list of tasks from the backend via an IPC call. The backend queries the database and returns the results, which the frontend can cache in memory (e.g., in a React Query or Zustand store).
3.  **Backend Pushes Updates:** When a task's state changes in the database (e.g., progress update, status change), the backend's service logic (e.g., `BackgroundTaskService`) emits an event.
4.  **IPC Broadcast:** This event is broadcast to the renderer process via an IPC channel (e.g., `mainWindow.webContents.send('task:update', updatedTask)`).
5.  **Frontend Cache Updates:** The frontend listens for these IPC events and updates its in-memory cache with the new data, which causes the UI to re-render and display the changes in near real-time.

This push-based model avoids the need for the frontend to constantly poll the backend for changes, making it highly efficient. The database remains the single source of truth, and the frontend's cache is a reactive reflection of its state.

*   **Source:** [r/electronjs on Reddit: Is it possible to use SQLite in an Electron app and support real-time updates...](https://www.reddit.com/r/electronjs/comments/1lig2gx/is_it_possible_to_use_sqlite_in_an_electron_app/) - Explicitly mentions the need to "send the data from SQLite to your Renderer process via IPC."
*   **Source:** [RxDB - Electron Database](https://rxdb.info/electron-database.html) - Describes building "offline-first apps that sync in real time," which reinforces the pattern of a backend database synchronizing with a frontend.
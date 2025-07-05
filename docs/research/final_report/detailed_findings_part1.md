# Detailed Findings: Arc 1 - State Management & Persistence

*This section details the specific findings related to the reliable storage and management of task data.*

### Finding 1.1: Atomic State Updates via SQLite Transactions
The most fundamental strategy for ensuring consistent and reliable persistence of task state in SQLite is the use of **ACID-compliant transactions**. SQLite guarantees that all operations wrapped within a transaction are atomic, meaning they either all complete successfully or none of them do. This prevents the database from ever entering an inconsistent state, even in the event of a program crash or power failure during the transaction. A typical state change, such as moving a task from "queued" to "running" and setting its start time, should be performed within a single transaction block.

### Finding 1.2: The Persistent Queue Pattern
For a Node.js environment, a common and effective pattern is to abstract the task management logic into a **persistent queue** backed by SQLite. Instead of managing database transactions directly for every task operation, a dedicated queueing library can handle the process of enqueuing, processing, and ensuring persistence through application restarts or crashes.

### Finding 1.3: Handling Database Locks with a Work Queue
When dealing with potential database contention (e.g., `SQLITE_BUSY` errors), a common strategy is to implement a **deferred execution work queue**. If a database operation is attempted while the database is locked, instead of failing immediately, the operation is placed into an in-memory queue to be attempted again sequentially once the database becomes available.

### Finding 1.4: Write-Through vs. Write-Back Caching
A hybrid approach is the most practical solution for a task management service:
*   **Write-Through (High Integrity):** Use for critical, low-frequency state transitions (e.g., `CREATE`, `START`, `FAIL`, `COMPLETE`) to ensure they are immediately persisted to disk.
*   **Write-Back (High Performance):** Use for non-critical, high-frequency updates (e.g., progress percentages), where losing the absolute latest value in a crash is acceptable. These updates can be batched and flushed to the database periodically.

### Finding 1.5: Core Schema Design Principles
A robust `tasks` table schema should include columns for `id` (UUID), `type` (TEXT), `status` (TEXT), `parentId` (TEXT, FOREIGN KEY), `progress` (INTEGER), `details` (JSON), `result` (JSON), `error` (TEXT), timestamps, and `priority` (INTEGER). Key indexes should be placed on `status`, `type`, and `parentId`. For a task queue in SQLite, a single `tasks` table is generally sufficient and more performant than multiple tables due to database-level locking.

### Finding 1.6: Atomic Task Locking at the Row Level
To prevent two workers from processing the same task, a worker must atomically "claim" a task. This is achieved with a single `UPDATE` statement that includes the expected current status in the `WHERE` clause (e.g., `UPDATE tasks SET status = 'RUNNING' WHERE id = ? AND status = 'QUEUED'`). If the update affects one row, the lock is successful.

### Finding 1.7: IPC as the Synchronization Mechanism for UI Caching
In an Electron app, the backend main process owns the database. The only reliable pattern for UI updates is a push-based model where the backend broadcasts state changes to the frontend via IPC. The frontend listens for these events and updates its in-memory cache, which in turn re-renders the UI. The UI never queries the database directly.

### Finding 1.S1: Optimal Transaction Type
For a write-heavy task queue, `IMMEDIATE` transactions are superior to the default `DEFERRED` mode. An `IMMEDIATE` transaction acquires a lock as soon as it begins, signaling its intent to write and allowing SQLite to gracefully queue subsequent write requests, working effectively with the `busy_timeout` setting. This should be the default for all write operations in the task service.
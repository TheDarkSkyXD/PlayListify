# Detailed Findings: Arc 3 - Concurrency, Dependencies, and Scalability

*This section details the specific findings related to managing multiple tasks and ensuring the system performs well at scale.*

### Finding 3.1: Concurrency Models (`p-queue` vs. `worker_threads`)
The choice of concurrency model in Node.js depends on the task type.
*   **`worker_threads`** are for **CPU-bound** tasks, allowing heavy JavaScript computations to run in parallel on separate threads without blocking the main event loop.
*   **Task Queues (like `p-queue`)** are for **I/O-bound** tasks. They manage and limit the concurrency of asynchronous operations (like network requests or disk writes) within the single main thread, preventing the system from being overwhelmed.
For the "Playlistify" use case, which primarily involves I/O, a task queue is the correct and sufficient model.

### Finding 3.2: Managing Parent-Child Dependencies
The standard pattern for managing dependencies is to use a self-referencing foreign key (`parentId`) in the `tasks` table. This allows a parent task (e.g., a playlist download) to be linked to its multiple child tasks (e.g., individual video downloads). The application logic is then responsible for managing the flow, such as aggregating the progress of child tasks to update the parent's overall progress, or marking the parent as `COMPLETED_WITH_ERRORS` if any child fails.

### Finding 3.3: Preventing Circular Dependencies
To prevent deadlocks from circular dependencies (e.g., Task A depends on B, and B depends on A), the validation must occur at the application layer before a new dependency is saved. The standard algorithm is to model the tasks as a directed graph and use a **Depth-First Search (DFS)** to traverse the dependency chain. If the traversal encounters the original task, a cycle is detected, and the operation is rejected.

### Finding 3.4: SQLite Performance Tuning for a High-Write Environment
Several key optimizations are essential for a write-heavy SQLite database:
*   **Write-Ahead Logging (WAL) Mode:** This is the most critical optimization. Enabling `PRAGMA journal_mode = WAL;` allows read operations to occur concurrently with write operations, preventing the UI from freezing while background tasks are writing to the database.
*   **Batching Writes:** Wrapping multiple `UPDATE` or `INSERT` statements within a single `BEGIN`/`COMMIT` transaction is significantly faster than running them individually.
*   **`PRAGMA synchronous = NORMAL;`:** This setting provides a major performance boost over the default (`FULL`) with a minimal and often acceptable risk of data loss in the event of a full OS or power crash.
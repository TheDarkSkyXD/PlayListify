# Patterns Identified (First Pass: Arc 1)

*This document outlines the initial high-level patterns and architectural themes identified after the first research pass on Arc 1: State Management & Persistence.*

### Pattern 1: Transactional State Machine

The most dominant pattern is the use of the database as a transactional state machine.
*   **Description:** Every change in a task's lifecycle (e.g., from `QUEUED` to `RUNNING`) is encapsulated within a database transaction. This leverages SQLite's ACID guarantees to ensure that the state is always consistent and never left in a partial or invalid state.
*   **Supporting Findings:** 1.1, 1.6
*   **Implication:** The core logic of the task service should be built around executing atomic database transactions for all state transitions.

### Pattern 2: Service-Layer Abstraction of the Queue

Instead of having application logic directly interact with the `tasks` table, a common pattern is to abstract this interaction behind a "Queue Service" or a dedicated library.
*   **Description:** A service layer provides methods like `enqueue(task)`, `dequeue()`, and `updateProgress(taskId, progress)`. This service is responsible for handling the underlying database transactions and logic, decoupling the rest of the application from the database schema.
*   **Supporting Findings:** 1.2
*   **Implication:** The "Playlistify" application should implement a `BackgroundTaskService` that encapsulates all interactions with the `tasks` table, as specified in the blueprint. This aligns with industry best practices for building maintainable systems.

### Pattern 3: Hybrid Caching for Performance and Integrity

A clear pattern for balancing performance and data safety is to use a hybrid caching strategy.
*   **Description:** Use a write-through approach for critical, infrequent state changes (e.g., starting or completing a task) to ensure they are immediately persisted. Use a write-back approach for non-critical, high-frequency updates (e.g., progress percentages), batching them to reduce disk I/O.
*   **Supporting Findings:** 1.4
*   **Implication:** The task management service should differentiate between critical state changes and progress updates, applying the appropriate caching strategy to each to optimize both performance and reliability.

### Pattern 4: Unidirectional Data Flow via IPC for UI Synchronization

For Electron apps, there is a consistent architectural pattern for keeping the UI synchronized with the backend database.
*   **Description:** The backend main process owns the database and is the single source of truth. It pushes state changes to the frontend renderer process via IPC events. The frontend maintains a read-only in-memory cache that is updated reactively based on these events.
*   **Supporting Findings:** 1.7
*   **Implication:** The application architecture should strictly follow this pattern. The UI should never directly query or write to the database. All state changes must be initiated by an IPC call to the backend, and all UI updates should be driven by push events from the backend.

### Pattern 5: State-Driven Recovery

A consistent pattern for resilience is to use the persisted state in the database to drive recovery actions upon startup.
*   **Description:** Instead of trying to reconstruct application state from external logs, the application treats the `tasks` table as the source of truth. On startup, it queries the table for any tasks left in a non-terminal state (e.g., `RUNNING`) and takes a predefined action, such as re-queuing them or marking them as failed.
*   **Supporting Findings:** 2.4
*   **Implication:** The application's startup sequence must include a "task recovery" step that queries the database and cleans up any tasks that were interrupted.

### Pattern 6: Idempotent Consumer

To prevent duplicate work when tasks are retried, the "Idempotent Consumer" pattern is standard.
*   **Description:** The service that executes the task (the consumer) is responsible for ensuring idempotency. It does this by keeping a record of the unique IDs of tasks it has already successfully completed. Before executing a task, it checks this record to see if the work has already been done.
*   **Supporting Findings:** 2.5
*   **Implication:** The task execution logic must include a step to check for and discard duplicate task IDs to enable safe, "at-least-once" delivery semantics in the queue.

### Pattern 7: Checkpointing for Long-Running, Divisible Tasks

For tasks that are very long-running and whose progress can be broken into discrete steps (like downloading a large file), checkpointing is a key resilience pattern.
*   **Description:** The task periodically saves its progress (e.g., bytes downloaded) to its record in the database. If the task is interrupted, the recovery process can use this saved checkpoint to resume the work from where it left off, rather than starting from the beginning.
*   **Supporting Findings:** 2.1
*   **Implication:** For tasks that fit this profile, the `details` field of the `tasks` table should be structured to store checkpoint data, and the task runner must be able to interpret this data to resume execution.

### Pattern 8: Built-in Timeout for Contention Handling

For handling transient database locks (`SQLITE_BUSY`), the most direct pattern is to use the database driver's built-in busy timeout feature.
*   **Description:** Instead of building complex retry logic in the application, a timeout is configured at the connection level. The database driver will automatically retry operations for the specified duration if the database is locked, simplifying the application code significantly.
*   **Supporting Findings:** 2.3
*   **Implication:** The database connection should be configured with a sensible busy timeout as a first-line defense against contention issues.

### Pattern 9: Appropriate Concurrency Model Selection

There is a clear distinction in concurrency models based on the type of work being done.
*   **Description:** For I/O-bound tasks (like network requests or disk access), a task queue that manages concurrency within a single thread is the correct model. For CPU-bound tasks (heavy computation in JavaScript), `worker_threads` are the correct model to avoid blocking the main event loop.
*   **Supporting Findings:** 3.1
*   **Implication:** The "Playlistify" project's use of `p-queue` for managing downloads is the correct architectural choice. `worker_threads` are not necessary for the currently defined tasks.

### Pattern 10: Hierarchical Data Modeling for Dependencies

The standard pattern for representing task dependencies is to model the data hierarchically within a single table.
*   **Description:** A self-referencing foreign key (`parentId`) is used to link child tasks to a parent. This allows for the creation of task graphs or flows.
*   **Supporting Findings:** 3.2
*   **Implication:** The `tasks` table schema should include a `parentId` column to support batch operations like playlist downloads, where the playlist is the parent and individual videos are the children.

### Pattern 11: Application-Layer Cycle Detection

To prevent deadlocks from circular dependencies, the validation must occur at the application layer before a dependency is created.
*   **Description:** The dependencies are treated as a directed graph, and a graph traversal algorithm (like Depth-First Search) is used to check for cycles before committing a new dependency to the database.
*   **Supporting Findings:** 3.3
*   **Implication:** The service responsible for managing task dependencies must include a cycle detection algorithm that runs before any new dependency is saved.

### Pattern 12: WAL Mode as a Foundational Performance Optimization

For any SQLite database with concurrent readers and writers, enabling Write-Ahead Logging (WAL) is the most critical performance optimization.
*   **Description:** WAL mode allows read operations to occur simultaneously with write operations, dramatically increasing concurrency and preventing the UI from freezing while background tasks are writing to the database.
*   **Supporting Findings:** 3.4
*   **Implication:** The application must enable WAL mode on its SQLite connection as a baseline requirement for good performance.
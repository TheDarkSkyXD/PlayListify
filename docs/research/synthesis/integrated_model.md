# An Integrated Model for a Persistent Backend Task Service

*This document synthesizes the findings from all research arcs into a single, coherent architectural model for the "Playlistify" persistent backend task management service.*

## 1. Core Components

The integrated model consists of three core components that work together:

1.  **The Task Database (`tasks.db`):** A single SQLite database file that acts as the persistent, single source of truth for all task-related information.
2.  **The Task Service (`BackgroundTaskService.ts`):** A backend service that encapsulates all logic for interacting with the task database. It is the only component that directly queries or modifies the database.
3.  **The Task Queue (`p-queue`):** An in-memory queue that controls the concurrency of I/O-bound task execution.

## 2. The Task Lifecycle & State Machine

The system is modeled as a transactional state machine, driven by changes to the `status` field in the `tasks` table.

1.  **Creation (`QUEUED`):** A new task is created by inserting a row into the `tasks` table with a `status` of `QUEUED`. This is an atomic operation and serves as the "journal entry" for the task.
2.  **Execution (`RUNNING`):** The Task Queue dequeues a task and, in a single `IMMEDIATE` transaction, updates its status to `RUNNING`. This atomic update acts as a lock, preventing other workers from picking up the same task.
3.  **Progress Updates:** During execution, non-critical progress updates are sent to the Task Service. The service can use a **hybrid caching** strategy: batching these updates and flushing them to the database periodically in a single transaction to reduce disk I/O.
4.  **Completion (`COMPLETED` / `FAILED`):** Upon completion, the worker notifies the Task Service, which atomically updates the task's status to its terminal state (`COMPLETED` or `FAILED`) and logs the result or error.

## 3. Resilience and Recovery Model

The system's resilience is built on several layers:

1.  **Database-Level Resilience:**
    *   **WAL Mode:** The SQLite database **must** be configured to use Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) to allow the UI to read the database while background tasks are writing to it.
    *   **Busy Timeout:** The database connection **must** be configured with a busy timeout (e.g., 5000ms) to gracefully handle transient database locks without throwing immediate `SQLITE_BUSY` errors.
2.  **Application-Level Recovery:**
    *   **State-Driven Recovery:** On application startup, the Task Service **must** query the database for any tasks left in a `RUNNING` state. These tasks are considered interrupted.
    *   **Safe Re-queue:** Interrupted tasks should be atomically updated back to `QUEUED` to be processed again.
    *   **Idempotency:** To ensure that re-queued tasks do not cause duplicate work, all task execution logic **must** be idempotent. This is achieved by having the worker check a separate `processed_task_ids` table before executing its core logic (the "Idempotent Consumer" pattern).
    *   **Checkpointing:** For long-running, divisible tasks like large file downloads, the task should periodically save its progress (e.g., bytes downloaded) to the `details` JSON blob. The recovery logic can then use this checkpoint to resume the task from where it left off.

## 4. Concurrency and Dependency Model

1.  **Concurrency Control:** Task concurrency is managed by the `p-queue` instance. This is appropriate for the I/O-bound nature of the tasks (downloads, database writes) and does not require the complexity of `worker_threads`.
2.  **Dependency Management:**
    *   **Schema:** Parent-child relationships are managed via a `parentId` column in the `tasks` table.
    *   **Validation:** Circular dependencies **must** be checked at the application layer using a Depth-First Search (DFS) graph traversal *before* a new dependency is committed to the database.

This integrated model provides a robust, resilient, and performant foundation for the "Playlistify" backend task management service, aligning with the findings from all three research arcs.